import { WorkerState } from "@prisma/client";
import { prisma } from "../../lib/prisma";

class WorkerRepository {
  getHeroProfileByUserId(iUserMasterId: number) {
    return prisma.mHeroProfiles.findFirst({
      where: {
        iUserMasterId,
        isDeleted: false,
      },
      select: {
        iMasterId: true,
        iUserMasterId: true,
        isActive: true,
        isAvailable: true,
        workerState: true,
        isVerified: true,
        verificationStatus: true,
      },
    });
  }

  getHeroLiveLocation(iUserMasterId: number) {
    return prisma.mHeroLiveLocations.findUnique({
      where: {
        iHeroUserMasterId: iUserMasterId,
      },
      select: {
        iMasterId: true,
        iHeroUserMasterId: true,
        lastUpdatedAt: true,
      },
    });
  }

  updateWorkerState(iUserMasterId: number, workerState: WorkerState, isAvailable: boolean) {
    return prisma.mHeroProfiles.update({
      where: { iUserMasterId },
      data: {
        workerState,
        isAvailable,
      },
    });
  }

  clearHeroLiveLocation(iHeroUserMasterId: number) {
    return prisma.mHeroLiveLocations.deleteMany({
      where: {
        iHeroUserMasterId,
      },
    });
  }

  acceptAssignedBooking(iHeroUserMasterId: number, changedByUserMasterId?: number) {
    return prisma.$transaction(async (tx) => {
      const assignment = await tx.tBookingAssignments.findFirst({
        where: {
          iHeroUserMasterId,
          isDeleted: false,
          isActive: true,
          status: "ASSIGNED",
        },
        orderBy: { iTransId: "desc" },
      });

      if (!assignment) {
        return null;
      }

      await tx.tBookingAssignments.update({
        where: { iTransId: assignment.iTransId },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });

      const bookingUpdate = await tx.tBookings.updateMany({
        where: {
          iTransId: assignment.iBookingTransId,
          isDeleted: false,
          bookingStatus: "ASSIGNED",
        },
        data: {
          bookingStatus: "ACCEPTED",
        },
      });

      if (bookingUpdate.count !== 1) {
        throw new Error("BOOKING_ACCEPT_ALREADY_PROCESSED");
      }

      await tx.tAssignmentAttempts.updateMany({
        where: {
          iBookingTransId: assignment.iBookingTransId,
          iHeroUserMasterId,
          status: "PENDING",
        },
        data: {
          status: "ACCEPTED",
          respondedAt: new Date(),
        },
      });

      await tx.tBookingStatusHistory.create({
        data: {
          iBookingTransId: assignment.iBookingTransId,
          fromStatus: "ASSIGNED",
          toStatus: "ACCEPTED",
          changedByUserMasterId: changedByUserMasterId ?? null,
          reason: "Worker accepted booking.",
        },
      });

      return assignment;
    });
  }

  startAcceptedBooking(iHeroUserMasterId: number, changedByUserMasterId?: number) {
    return prisma.$transaction(async (tx) => {
      const assignment = await tx.tBookingAssignments.findFirst({
        where: {
          iHeroUserMasterId,
          isDeleted: false,
          isActive: true,
          status: "ACCEPTED",
        },
        orderBy: { iTransId: "desc" },
      });

      if (!assignment) {
        return null;
      }

      await tx.tBookingAssignments.update({
        where: { iTransId: assignment.iTransId },
        data: {
          status: "STARTED",
          startedAt: new Date(),
        },
      });

      await tx.tBookings.updateMany({
        where: {
          iTransId: assignment.iBookingTransId,
          isDeleted: false,
          bookingStatus: "ACCEPTED",
        },
        data: {
          bookingStatus: "IN_PROGRESS",
        },
      });

      await tx.tBookingStatusHistory.create({
        data: {
          iBookingTransId: assignment.iBookingTransId,
          fromStatus: "ACCEPTED",
          toStatus: "IN_PROGRESS",
          changedByUserMasterId: changedByUserMasterId ?? null,
          reason: "Worker started booking.",
        },
      });

      return assignment;
    });
  }

  completeStartedBooking(iHeroUserMasterId: number, changedByUserMasterId?: number) {
    return prisma.$transaction(async (tx) => {
      const assignment = await tx.tBookingAssignments.findFirst({
        where: {
          iHeroUserMasterId,
          isDeleted: false,
          isActive: true,
          status: "STARTED",
        },
        orderBy: { iTransId: "desc" },
      });

      if (!assignment) {
        return null;
      }

      await tx.tBookingAssignments.update({
        where: { iTransId: assignment.iTransId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          isActive: false,
        },
      });

      await tx.tBookings.updateMany({
        where: {
          iTransId: assignment.iBookingTransId,
          isDeleted: false,
          bookingStatus: "IN_PROGRESS",
        },
        data: {
          bookingStatus: "COMPLETED",
        },
      });

      await tx.tBookingStatusHistory.create({
        data: {
          iBookingTransId: assignment.iBookingTransId,
          fromStatus: "IN_PROGRESS",
          toStatus: "COMPLETED",
          changedByUserMasterId: changedByUserMasterId ?? null,
          reason: "Worker completed booking.",
        },
      });

      return assignment;
    });
  }

  rejectAssignedBooking(iHeroUserMasterId: number, changedByUserMasterId?: number) {
    return prisma.$transaction(async (tx) => {
      const assignment = await tx.tBookingAssignments.findFirst({
        where: {
          iHeroUserMasterId,
          isDeleted: false,
          isActive: true,
          status: "ASSIGNED",
        },
        orderBy: { iTransId: "desc" },
      });

      if (!assignment) {
        return null;
      }

      await tx.tBookingAssignments.update({
        where: { iTransId: assignment.iTransId },
        data: {
          status: "CANCELLED",
          isActive: false,
          remarks: "Worker rejected booking.",
        },
      });

      await tx.tAssignmentAttempts.updateMany({
        where: {
          iBookingTransId: assignment.iBookingTransId,
          iHeroUserMasterId,
          status: "PENDING",
        },
        data: {
          status: "REJECTED",
          respondedAt: new Date(),
          remarks: "Worker rejected booking.",
        },
      });

      await tx.tBookings.updateMany({
        where: {
          iTransId: assignment.iBookingTransId,
          isDeleted: false,
          bookingStatus: "ASSIGNED",
        },
        data: {
          bookingStatus: "ASSIGNMENT_PENDING",
        },
      });

      await tx.tBookingStatusHistory.create({
        data: {
          iBookingTransId: assignment.iBookingTransId,
          fromStatus: "ASSIGNED",
          toStatus: "ASSIGNMENT_PENDING",
          changedByUserMasterId: changedByUserMasterId ?? null,
          reason: "Worker rejected booking. Retrying assignment.",
        },
      });

      return assignment;
    });
  }
}

export const workerRepository = new WorkerRepository();
