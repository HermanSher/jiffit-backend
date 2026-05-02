import { BookingStatus, DiscountType, PaymentStatus, Prisma } from "@prisma/client";
import { serviceLocations } from "../../constants/service-locations";
import { assignmentService } from "../assignment/assignment.service";
import { eventBusService } from "../events/event-bus.service";
import { AuthenticatedUser } from "../../types/auth";
import { ApiError } from "../../utils/api-error";
import { isSuperUserRole } from "../../utils/role-precedence";
import { bookingRepository } from "./booking.repository";

type CreateBookingInput = {
  bookingNo?: string;
  iCustomerUserMasterId: number;
  iServiceMasterId?: number;
  quantity: number;
  iAddressMasterId?: number;
  serviceAddressSnapshot?: Prisma.InputJsonValue;
  iSlotMasterId?: number;
  scheduledStartAt?: Date;
  scheduledEndAt?: Date;
  iSubscriptionMasterId?: number;
  iCouponMasterId?: number;
  couponCode?: string;
  requestedServiceName?: string;
  bookingStatus?: BookingStatus;
  holdReason?: string;
  cancelReason?: string;
  remarks?: string;
};

type UpdateBookingInput = {
  iCustomerUserMasterId?: number;
  iServiceMasterId?: number | null;
  requestedServiceName?: string | null;
  quantity?: number;
  iAddressMasterId?: number;
  serviceAddressSnapshot?: Prisma.InputJsonValue | null;
  paymentStatus?: PaymentStatus;
  bookingStatus?: BookingStatus;
  scheduledStartAt?: Date | null;
  scheduledEndAt?: Date | null;
  iSlotMasterId?: number;
  iSubscriptionMasterId?: number;
  iCouponMasterId?: number;
  couponCode?: string;
  holdReason?: string;
  cancelReason?: string;
  remarks?: string;
};

const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.DRAFT]: [BookingStatus.HOLD],
  [BookingStatus.HOLD]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [BookingStatus.ASSIGNMENT_PENDING, BookingStatus.CANCELLED],
  [BookingStatus.PENDING_PAYMENT]: [],
  [BookingStatus.PAID]: [],
  [BookingStatus.ASSIGNMENT_PENDING]: [BookingStatus.ASSIGNED, BookingStatus.CANCELLED],
  [BookingStatus.ASSIGNED]: [BookingStatus.ACCEPTED, BookingStatus.CANCELLED],
  [BookingStatus.ACCEPTED]: [BookingStatus.IN_PROGRESS],
  [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.FAILED]: [],
};

class BookingService {
  private toNumber(value: Prisma.Decimal | number | string | null | undefined) {
    if (value === null || value === undefined) {
      return 0;
    }

    return Number(value);
  }

  private money(value: number) {
    return new Prisma.Decimal(Number(value.toFixed(2)));
  }

  private parseOptionalCoordinate(value: unknown, fieldName: string) {
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

  normalizeServiceAddressSnapshot(value: unknown): Prisma.InputJsonValue | undefined {
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

    const latitude = this.parseOptionalCoordinate(snapshot.latitude, "latitude") ?? location.latitude;
    const longitude = this.parseOptionalCoordinate(snapshot.longitude, "longitude") ?? location.longitude;
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

  private ensureBookingCanBeConfirmed(input: {
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

  private assertBookingTransition(
    currentStatus: BookingStatus,
    nextStatus: BookingStatus,
    actor?: AuthenticatedUser,
  ) {
    if (currentStatus === nextStatus) {
      return;
    }

    if (
      currentStatus === BookingStatus.IN_PROGRESS &&
      nextStatus === BookingStatus.CANCELLED &&
      actor &&
      isSuperUserRole({ sCode: actor.roleCode ?? "" })
    ) {
      return;
    }

    const allowedTargets = BOOKING_TRANSITIONS[currentStatus] ?? [];
    if (!allowedTargets.includes(nextStatus)) {
      throw new ApiError(
        400,
        `Invalid booking status transition from ${currentStatus} to ${nextStatus}.`,
      );
    }

    if (nextStatus === BookingStatus.CANCELLED) {
      if (
        !([
          BookingStatus.HOLD,
          BookingStatus.CONFIRMED,
          BookingStatus.ASSIGNED,
          BookingStatus.ASSIGNMENT_PENDING,
        ] as BookingStatus[]).includes(currentStatus)
      ) {
        throw new ApiError(400, `Cancellation is not allowed from ${currentStatus}.`);
      }
    }
  }

  private async resolveCoupon(input: {
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
    const coupon = await bookingRepository.findActiveCoupon({
      iCouponMasterId: input.iCouponMasterId,
      couponCode: input.couponCode,
      now,
    });

    if (!coupon) {
      throw new ApiError(404, "Coupon not found or not active for current date.");
    }

    if (coupon.minOrderAmount && input.baseAmount < this.toNumber(coupon.minOrderAmount)) {
      throw new ApiError(400, "Coupon minimum order amount is not satisfied.");
    }

    const mappedServiceIds = coupon.serviceMappings.map((mapping) => mapping.iServiceMasterId);
    if (mappedServiceIds.length > 0 && !mappedServiceIds.includes(input.serviceId)) {
      throw new ApiError(400, "Coupon is not applicable for this service.");
    }

    const rawDiscount =
      coupon.discountType === DiscountType.PERCENTAGE
        ? (input.baseAmount * this.toNumber(coupon.discountValue)) / 100
        : this.toNumber(coupon.discountValue);
    const maxDiscount = coupon.maxDiscountAmount ? this.toNumber(coupon.maxDiscountAmount) : rawDiscount;
    const discountAmount = Math.min(rawDiscount, maxDiscount, input.baseAmount);

    return {
      coupon,
      discountAmount,
    };
  }

  async calculateBookingPricing(input: {
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

    const service = await bookingRepository.findServiceForPricing(input.serviceId);
    if (!service || !service.isActive) {
      throw new ApiError(404, "Active service not found.");
    }

    if (input.quantity < service.minQuantity) {
      throw new ApiError(400, `quantity must be at least ${service.minQuantity}.`);
    }

    if (service.maxQuantity && input.quantity > service.maxQuantity) {
      throw new ApiError(400, `quantity must be less than or equal to ${service.maxQuantity}.`);
    }

    const unitPrice = this.toNumber(service.salePrice ?? service.basePrice);
    const baseAmount = unitPrice * input.quantity;
    const couponResult = await this.resolveCoupon({
      iCouponMasterId: input.iCouponMasterId,
      couponCode: input.couponCode,
      serviceId: input.serviceId,
      baseAmount,
    });

    const taxableAmount = baseAmount - couponResult.discountAmount;
    const taxAmount = service.taxPercentage
      ? (taxableAmount * this.toNumber(service.taxPercentage)) / 100
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

  async createBooking(input: CreateBookingInput, actor?: AuthenticatedUser) {
    const bookingStatus =
      input.bookingStatus ??
      (input.iServiceMasterId && input.serviceAddressSnapshot && input.scheduledStartAt
        ? BookingStatus.CONFIRMED
        : BookingStatus.HOLD);

    if (!([BookingStatus.HOLD, BookingStatus.CONFIRMED] as BookingStatus[]).includes(bookingStatus)) {
      throw new ApiError(400, "bookingStatus during creation must be HOLD or CONFIRMED.");
    }

    if (bookingStatus === BookingStatus.CONFIRMED) {
      this.ensureBookingCanBeConfirmed({
        iServiceMasterId: input.iServiceMasterId,
        serviceAddressSnapshot: input.serviceAddressSnapshot,
        scheduledStartAt: input.scheduledStartAt,
      });
    }

    const pricing = await this.calculateBookingPricing({
      serviceId: input.iServiceMasterId,
      quantity: input.quantity,
      iCouponMasterId: input.iCouponMasterId,
      couponCode: input.couponCode,
    });

    const booking = await bookingRepository.createBooking({
      bookingNo: input.bookingNo ?? `BK-${Date.now()}`,
      iCustomerUserMasterId: input.iCustomerUserMasterId,
      iServiceMasterId: input.iServiceMasterId,
      requestedServiceName: input.requestedServiceName,
      quantity: input.quantity,
      iAddressMasterId: input.iAddressMasterId,
      serviceAddressSnapshot: input.serviceAddressSnapshot,
      iSlotMasterId: input.iSlotMasterId,
      scheduledStartAt: input.scheduledStartAt,
      scheduledEndAt: input.scheduledEndAt,
      iSubscriptionMasterId: input.iSubscriptionMasterId,
      iCouponMasterId: pricing.coupon?.iMasterId,
      couponCode: pricing.couponCode,
      baseAmount: this.money(pricing.baseAmount),
      discountAmount: this.money(pricing.discountAmount),
      taxAmount: this.money(pricing.taxAmount),
      finalAmount: this.money(pricing.finalAmount),
      paymentStatus: PaymentStatus.PENDING,
      bookingStatus,
      confirmedAt: bookingStatus === BookingStatus.CONFIRMED ? new Date() : null,
      holdReason: bookingStatus === BookingStatus.HOLD ? input.holdReason ?? "Booking saved on hold." : null,
      cancelledAt: null,
      cancelReason: null,
      isActive: true,
      remarks: input.remarks,
    });

    await bookingRepository.appendStatusHistory({
      iBookingTransId: booking.iTransId,
      fromStatus: null,
      toStatus: bookingStatus,
      changedByUserMasterId: actor?.iMasterId,
      reason: bookingStatus === BookingStatus.HOLD ? input.holdReason : "Booking created.",
    });

    eventBusService.emit("booking_created", {
      iBookingTransId: booking.iTransId,
      bookingStatus,
    });

    if (bookingStatus === BookingStatus.CONFIRMED) {
      eventBusService.emit("booking_confirmed", {
        iBookingTransId: booking.iTransId,
      });
      await assignmentService.dispatchAssignment(booking.iTransId, actor, "booking-created-confirmed");
    }

    return booking;
  }

  async getBookings(input: {
    iCustomerUserMasterId?: number;
    iServiceMasterId?: number;
    bookingStatus?: BookingStatus;
    paymentStatus?: PaymentStatus;
    includeDeleted: boolean;
  }) {
    return bookingRepository.listBookings(input);
  }

  async getBookingById(iTransId: number, includeDeleted: boolean) {
    const booking = await bookingRepository.getBookingById(iTransId, includeDeleted);
    if (!booking) {
      throw new ApiError(404, "Booking not found.");
    }

    return booking;
  }

  async restoreBooking(iTransId: number) {
    return bookingRepository.restoreBooking(iTransId);
  }

  async updateBookingStatus(
    iTransId: number,
    input: {
      bookingStatus: BookingStatus;
      holdReason?: string;
      cancelReason?: string;
      remarks?: string;
    },
    actor?: AuthenticatedUser,
  ) {
    const currentBooking = await bookingRepository.getBookingEntityById(iTransId);
    if (!currentBooking) {
      throw new ApiError(404, "Booking not found.");
    }

    this.assertBookingTransition(currentBooking.bookingStatus, input.bookingStatus, actor);

    if (input.bookingStatus === BookingStatus.CONFIRMED) {
      this.ensureBookingCanBeConfirmed({
        iServiceMasterId: currentBooking.iServiceMasterId,
        serviceAddressSnapshot: currentBooking.serviceAddressSnapshot,
        scheduledStartAt: currentBooking.scheduledStartAt,
      });
    }

    const booking = await bookingRepository.updateBooking(iTransId, {
      bookingStatus: input.bookingStatus,
      confirmedAt: input.bookingStatus === BookingStatus.CONFIRMED ? new Date() : currentBooking.confirmedAt,
      holdReason:
        input.bookingStatus === BookingStatus.HOLD
          ? input.holdReason ?? currentBooking.holdReason ?? "Booking moved to hold."
          : input.bookingStatus === BookingStatus.CONFIRMED
            ? null
            : currentBooking.holdReason,
      cancelledAt: input.bookingStatus === BookingStatus.CANCELLED ? new Date() : currentBooking.cancelledAt,
      cancelReason:
        input.bookingStatus === BookingStatus.CANCELLED
          ? input.cancelReason ?? "Booking cancelled."
          : currentBooking.cancelReason,
      isActive: input.bookingStatus !== BookingStatus.CANCELLED,
      remarks: input.remarks ?? currentBooking.remarks,
    });

    if (currentBooking.bookingStatus !== input.bookingStatus) {
      await bookingRepository.appendStatusHistory({
        iBookingTransId: iTransId,
        fromStatus: currentBooking.bookingStatus,
        toStatus: input.bookingStatus,
        changedByUserMasterId: actor?.iMasterId,
        reason: input.cancelReason ?? input.holdReason ?? input.remarks,
      });
    }

    if (input.bookingStatus === BookingStatus.CONFIRMED) {
      eventBusService.emit("booking_confirmed", {
        iBookingTransId: iTransId,
      });
      await assignmentService.dispatchAssignment(iTransId, actor, "booking-status-confirmed");
    }

    return booking;
  }

  async updateBooking(iTransId: number, input: UpdateBookingInput, actor?: AuthenticatedUser) {
    const currentBooking = await bookingRepository.getBookingEntityById(iTransId);
    if (!currentBooking) {
      throw new ApiError(404, "Booking not found.");
    }

    const iServiceMasterId =
      input.iServiceMasterId === undefined
        ? currentBooking.iServiceMasterId ?? undefined
        : input.iServiceMasterId ?? undefined;
    const quantity = input.quantity ?? currentBooking.quantity;
    const couponCode = input.couponCode ?? currentBooking.couponCode ?? undefined;
    const iCouponMasterId =
      input.iCouponMasterId === undefined
        ? currentBooking.iCouponMasterId ?? undefined
        : input.iCouponMasterId;

    const pricing = await this.calculateBookingPricing({
      serviceId: iServiceMasterId,
      quantity,
      iCouponMasterId,
      couponCode,
    });

    const nextBookingStatus = input.bookingStatus;
    if (nextBookingStatus) {
      this.assertBookingTransition(currentBooking.bookingStatus, nextBookingStatus, actor);
    }

    const nextScheduledStartAt =
      input.scheduledStartAt === undefined ? currentBooking.scheduledStartAt : input.scheduledStartAt;
    const nextServiceAddress =
      input.serviceAddressSnapshot === undefined
        ? currentBooking.serviceAddressSnapshot
        : input.serviceAddressSnapshot;

    if (nextBookingStatus === BookingStatus.CONFIRMED) {
      this.ensureBookingCanBeConfirmed({
        iServiceMasterId,
        serviceAddressSnapshot: nextServiceAddress ?? undefined,
        scheduledStartAt: nextScheduledStartAt ?? undefined,
      });
    }

    const booking = await bookingRepository.updateBooking(iTransId, {
      iCustomerUserMasterId: input.iCustomerUserMasterId,
      iServiceMasterId,
      requestedServiceName: input.requestedServiceName,
      quantity,
      iAddressMasterId: input.iAddressMasterId,
      serviceAddressSnapshot: input.serviceAddressSnapshot ?? undefined,
      paymentStatus: input.paymentStatus,
      bookingStatus: nextBookingStatus,
      confirmedAt:
        nextBookingStatus === BookingStatus.CONFIRMED
          ? new Date()
          : nextBookingStatus === BookingStatus.HOLD
            ? null
            : undefined,
      holdReason:
        nextBookingStatus === BookingStatus.CONFIRMED
          ? null
          : nextBookingStatus === BookingStatus.HOLD
            ? input.holdReason ?? currentBooking.holdReason ?? "Booking saved on hold."
            : input.holdReason,
      cancelledAt:
        nextBookingStatus === BookingStatus.CANCELLED
          ? new Date()
          : nextBookingStatus
            ? null
            : undefined,
      cancelReason:
        nextBookingStatus === BookingStatus.CANCELLED
          ? input.cancelReason ?? "Booking cancelled."
          : nextBookingStatus
            ? null
            : input.cancelReason,
      isActive: nextBookingStatus ? nextBookingStatus !== BookingStatus.CANCELLED : undefined,
      scheduledStartAt: input.scheduledStartAt ?? undefined,
      scheduledEndAt: input.scheduledEndAt ?? undefined,
      iSlotMasterId: input.iSlotMasterId,
      iSubscriptionMasterId: input.iSubscriptionMasterId,
      iCouponMasterId: pricing.coupon?.iMasterId,
      couponCode: pricing.couponCode,
      baseAmount: this.money(pricing.baseAmount),
      discountAmount: this.money(pricing.discountAmount),
      taxAmount: this.money(pricing.taxAmount),
      finalAmount: this.money(pricing.finalAmount),
      remarks: input.remarks,
    });

    if (nextBookingStatus && currentBooking.bookingStatus !== nextBookingStatus) {
      await bookingRepository.appendStatusHistory({
        iBookingTransId: iTransId,
        fromStatus: currentBooking.bookingStatus,
        toStatus: nextBookingStatus,
        changedByUserMasterId: actor?.iMasterId,
        reason: input.cancelReason ?? input.holdReason ?? input.remarks,
      });
    }

    if (nextBookingStatus === BookingStatus.CONFIRMED) {
      eventBusService.emit("booking_confirmed", {
        iBookingTransId: iTransId,
      });
      await assignmentService.dispatchAssignment(iTransId, actor, "booking-updated-confirmed");
    }

    return booking;
  }

  async deleteBooking(iTransId: number, actor?: AuthenticatedUser) {
    const current = await bookingRepository.getBookingEntityById(iTransId);
    if (!current) {
      throw new ApiError(404, "Booking not found.");
    }

    const booking = await bookingRepository.softDeleteBooking(iTransId);
    if (current.bookingStatus !== BookingStatus.CANCELLED) {
      await bookingRepository.appendStatusHistory({
        iBookingTransId: iTransId,
        fromStatus: current.bookingStatus,
        toStatus: BookingStatus.CANCELLED,
        changedByUserMasterId: actor?.iMasterId,
        reason: "Booking soft deleted from API.",
      });
    }

    return booking;
  }
}

export const bookingService = new BookingService();
