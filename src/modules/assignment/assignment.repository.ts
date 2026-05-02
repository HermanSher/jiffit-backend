import {
  AssignmentAttemptStatus,
  BookingAssignmentStatus,
  BookingStatus,
  EmploymentStatus,
  HeroVerificationStatus,
  Prisma,
  WorkerState,
} from "@prisma/client";
import { prisma } from "../../lib/prisma";

class AssignmentRepository {
  getBookingForDispatch(iBookingTransId: number) {
    return prisma.tBookings.findFirst({
      where: {
        iTransId: iBookingTransId,
        isDeleted: false,
      },
      select: {
        iTransId: true,
        iServiceMasterId: true,
        serviceAddressSnapshot: true,
        bookingStatus: true,
        customer: {
          select: {
            iMasterId: true,
          },
        },
      },
    });
  }

  getActiveAssignmentForBooking(iBookingTransId: number) {
    return prisma.tBookingAssignments.findFirst({
      where: {
        iBookingTransId,
        isDeleted: false,
        isActive: true,
        status: {
          in: [
            BookingAssignmentStatus.ASSIGNED,
            BookingAssignmentStatus.ACCEPTED,
            BookingAssignmentStatus.STARTED,
          ],
        },
      },
      select: { iTransId: true },
    });
  }

  findEligibleHeroMappings(iServiceMasterId: number) {
    return prisma.mHeroServiceMappings.findMany({
      where: {
        iServiceMasterId,
        isDeleted: false,
        isActive: true,
        hero: {
          isDeleted: false,
          isActive: true,
          employmentStatus: EmploymentStatus.ACTIVE,
          heroProfile: {
            is: {
              isVerified: true,
              verificationStatus: HeroVerificationStatus.VERIFIED,
            },
          },
        },
      },
      include: {
        hero: {
          include: {
            heroProfile: true,
            heroLiveLocation: true,
            heroServiceAreas: {
              where: {
                isDeleted: false,
                isActive: true,
              },
            },
          },
        },
      },
    });
  }

  getActiveJobsCount(iHeroUserMasterId: number) {
    return prisma.tBookingAssignments.count({
      where: {
        iHeroUserMasterId,
        isDeleted: false,
        isActive: true,
        status: {
          in: [
            BookingAssignmentStatus.ASSIGNED,
            BookingAssignmentStatus.ACCEPTED,
            BookingAssignmentStatus.STARTED,
          ],
        },
      },
    });
  }

  getExistingAttemptsForBooking(iBookingTransId: number) {
    return prisma.tAssignmentAttempts.findMany({
      where: {
        iBookingTransId,
      },
      select: {
        iHeroUserMasterId: true,
        attemptNumber: true,
      },
      orderBy: {
        attemptNumber: "desc",
      },
    });
  }

  createAssignmentForBooking(input: {
    iBookingTransId: number;
    iHeroUserMasterId: number;
    attemptNumber: number;
    timeoutAt: Date;
    changedByUserMasterId?: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.tBookingAssignments.findFirst({
        where: {
          iBookingTransId: input.iBookingTransId,
          isDeleted: false,
          isActive: true,
          status: {
            in: [
              BookingAssignmentStatus.ASSIGNED,
              BookingAssignmentStatus.ACCEPTED,
              BookingAssignmentStatus.STARTED,
            ],
          },
        },
      });

      if (existing) {
        throw new Error("BOOKING_ALREADY_ASSIGNED");
      }

      const statusUpdate = await tx.tBookings.updateMany({
        where: {
          iTransId: input.iBookingTransId,
          isDeleted: false,
          bookingStatus: {
            in: [BookingStatus.CONFIRMED, BookingStatus.ASSIGNMENT_PENDING],
          },
        },
        data: {
          bookingStatus: BookingStatus.ASSIGNED,
        },
      });

      if (statusUpdate.count !== 1) {
        throw new Error("BOOKING_STATUS_NOT_ASSIGNABLE");
      }

      const assignment = await tx.tBookingAssignments.create({
        data: {
          iBookingTransId: input.iBookingTransId,
          iHeroUserMasterId: input.iHeroUserMasterId,
          assignedAt: new Date(),
          status: BookingAssignmentStatus.ASSIGNED,
        },
      });

      const attempt = await tx.tAssignmentAttempts.create({
        data: {
          iBookingTransId: input.iBookingTransId,
          iHeroUserMasterId: input.iHeroUserMasterId,
          attemptNumber: input.attemptNumber,
          status: AssignmentAttemptStatus.PENDING,
          sentAt: new Date(),
          timeoutAt: input.timeoutAt,
        },
      });

      await tx.mHeroProfiles.updateMany({
        where: {
          iUserMasterId: input.iHeroUserMasterId,
          isDeleted: false,
          isActive: true,
          workerState: {
            in: [WorkerState.AVAILABLE, WorkerState.ONLINE, WorkerState.COMPLETED],
          },
        },
        data: {
          workerState: WorkerState.ASSIGNED,
          isAvailable: false,
        },
      });

      await tx.tBookingStatusHistory.create({
        data: {
          iBookingTransId: input.iBookingTransId,
          fromStatus: BookingStatus.ASSIGNMENT_PENDING,
          toStatus: BookingStatus.ASSIGNED,
          changedByUserMasterId: input.changedByUserMasterId ?? null,
          reason: "Worker assigned automatically.",
          metadataJson: {
            iHeroUserMasterId: input.iHeroUserMasterId,
            iAssignmentTransId: assignment.iTransId,
          },
        },
      });

      return { assignment, attempt };
    });
  }

  moveBookingToAssignmentPending(iBookingTransId: number, changedByUserMasterId?: number) {
    return prisma.$transaction(async (tx) => {
      const booking = await tx.tBookings.findFirst({
        where: {
          iTransId: iBookingTransId,
          isDeleted: false,
        },
        select: {
          bookingStatus: true,
        },
      });

      if (!booking) {
        throw new Error("BOOKING_NOT_FOUND");
      }

      if (booking.bookingStatus !== BookingStatus.CONFIRMED) {
        return booking;
      }

      await tx.tBookings.update({
        where: { iTransId: iBookingTransId },
        data: {
          bookingStatus: BookingStatus.ASSIGNMENT_PENDING,
        },
      });

      await tx.tBookingStatusHistory.create({
        data: {
          iBookingTransId,
          fromStatus: BookingStatus.CONFIRMED,
          toStatus: BookingStatus.ASSIGNMENT_PENDING,
          changedByUserMasterId: changedByUserMasterId ?? null,
          reason: "Assignment started.",
        },
      });

      return { bookingStatus: BookingStatus.ASSIGNMENT_PENDING };
    });
  }

  getAttemptById(iTransId: number) {
    return prisma.tAssignmentAttempts.findFirst({
      where: { iTransId },
    });
  }

  markAttemptTimedOut(iTransId: number) {
    return prisma.tAssignmentAttempts.updateMany({
      where: {
        iTransId,
        status: AssignmentAttemptStatus.PENDING,
      },
      data: {
        status: AssignmentAttemptStatus.TIMEOUT,
        respondedAt: new Date(),
      },
    });
  }

  cancelActiveAssignment(iBookingTransId: number, iHeroUserMasterId: number, remarks?: string) {
    return prisma.tBookingAssignments.updateMany({
      where: {
        iBookingTransId,
        iHeroUserMasterId,
        isDeleted: false,
        isActive: true,
        status: {
          in: [
            BookingAssignmentStatus.ASSIGNED,
            BookingAssignmentStatus.ACCEPTED,
          ],
        },
      },
      data: {
        status: BookingAssignmentStatus.CANCELLED,
        isActive: false,
        remarks,
      },
    });
  }

  appendBookingHistory(input: {
    iBookingTransId: number;
    fromStatus?: BookingStatus | null;
    toStatus: BookingStatus;
    changedByUserMasterId?: number;
    reason?: string;
    metadataJson?: Prisma.InputJsonValue;
  }) {
    return prisma.tBookingStatusHistory.create({
      data: {
        iBookingTransId: input.iBookingTransId,
        fromStatus: input.fromStatus ?? null,
        toStatus: input.toStatus,
        changedByUserMasterId: input.changedByUserMasterId ?? null,
        reason: input.reason,
        metadataJson: input.metadataJson,
      },
    });
  }

  markAttemptRejected(iTransId: number, remarks?: string) {
    return prisma.tAssignmentAttempts.update({
      where: { iTransId },
      data: {
        status: AssignmentAttemptStatus.REJECTED,
        respondedAt: new Date(),
        remarks,
      },
    });
  }

  markAttemptAccepted(iTransId: number) {
    return prisma.tAssignmentAttempts.update({
      where: { iTransId },
      data: {
        status: AssignmentAttemptStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    });
  }

  setHeroAvailable(iHeroUserMasterId: number) {
    return prisma.mHeroProfiles.updateMany({
      where: {
        iUserMasterId: iHeroUserMasterId,
        isDeleted: false,
        isActive: true,
      },
      data: {
        workerState: WorkerState.AVAILABLE,
        isAvailable: true,
      },
    });
  }

  moveBookingBackToAssignmentPending(iBookingTransId: number) {
    return prisma.tBookings.updateMany({
      where: {
        iTransId: iBookingTransId,
        isDeleted: false,
        bookingStatus: BookingStatus.ASSIGNED,
      },
      data: {
        bookingStatus: BookingStatus.ASSIGNMENT_PENDING,
      },
    });
  }
}

export const assignmentRepository = new AssignmentRepository();
