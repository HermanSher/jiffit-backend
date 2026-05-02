import { BookingStatus, PaymentStatus } from "@prisma/client";
import { Request, Response } from "express";
import { bookingService } from "./booking.service";
import { ApiError } from "../../utils/api-error";
import { handleControllerError, sendSuccess } from "../../utils/error-handler";
import {
  parseOptionalDate,
  parseOptionalInt,
  parseOptionalString,
  parseRequiredInt,
  validateRequestBodyFields,
} from "../../utils/request-parsers";

function parseRequiredPositiveInt(value: unknown, fieldName: string) {
  const parsed = parseRequiredInt(value, fieldName);
  if (parsed < 1) {
    throw new ApiError(400, `${fieldName} must be greater than or equal to 1.`);
  }
  return parsed;
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

export async function createBooking(req: Request, res: Response) {
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

    const serviceAddressSnapshot = bookingService.normalizeServiceAddressSnapshot(req.body.serviceAddressSnapshot);
    const booking = await bookingService.createBooking(
      {
        bookingNo: parseOptionalString(req.body.bookingNo),
        iCustomerUserMasterId: parseRequiredInt(req.body.iCustomerUserMasterId, "iCustomerUserMasterId"),
        iServiceMasterId: parseOptionalInt(req.body.iServiceMasterId, "iServiceMasterId"),
        quantity: req.body.quantity
          ? parseRequiredPositiveInt(req.body.quantity, "quantity")
          : 1,
        iAddressMasterId: parseOptionalInt(req.body.iAddressMasterId, "iAddressMasterId"),
        serviceAddressSnapshot,
        iSlotMasterId: parseOptionalInt(req.body.iSlotMasterId, "iSlotMasterId"),
        scheduledStartAt: parseOptionalDate(req.body.scheduledStartAt, "scheduledStartAt"),
        scheduledEndAt: parseOptionalDate(req.body.scheduledEndAt, "scheduledEndAt"),
        iSubscriptionMasterId: parseOptionalInt(req.body.iSubscriptionMasterId, "iSubscriptionMasterId"),
        iCouponMasterId: parseOptionalInt(req.body.iCouponMasterId, "iCouponMasterId"),
        couponCode: parseOptionalString(req.body.couponCode),
        requestedServiceName: parseOptionalString(req.body.requestedServiceName),
        bookingStatus: parseOptionalBookingStatus(req.body.bookingStatus),
        holdReason: parseOptionalString(req.body.holdReason),
        cancelReason: parseOptionalString(req.body.cancelReason),
        remarks: parseOptionalString(req.body.remarks),
      },
      req.authUser,
    );

    sendSuccess(res, 201, "Booking created successfully.", booking);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getBookings(req: Request, res: Response) {
  try {
    const bookings = await bookingService.getBookings({
      iCustomerUserMasterId: parseOptionalInt(req.query.iCustomerUserMasterId, "iCustomerUserMasterId"),
      iServiceMasterId: parseOptionalInt(req.query.iServiceMasterId, "iServiceMasterId"),
      bookingStatus: parseOptionalString(req.query.bookingStatus) as BookingStatus | undefined,
      paymentStatus: parseOptionalString(req.query.paymentStatus) as PaymentStatus | undefined,
      includeDeleted: shouldIncludeDeleted(req.query),
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
}

export async function getBookingById(req: Request, res: Response) {
  try {
    const iTransId = parseRequiredInt(req.params.id, "id");
    const booking = await bookingService.getBookingById(iTransId, shouldIncludeDeleted(req.query));
    sendSuccess(res, 200, "Booking fetched successfully.", booking);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function restoreBooking(req: Request, res: Response) {
  try {
    const iTransId = parseRequiredInt(req.params.id, "id");
    const booking = await bookingService.restoreBooking(iTransId);
    sendSuccess(res, 200, "Booking restored successfully.", booking);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function updateBookingStatus(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["bookingStatus", "holdReason", "cancelReason", "remarks"],
      requiredFields: ["bookingStatus"],
    });

    const iTransId = parseRequiredInt(req.params.id, "id");
    const booking = await bookingService.updateBookingStatus(
      iTransId,
      {
        bookingStatus: parseRequiredBookingStatus(req.body.bookingStatus),
        holdReason: parseOptionalString(req.body.holdReason),
        cancelReason: parseOptionalString(req.body.cancelReason),
        remarks: parseOptionalString(req.body.remarks),
      },
      req.authUser,
    );

    sendSuccess(res, 200, "Booking status updated successfully.", booking);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function updateBooking(req: Request, res: Response) {
  try {
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

    const iTransId = parseRequiredInt(req.params.id, "id");
    const serviceAddressSnapshot = Object.prototype.hasOwnProperty.call(req.body, "serviceAddressSnapshot")
      ? bookingService.normalizeServiceAddressSnapshot(req.body.serviceAddressSnapshot) ?? null
      : undefined;

    const booking = await bookingService.updateBooking(
      iTransId,
      {
        iCustomerUserMasterId: parseOptionalInt(req.body.iCustomerUserMasterId, "iCustomerUserMasterId"),
        iServiceMasterId: Object.prototype.hasOwnProperty.call(req.body, "iServiceMasterId")
          ? parseOptionalInt(req.body.iServiceMasterId, "iServiceMasterId") ?? null
          : undefined,
        requestedServiceName: Object.prototype.hasOwnProperty.call(req.body, "requestedServiceName")
          ? parseOptionalString(req.body.requestedServiceName) ?? null
          : undefined,
        quantity: req.body.quantity
          ? parseRequiredPositiveInt(req.body.quantity, "quantity")
          : undefined,
        iAddressMasterId: parseOptionalInt(req.body.iAddressMasterId, "iAddressMasterId"),
        serviceAddressSnapshot,
        paymentStatus: parseOptionalString(req.body.paymentStatus) as PaymentStatus | undefined,
        bookingStatus: parseOptionalBookingStatus(req.body.bookingStatus),
        scheduledStartAt: Object.prototype.hasOwnProperty.call(req.body, "scheduledStartAt")
          ? parseOptionalDate(req.body.scheduledStartAt, "scheduledStartAt") ?? null
          : undefined,
        scheduledEndAt: Object.prototype.hasOwnProperty.call(req.body, "scheduledEndAt")
          ? parseOptionalDate(req.body.scheduledEndAt, "scheduledEndAt") ?? null
          : undefined,
        iSlotMasterId: parseOptionalInt(req.body.iSlotMasterId, "iSlotMasterId"),
        iSubscriptionMasterId: parseOptionalInt(req.body.iSubscriptionMasterId, "iSubscriptionMasterId"),
        iCouponMasterId: Object.prototype.hasOwnProperty.call(req.body, "iCouponMasterId")
          ? parseOptionalInt(req.body.iCouponMasterId, "iCouponMasterId")
          : undefined,
        couponCode: parseOptionalString(req.body.couponCode),
        holdReason: parseOptionalString(req.body.holdReason),
        cancelReason: parseOptionalString(req.body.cancelReason),
        remarks: parseOptionalString(req.body.remarks),
      },
      req.authUser,
    );

    sendSuccess(res, 200, "Booking updated successfully.", booking);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function deleteBooking(req: Request, res: Response) {
  try {
    const iTransId = parseRequiredInt(req.params.id, "id");
    const booking = await bookingService.deleteBooking(iTransId, req.authUser);
    sendSuccess(res, 200, "Booking deleted successfully.", booking);
  } catch (error) {
    handleControllerError(res, error);
  }
}
