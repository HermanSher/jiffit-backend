import { BookingStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

type UpdateBookingInput = Prisma.tBookingsUncheckedUpdateInput;

class BookingRepository {
  createBooking(data: Prisma.tBookingsUncheckedCreateInput) {
    return prisma.tBookings.create({
      data,
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
  }

  listBookings(input: {
    iCustomerUserMasterId?: number;
    iServiceMasterId?: number;
    bookingStatus?: BookingStatus;
    paymentStatus?: PaymentStatus;
    includeDeleted: boolean;
  }) {
    return prisma.tBookings.findMany({
      where: {
        iCustomerUserMasterId: input.iCustomerUserMasterId,
        iServiceMasterId: input.iServiceMasterId,
        bookingStatus: input.bookingStatus,
        paymentStatus: input.paymentStatus,
        isDeleted: input.includeDeleted ? undefined : false,
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
  }

  getBookingById(iTransId: number, includeDeleted: boolean) {
    return prisma.tBookings.findFirst({
      where: {
        iTransId,
        isDeleted: includeDeleted ? undefined : false,
      },
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
  }

  getBookingEntityById(iTransId: number) {
    return prisma.tBookings.findFirst({
      where: {
        iTransId,
        isDeleted: false,
      },
    });
  }

  updateBooking(iTransId: number, data: UpdateBookingInput) {
    return prisma.tBookings.update({
      where: { iTransId },
      data,
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
  }

  restoreBooking(iTransId: number) {
    return prisma.tBookings.update({
      where: { iTransId },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedByUserMasterId: null,
        isActive: true,
      },
    });
  }

  softDeleteBooking(iTransId: number) {
    return prisma.tBookings.update({
      where: { iTransId },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
        deletedByUserMasterId: null,
      },
    });
  }

  appendStatusHistory(input: {
    iBookingTransId: number;
    fromStatus?: BookingStatus | null;
    toStatus: BookingStatus;
    changedByUserMasterId?: number | null;
    reason?: string | null;
    metadataJson?: Prisma.InputJsonValue;
  }) {
    return prisma.tBookingStatusHistory.create({
      data: {
        iBookingTransId: input.iBookingTransId,
        fromStatus: input.fromStatus ?? null,
        toStatus: input.toStatus,
        changedByUserMasterId: input.changedByUserMasterId ?? null,
        reason: input.reason ?? null,
        metadataJson: input.metadataJson,
      },
    });
  }

  findServiceForPricing(serviceId: number) {
    return prisma.mServices.findFirst({
      where: { iMasterId: serviceId, isDeleted: false },
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
  }

  findActiveCoupon(input: {
    iCouponMasterId?: number;
    couponCode?: string;
    now: Date;
  }) {
    return prisma.mCoupons.findFirst({
      where: {
        iMasterId: input.iCouponMasterId,
        sCode: input.couponCode,
        isActive: true,
        isDeleted: false,
        startAt: { lte: input.now },
        endAt: { gte: input.now },
      },
      include: {
        serviceMappings: {
          where: { isActive: true, isDeleted: false },
        },
      },
    });
  }
}

export const bookingRepository = new BookingRepository();
