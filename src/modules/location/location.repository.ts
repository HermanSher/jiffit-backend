import { BookingAssignmentStatus, EmploymentStatus, Prisma, WorkerState } from "@prisma/client";
import { prisma } from "../../lib/prisma";

type DashboardHeroFilters = {
  city?: string;
  serviceText?: string;
  serviceId?: number;
  activeOnly: boolean;
  freshCutoff: Date;
  limit: number;
};

class LocationRepository {
  upsertHeroLiveLocation(input: {
    iHeroUserMasterId: number;
    latitude: Prisma.Decimal;
    longitude: Prisma.Decimal;
    accuracy?: number;
    heading?: number;
    speed?: number;
    batteryLevel?: number;
    lastUpdatedAt: Date;
  }) {
    return prisma.mHeroLiveLocations.upsert({
      where: {
        iHeroUserMasterId: input.iHeroUserMasterId,
      },
      create: {
        iHeroUserMasterId: input.iHeroUserMasterId,
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy: input.accuracy,
        heading: input.heading,
        speed: input.speed,
        batteryLevel: input.batteryLevel,
        lastUpdatedAt: input.lastUpdatedAt,
      },
      update: {
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy: input.accuracy,
        heading: input.heading,
        speed: input.speed,
        batteryLevel: input.batteryLevel,
        lastUpdatedAt: input.lastUpdatedAt,
      },
    });
  }

  getHeroLiveLocation(iHeroUserMasterId: number) {
    return prisma.mHeroLiveLocations.findUnique({
      where: {
        iHeroUserMasterId,
      },
      select: {
        iMasterId: true,
        iHeroUserMasterId: true,
        latitude: true,
        longitude: true,
        accuracy: true,
        heading: true,
        speed: true,
        batteryLevel: true,
        lastUpdatedAt: true,
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

  getBookingWithActiveHeroAssignment(iBookingTransId: number) {
    return prisma.tBookings.findFirst({
      where: {
        iTransId: iBookingTransId,
        isDeleted: false,
      },
      select: {
        iTransId: true,
        iCustomerUserMasterId: true,
        bookingStatus: true,
        assignments: {
          where: {
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
          orderBy: {
            iTransId: "desc",
          },
          take: 1,
          select: {
            iTransId: true,
            iHeroUserMasterId: true,
            status: true,
            assignedAt: true,
          },
        },
      },
    });
  }

  listDashboardHeroLiveLocations(filters: DashboardHeroFilters) {
    const serviceCondition: Prisma.mHeroServiceMappingsWhereInput | undefined = filters.serviceId
      ? {
          iServiceMasterId: filters.serviceId,
        }
      : filters.serviceText
        ? {
            OR: [
              {
                service: {
                  sCode: {
                    contains: filters.serviceText,
                  },
                },
              },
              {
                service: {
                  sName: {
                    contains: filters.serviceText,
                  },
                },
              },
            ],
          }
        : undefined;

    return prisma.mHeroLiveLocations.findMany({
      where: {
        lastUpdatedAt: filters.activeOnly
          ? {
              gte: filters.freshCutoff,
            }
          : undefined,
        hero: {
          isDeleted: false,
          isActive: true,
          employmentStatus: EmploymentStatus.ACTIVE,
          heroProfile: {
            is: {
              isDeleted: false,
              isActive: true,
              workerState: filters.activeOnly
                ? {
                    not: WorkerState.OFFLINE,
                  }
                : undefined,
            },
          },
          heroServiceAreas: filters.city
            ? {
                some: {
                  isDeleted: false,
                  isActive: true,
                  city: {
                    contains: filters.city,
                  },
                },
              }
            : undefined,
          heroServiceMappings: serviceCondition
            ? {
                some: {
                  isDeleted: false,
                  isActive: true,
                  ...serviceCondition,
                },
              }
            : undefined,
        },
      },
      orderBy: [
        {
          lastUpdatedAt: "desc",
        },
      ],
      take: filters.limit,
      include: {
        hero: {
          select: {
            iMasterId: true,
            username: true,
            firstName: true,
            middleName: true,
            lastName: true,
            mobileNo: true,
            heroProfile: {
              select: {
                workerState: true,
                isAvailable: true,
                averageRating: true,
                totalRatings: true,
              },
            },
            heroServiceAreas: {
              where: {
                isDeleted: false,
                isActive: true,
              },
              select: {
                city: true,
                state: true,
                pincode: true,
              },
            },
            heroServiceMappings: {
              where: {
                isDeleted: false,
                isActive: true,
              },
              select: {
                iServiceMasterId: true,
                service: {
                  select: {
                    sCode: true,
                    sName: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}

export const locationRepository = new LocationRepository();
