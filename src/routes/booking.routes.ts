import { BookingStatus, DiscountType, PaymentStatus, Prisma } from "@prisma/client";
import { Router } from "express";
import { serviceLocations } from "../constants/service-locations";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { handleControllerError, sendSuccess } from "../utils/error-handler";
import {
  parseOptionalDate,
  parseOptionalInt,
  parseOptionalString,
  parseRequiredInt,
  validateRequestBodyFields,
} from "../utils/request-parsers";

const bookingRouter = Router();

function parseRequiredPositiveInt(value: unknown, fieldName: string) {
  const parsed = parseRequiredInt(value, fieldName);

  if (parsed < 1) {
    throw new ApiError(400, `${fieldName} must be greater than or equal to 1.`);
  }

  return parsed;
}

function toNumber(value: Prisma.Decimal | number | string | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

function money(value: number) {
  return new Prisma.Decimal(Number(value.toFixed(2)));
}

function parseOptionalBookingStatus(value: unknown): BookingStatus | undefined {
  const text = parseOptionalString(value);

  if (!text) {
    return undefined;
  }

  if (!Object.values(BookingStatus).includes(text as BookingStatus)) {
    throw new ApiError(400, "bookingStatus is not valid.");
  }

  return text as BookingStatus;
}

function parseRequiredBookingStatus(value: unknown): BookingStatus {
  const status = parseOptionalBookingStatus(value);

  if (!status) {
    throw new ApiError(400, "bookingStatus is required.");
  }

  return status;
}

function shouldIncludeDeleted(query: Record<string, unknown>) {
  return query.includeDeleted === true || query.includeDeleted === "true" || query.includeDeleted === "1";
}

function parseOptionalCoordinate(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ApiError(400, `${fieldName} must be a valid number.`);
  }

  if (fieldName === "latitude" && (parsed < -90 || parsed > 90)) {
    throw new ApiError(400, "latitude must be between -90 and 90.");
  }

  if (fieldName === "longitude" && (parsed < -180 || parsed > 180)) {
    throw new ApiError(400, "longitude must be between -180 and 180.");
  }

  return parsed;
}

function normalizeServiceAddressSnapshot(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "serviceAddressSnapshot must be an object.");
  }

  const snapshot = value as Record<string, unknown>;
  const cityCode = typeof snapshot.cityCode === "string" ? snapshot.cityCode.trim().toUpperCase() : undefined;
  const cityName = typeof snapshot.city === "string" ? snapshot.city.trim().toUpperCase() : undefined;
  const location = serviceLocations.find(
    (item) => item.sCode === cityCode || item.sName.toUpperCase() === cityName,
  );

  if (!location) {
    throw new ApiError(400, "Service is currently available only in Patna, Ranchi, and Lucknow.");
  }

  const latitude = parseOptionalCoordinate(snapshot.latitude, "latitude") ?? location.latitude;
  const longitude = parseOptionalCoordinate(snapshot.longitude, "longitude") ?? location.longitude;
  const normalized: Record<string, Prisma.InputJsonValue> = {};

  for (const [key, rawValue] of Object.entries(snapshot)) {
    if (rawValue !== undefined) {
      normalized[key] = rawValue as Prisma.InputJsonValue;
    }
  }

  normalized.cityCode = location.sCode;
  normalized.city = location.sName;
  normalized.state = location.state;
  normalized.country = location.country;
  normalized.latitude = latitude;
  normalized.longitude = longitude;

  return normalized;
}

async function resolveCoupon(input: {
  iCouponMasterId?: number;
  couponCode?: string;
  serviceId: number;
  baseAmount: number;
}) {
  if (!input.iCouponMasterId && !input.couponCode) {
    return {
      coupon: null,
      discountAmount: 0,
    };
  }

  const now = new Date();
  const coupon = await prisma.mCoupons.findFirst({
    where: {
      iMasterId: input.iCouponMasterId,
      sCode: input.couponCode,
      isActive: true,
      isDeleted: false,
      startAt: { lte: now },
      endAt: { gte: now },
    },
    include: {
      serviceMappings: {
        where: {
          isActive: true,
          isDeleted: false,
        },
      },
    },
  });

  if (!coupon) {
    throw new ApiError(404, "Coupon not found or not active for current date.");
  }

  if (coupon.minOrderAmount && input.baseAmount < toNumber(coupon.minOrderAmount)) {
    throw new ApiError(400, "Coupon minimum order amount is not satisfied.");
  }

  const mappedServiceIds = coupon.serviceMappings.map((mapping) => mapping.iServiceMasterId);
  if (mappedServiceIds.length > 0 && !mappedServiceIds.includes(input.serviceId)) {
    throw new ApiError(400, "Coupon is not applicable for this service.");
  }

  const rawDiscount =
    coupon.discountType === DiscountType.PERCENTAGE
      ? (input.baseAmount * toNumber(coupon.discountValue)) / 100
      : toNumber(coupon.discountValue);
  const maxDiscount = coupon.maxDiscountAmount ? toNumber(coupon.maxDiscountAmount) : rawDiscount;
  const discountAmount = Math.min(rawDiscount, maxDiscount, input.baseAmount);

  return {
    coupon,
    discountAmount,
  };
}

async function calculateBookingPricing(input: {
  serviceId?: number;
  quantity: number;
  iCouponMasterId?: number;
  couponCode?: string;
}) {
  if (!input.serviceId) {
    return {
      service: null,
      coupon: null,
      couponCode: input.couponCode,
      baseAmount: 0,
      discountAmount: 0,
      taxAmount: 0,
      finalAmount: 0,
    };
  }

  const service = await prisma.mServices.findFirst({
    where: { iMasterId: input.serviceId, isDeleted: false },
    select: {
      iMasterId: true,
      basePrice: true,
      salePrice: true,
      taxPercentage: true,
      minQuantity: true,
      maxQuantity: true,
      isActive: true,
    },
  });

  if (!service || !service.isActive) {
    throw new ApiError(404, "Active service not found.");
  }

  if (input.quantity < service.minQuantity) {
    throw new ApiError(400, `quantity must be at least ${service.minQuantity}.`);
  }

  if (service.maxQuantity && input.quantity > service.maxQuantity) {
    throw new ApiError(400, `quantity must be less than or equal to ${service.maxQuantity}.`);
  }

  const unitPrice = toNumber(service.salePrice ?? service.basePrice);
  const baseAmount = unitPrice * input.quantity;
  const couponResult = await resolveCoupon({
    iCouponMasterId: input.iCouponMasterId,
    couponCode: input.couponCode,
    serviceId: input.serviceId,
    baseAmount,
  });

  const taxableAmount = baseAmount - couponResult.discountAmount;
  const taxAmount = service.taxPercentage
    ? (taxableAmount * toNumber(service.taxPercentage)) / 100
    : 0;
  const finalAmount = taxableAmount + taxAmount;

  return {
    service,
    coupon: couponResult.coupon,
    couponCode: couponResult.coupon?.sCode ?? input.couponCode,
    baseAmount,
    discountAmount: couponResult.discountAmount,
    taxAmount,
    finalAmount,
  };
}

function ensureBookingCanBeConfirmed(input: {
  iServiceMasterId?: number | null;
  serviceAddressSnapshot?: unknown;
  scheduledStartAt?: Date | null;
}) {
  if (!input.iServiceMasterId) {
    throw new ApiError(400, "Cannot confirm booking without selecting a service.");
  }

  if (!input.serviceAddressSnapshot) {
    throw new ApiError(400, "Cannot confirm booking without service address/location.");
  }

  if (!input.scheduledStartAt) {
    throw new ApiError(400, "Cannot confirm booking without scheduled date/time.");
  }
}

bookingRouter.post("/", async (req, res) => {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: [
        "bookingNo",
        "iCustomerUserMasterId",
        "iServiceMasterId",
        "quantity",
        "iAddressMasterId",
        "serviceAddressSnapshot",
        "iSlotMasterId",
        "scheduledStartAt",
        "scheduledEndAt",
        "iSubscriptionMasterId",
        "iCouponMasterId",
        "couponCode",
        "requestedServiceName",
        "bookingStatus",
        "holdReason",
        "cancelReason",
        "remarks",
      ],
      requiredFields: ["iCustomerUserMasterId"],
    });

    const iCustomerUserMasterId = parseRequiredInt(req.body.iCustomerUserMasterId, "iCustomerUserMasterId");
    const iServiceMasterId = parseOptionalInt(req.body.iServiceMasterId, "iServiceMasterId");
    const quantity = req.body.quantity
      ? parseRequiredPositiveInt(req.body.quantity, "quantity")
      : 1;
    const serviceAddressSnapshot = normalizeServiceAddressSnapshot(req.body.serviceAddressSnapshot);
    const couponCode = parseOptionalString(req.body.couponCode);
    const iCouponMasterId = parseOptionalInt(req.body.iCouponMasterId, "iCouponMasterId");
    const requestedServiceName = parseOptionalString(req.body.requestedServiceName);
    const requestedBookingStatus = parseOptionalBookingStatus(req.body.bookingStatus);
    const scheduledStartAt = parseOptionalDate(req.body.scheduledStartAt, "scheduledStartAt");
    const scheduledEndAt = parseOptionalDate(req.body.scheduledEndAt, "scheduledEndAt");
    const bookingStatus =
      requestedBookingStatus ??
      (iServiceMasterId && serviceAddressSnapshot && scheduledStartAt
        ? BookingStatus.CONFIRMED
        : BookingStatus.HOLD);

    if (bookingStatus === BookingStatus.CONFIRMED) {
      ensureBookingCanBeConfirmed({
        iServiceMasterId,
        serviceAddressSnapshot,
        scheduledStartAt,
      });
    }

    const pricing = await calculateBookingPricing({
      serviceId: iServiceMasterId,
      quantity,
      iCouponMasterId,
      couponCode,
    });

    const booking = await prisma.tBookings.create({
      data: {
        bookingNo: parseOptionalString(req.body.bookingNo) ?? `BK-${Date.now()}`,
        iCustomerUserMasterId,
        iServiceMasterId,
        requestedServiceName,
        quantity,
        iAddressMasterId: parseOptionalInt(req.body.iAddressMasterId, "iAddressMasterId"),
        serviceAddressSnapshot,
        iSlotMasterId: parseOptionalInt(req.body.iSlotMasterId, "iSlotMasterId"),
        scheduledStartAt,
        scheduledEndAt,
        iSubscriptionMasterId: parseOptionalInt(req.body.iSubscriptionMasterId, "iSubscriptionMasterId"),
        iCouponMasterId: pricing.coupon?.iMasterId,
        couponCode: pricing.couponCode,
        baseAmount: money(pricing.baseAmount),
        discountAmount: money(pricing.discountAmount),
        taxAmount: money(pricing.taxAmount),
        finalAmount: money(pricing.finalAmount),
        paymentStatus: PaymentStatus.PENDING,
        bookingStatus,
        confirmedAt: bookingStatus === BookingStatus.CONFIRMED ? new Date() : null,
        holdReason:
          bookingStatus === BookingStatus.HOLD
            ? parseOptionalString(req.body.holdReason) ?? "Booking saved on hold."
            : null,
        cancelledAt: bookingStatus === BookingStatus.CANCELLED ? new Date() : null,
        cancelReason:
          bookingStatus === BookingStatus.CANCELLED
            ? parseOptionalString(req.body.cancelReason) ?? "Booking cancelled during creation."
            : null,
        isActive: bookingStatus !== BookingStatus.CANCELLED,
        remarks: parseOptionalString(req.body.remarks),
      },
      include: {
        service: true,
        customer: {
          select: {
            iMasterId: true,
            username: true,
            firstName: true,
            middleName: true,
            lastName: true,
            email: true,
            mobileNo: true,
          },
        },
        slot: true,
        coupon: true,
      },
    });

    sendSuccess(res, 201, "Booking created successfully.", booking);
  } catch (error) {
    handleControllerError(res, error);
  }
});

bookingRouter.get("/", async (req, res) => {
  try {
    const bookings = await prisma.tBookings.findMany({
      where: {
        iCustomerUserMasterId: parseOptionalInt(req.query.iCustomerUserMasterId, "iCustomerUserMasterId"),
        iServiceMasterId: parseOptionalInt(req.query.iServiceMasterId, "iServiceMasterId"),
        bookingStatus: parseOptionalString(req.query.bookingStatus) as BookingStatus | undefined,
        paymentStatus: parseOptionalString(req.query.paymentStatus) as PaymentStatus | undefined,
        isDeleted: shouldIncludeDeleted(req.query) ? undefined : false,
      },
      orderBy: { iTransId: "desc" },
      include: {
        service: true,
        customer: {
          select: {
            iMasterId: true,
            username: true,
            firstName: true,
            middleName: true,
            lastName: true,
            email: true,
            mobileNo: true,
          },
        },
        slot: true,
        coupon: true,
        assignments: { where: { isDeleted: false } },
        payments: { where: { isDeleted: false } },
        images: { where: { isDeleted: false } },
        ratings: { where: { isDeleted: false } },
      },
    });

    sendSuccess(
      res,
      200,
      bookings.length === 0 ? "No bookings found." : "Bookings fetched successfully.",
      bookings,
    );
  } catch (error) {
    handleControllerError(res, error);
  }
});

bookingRouter.get("/:id", async (req, res) => {
  try {
    const iTransId = parseRequiredInt(req.params.id, "id");
    const booking = await prisma.tBookings.findFirst({
      where: { iTransId, isDeleted: shouldIncludeDeleted(req.query) ? undefined : false },
      include: {
        service: true,
        customer: true,
        address: true,
        slot: true,
        subscription: true,
        coupon: true,
        assignments: { where: { isDeleted: false } },
        payments: { where: { isDeleted: false } },
        images: { where: { isDeleted: false } },
        ratings: { where: { isDeleted: false } },
      },
    });

    if (!booking) {
      throw new ApiError(404, "Booking not found.");
    }

    sendSuccess(res, 200, "Booking fetched successfully.", booking);
  } catch (error) {
    handleControllerError(res, error);
  }
});

bookingRouter.patch("/:id/restore", async (req, res) => {
  try {
    const iTransId = parseRequiredInt(req.params.id, "id");
    const booking = await prisma.tBookings.update({
      where: { iTransId },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedByUserMasterId: null,
        isActive: true,
      },
    });

    sendSuccess(res, 200, "Booking restored successfully.", booking);
  } catch (error) {
    handleControllerError(res, error);
  }
});

bookingRouter.patch("/:id/status", async (req, res) => {
  try {
    const iTransId = parseRequiredInt(req.params.id, "id");
    validateRequestBodyFields(req.body, {
      allowedFields: ["bookingStatus", "holdReason", "cancelReason", "remarks"],
      requiredFields: ["bookingStatus"],
    });

    const bookingStatus = parseRequiredBookingStatus(req.body.bookingStatus);
    const workflowStatuses = new Set<BookingStatus>([
      BookingStatus.CONFIRMED,
      BookingStatus.HOLD,
      BookingStatus.CANCELLED,
    ]);

    if (!workflowStatuses.has(bookingStatus)) {
      throw new ApiError(400, "bookingStatus must be CONFIRMED, HOLD, or CANCELLED.");
    }

    const currentBooking = await prisma.tBookings.findFirst({
      where: { iTransId, isDeleted: false },
    });

    if (!currentBooking) {
      throw new ApiError(404, "Booking not found.");
    }

    if (bookingStatus === BookingStatus.CONFIRMED) {
      ensureBookingCanBeConfirmed({
        iServiceMasterId: currentBooking.iServiceMasterId,
        serviceAddressSnapshot: currentBooking.serviceAddressSnapshot,
        scheduledStartAt: currentBooking.scheduledStartAt,
      });
    }

    const booking = await prisma.tBookings.update({
      where: { iTransId },
      data: {
        bookingStatus,
        confirmedAt: bookingStatus === BookingStatus.CONFIRMED ? new Date() : currentBooking.confirmedAt,
        holdReason:
          bookingStatus === BookingStatus.HOLD
            ? parseOptionalString(req.body.holdReason) ?? currentBooking.holdReason ?? "Booking moved to hold."
            : bookingStatus === BookingStatus.CONFIRMED
              ? null
              : currentBooking.holdReason,
        cancelledAt: bookingStatus === BookingStatus.CANCELLED ? new Date() : currentBooking.cancelledAt,
        cancelReason:
          bookingStatus === BookingStatus.CANCELLED
            ? parseOptionalString(req.body.cancelReason) ?? "Booking cancelled."
            : currentBooking.cancelReason,
        isActive: bookingStatus !== BookingStatus.CANCELLED,
        remarks: parseOptionalString(req.body.remarks) ?? currentBooking.remarks,
      },
    });

    sendSuccess(res, 200, "Booking status updated successfully.", booking);
  } catch (error) {
    handleControllerError(res, error);
  }
});

bookingRouter.patch("/:id", async (req, res) => {
  try {
    const iTransId = parseRequiredInt(req.params.id, "id");
    validateRequestBodyFields(req.body, {
      allowedFields: [
        "iCustomerUserMasterId",
        "iServiceMasterId",
        "requestedServiceName",
        "quantity",
        "iAddressMasterId",
        "serviceAddressSnapshot",
        "paymentStatus",
        "bookingStatus",
        "scheduledStartAt",
        "scheduledEndAt",
        "iSlotMasterId",
        "iSubscriptionMasterId",
        "iCouponMasterId",
        "couponCode",
        "holdReason",
        "cancelReason",
        "remarks",
      ],
      atLeastOneFieldFrom: [
        "iCustomerUserMasterId",
        "iServiceMasterId",
        "requestedServiceName",
        "quantity",
        "iAddressMasterId",
        "serviceAddressSnapshot",
        "paymentStatus",
        "bookingStatus",
        "scheduledStartAt",
        "scheduledEndAt",
        "iSlotMasterId",
        "iSubscriptionMasterId",
        "iCouponMasterId",
        "couponCode",
        "holdReason",
        "cancelReason",
        "remarks",
      ],
    });

    const currentBooking = await prisma.tBookings.findFirst({
      where: { iTransId, isDeleted: false },
    });

    if (!currentBooking) {
      throw new ApiError(404, "Booking not found.");
    }

    const iServiceMasterId = Object.prototype.hasOwnProperty.call(req.body, "iServiceMasterId")
      ? parseOptionalInt(req.body.iServiceMasterId, "iServiceMasterId")
      : currentBooking.iServiceMasterId ?? undefined;
    const quantity = req.body.quantity
      ? parseRequiredPositiveInt(req.body.quantity, "quantity")
      : currentBooking.quantity;
    const couponCode = Object.prototype.hasOwnProperty.call(req.body, "couponCode")
      ? parseOptionalString(req.body.couponCode)
      : currentBooking.couponCode ?? undefined;
    const iCouponMasterId = Object.prototype.hasOwnProperty.call(req.body, "iCouponMasterId")
      ? parseOptionalInt(req.body.iCouponMasterId, "iCouponMasterId")
      : currentBooking.iCouponMasterId ?? undefined;
    const pricing = await calculateBookingPricing({
      serviceId: iServiceMasterId,
      quantity,
      iCouponMasterId,
      couponCode,
    });
    const serviceAddressSnapshot = Object.prototype.hasOwnProperty.call(req.body, "serviceAddressSnapshot")
      ? normalizeServiceAddressSnapshot(req.body.serviceAddressSnapshot)
      : undefined;
    const bookingStatus = parseOptionalBookingStatus(req.body.bookingStatus);
    const scheduledStartAt = Object.prototype.hasOwnProperty.call(req.body, "scheduledStartAt")
      ? parseOptionalDate(req.body.scheduledStartAt, "scheduledStartAt")
      : undefined;
    const scheduledEndAt = Object.prototype.hasOwnProperty.call(req.body, "scheduledEndAt")
      ? parseOptionalDate(req.body.scheduledEndAt, "scheduledEndAt")
      : undefined;
    const requestedServiceName = Object.prototype.hasOwnProperty.call(req.body, "requestedServiceName")
      ? parseOptionalString(req.body.requestedServiceName) ?? null
      : iServiceMasterId
        ? null
        : undefined;

    if (bookingStatus === BookingStatus.CONFIRMED) {
      ensureBookingCanBeConfirmed({
        iServiceMasterId,
        serviceAddressSnapshot: serviceAddressSnapshot ?? currentBooking.serviceAddressSnapshot,
        scheduledStartAt: scheduledStartAt ?? currentBooking.scheduledStartAt,
      });
    }

    const booking = await prisma.tBookings.update({
      where: { iTransId },
      data: {
        iCustomerUserMasterId: parseOptionalInt(req.body.iCustomerUserMasterId, "iCustomerUserMasterId"),
        iServiceMasterId,
        requestedServiceName,
        quantity,
        iAddressMasterId: parseOptionalInt(req.body.iAddressMasterId, "iAddressMasterId"),
        serviceAddressSnapshot,
        paymentStatus: parseOptionalString(req.body.paymentStatus) as PaymentStatus | undefined,
        bookingStatus,
        confirmedAt:
          bookingStatus === BookingStatus.CONFIRMED
            ? new Date()
            : bookingStatus === BookingStatus.HOLD
              ? null
              : undefined,
        holdReason:
          bookingStatus === BookingStatus.CONFIRMED
            ? null
            : bookingStatus === BookingStatus.HOLD
              ? parseOptionalString(req.body.holdReason) ?? currentBooking.holdReason ?? "Booking saved on hold."
              : parseOptionalString(req.body.holdReason),
        cancelledAt:
          bookingStatus === BookingStatus.CANCELLED
            ? new Date()
            : bookingStatus
              ? null
              : undefined,
        cancelReason:
          bookingStatus === BookingStatus.CANCELLED
            ? parseOptionalString(req.body.cancelReason) ?? "Booking cancelled."
            : bookingStatus
              ? null
              : parseOptionalString(req.body.cancelReason),
        isActive: bookingStatus ? bookingStatus !== BookingStatus.CANCELLED : undefined,
        scheduledStartAt,
        scheduledEndAt,
        iSlotMasterId: parseOptionalInt(req.body.iSlotMasterId, "iSlotMasterId"),
        iSubscriptionMasterId: parseOptionalInt(req.body.iSubscriptionMasterId, "iSubscriptionMasterId"),
        iCouponMasterId: pricing.coupon?.iMasterId,
        couponCode: pricing.couponCode,
        baseAmount: money(pricing.baseAmount),
        discountAmount: money(pricing.discountAmount),
        taxAmount: money(pricing.taxAmount),
        finalAmount: money(pricing.finalAmount),
        remarks: parseOptionalString(req.body.remarks),
      },
      include: {
        service: true,
        customer: {
          select: {
            iMasterId: true,
            username: true,
            firstName: true,
            middleName: true,
            lastName: true,
            email: true,
            mobileNo: true,
          },
        },
        slot: true,
        coupon: true,
      },
    });

    sendSuccess(res, 200, "Booking updated successfully.", booking);
  } catch (error) {
    handleControllerError(res, error);
  }
});

bookingRouter.delete("/:id", async (req, res) => {
  try {
    const iTransId = parseRequiredInt(req.params.id, "id");
    const booking = await prisma.tBookings.update({
      where: { iTransId },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
        deletedByUserMasterId: null,
      },
    });
    sendSuccess(res, 200, "Booking deleted successfully.", booking);
  } catch (error) {
    handleControllerError(res, error);
  }
});

export default bookingRouter;
