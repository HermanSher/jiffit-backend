import { Prisma } from "@prisma/client";
import { locationConfig } from "../../config/location.config";
import { permissionCodes } from "../../constants/permission-codes";
import { accessControlService } from "../../services/access-control.service";
import { AuthenticatedUser } from "../../types/auth";
import { ApiError } from "../../utils/api-error";
import { isCustomerUserType } from "../../utils/dashboard";
import { isSuperUserRole } from "../../utils/role-precedence";
import { locationRepository } from "./location.repository";

const HERO_MARKERS = new Set(["HERO", "WORKER", "UT_HERO", "UT_WORKER"]);

class LocationService {
  private isHeroUser(user: AuthenticatedUser): boolean {
    const code = user.userTypeCode?.trim().toUpperCase();
    const name = user.userTypeName?.trim().toUpperCase();

    if (code && HERO_MARKERS.has(code)) {
      return true;
    }

    if (name === "HERO" || name === "WORKER") {
      return true;
    }

    return false;
  }

  private toDecimal(value: number): Prisma.Decimal {
    return new Prisma.Decimal(value);
  }

  private isStale(lastUpdatedAt: Date): boolean {
    const staleMs = locationConfig.heroLocationStaleSeconds * 1000;
    return Date.now() - lastUpdatedAt.getTime() > staleMs;
  }

  private async assertCanViewBookingHeroLocation(
    actor: AuthenticatedUser,
    booking: {
      iCustomerUserMasterId: number;
      assignments: Array<{ iHeroUserMasterId: number }>;
    },
  ) {
    if (actor.iMasterId === booking.iCustomerUserMasterId) {
      return;
    }

    if (isSuperUserRole({ sCode: actor.roleCode ?? "" })) {
      return;
    }

    const assigned = booking.assignments[0];
    if (assigned && assigned.iHeroUserMasterId === actor.iMasterId) {
      return;
    }

    if (isCustomerUserType({ sCode: actor.userTypeCode, sName: actor.userTypeName })) {
      throw new ApiError(403, "You are not authorized to track this hero.");
    }

    const [canViewBookings, canViewDashboard] = await Promise.all([
      accessControlService.hasPermission(actor, permissionCodes.BOOKINGS_VIEW),
      accessControlService.hasPermission(actor, permissionCodes.DASHBOARD_VIEW),
    ]);

    if (!canViewBookings && !canViewDashboard) {
      throw new ApiError(403, "You are not authorized to track this hero.");
    }
  }

  async updateWorkerLocation(
    actor: AuthenticatedUser,
    input: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      heading?: number;
      speed?: number;
      batteryLevel?: number;
    },
  ) {
    if (!this.isHeroUser(actor)) {
      throw new ApiError(403, "Only hero/worker users can update live location.");
    }

    const existing = await locationRepository.getHeroLiveLocation(actor.iMasterId);
    const now = new Date();

    if (existing) {
      const elapsedSeconds = Math.floor((now.getTime() - existing.lastUpdatedAt.getTime()) / 1000);
      if (elapsedSeconds < locationConfig.heroLocationMinUpdateSeconds) {
        throw new ApiError(
          429,
          `Location updates are too frequent. Retry after ${locationConfig.heroLocationMinUpdateSeconds - elapsedSeconds} seconds.`,
        );
      }
    }

    const saved = await locationRepository.upsertHeroLiveLocation({
      iHeroUserMasterId: actor.iMasterId,
      latitude: this.toDecimal(input.latitude),
      longitude: this.toDecimal(input.longitude),
      accuracy: input.accuracy,
      heading: input.heading,
      speed: input.speed,
      batteryLevel: input.batteryLevel,
      lastUpdatedAt: now,
    });

    return {
      heroId: saved.iHeroUserMasterId,
      latitude: Number(saved.latitude),
      longitude: Number(saved.longitude),
      accuracy: saved.accuracy,
      heading: saved.heading,
      speed: saved.speed,
      batteryLevel: saved.batteryLevel,
      lastUpdatedAt: saved.lastUpdatedAt,
      isStale: false,
      status: "LIVE",
    };
  }

  async getBookingHeroLocation(actor: AuthenticatedUser, iBookingTransId: number) {
    const booking = await locationRepository.getBookingWithActiveHeroAssignment(iBookingTransId);
    if (!booking) {
      throw new ApiError(404, "Booking not found.");
    }

    if (booking.assignments.length === 0) {
      throw new ApiError(400, "Booking is not currently assigned to a hero.");
    }

    await this.assertCanViewBookingHeroLocation(actor, booking);

    const activeAssignment = booking.assignments[0];
    const liveLocation = await locationRepository.getHeroLiveLocation(activeAssignment.iHeroUserMasterId);
    if (!liveLocation) {
      throw new ApiError(404, "Hero live location is not available yet.");
    }

    const stale = this.isStale(liveLocation.lastUpdatedAt);
    return {
      heroId: liveLocation.iHeroUserMasterId,
      latitude: Number(liveLocation.latitude),
      longitude: Number(liveLocation.longitude),
      lastUpdatedAt: liveLocation.lastUpdatedAt,
      isStale: stale,
      status: stale ? "STALE" : "LIVE",
    };
  }

  async getDashboardHeroesLive(
    actor: AuthenticatedUser,
    filters: {
      city?: string;
      serviceText?: string;
      serviceId?: number;
      active?: boolean;
      limit: number;
    },
  ) {
    if (isCustomerUserType({ sCode: actor.userTypeCode, sName: actor.userTypeName })) {
      throw new ApiError(403, "Customer users cannot access dashboard live tracking.");
    }

    const freshCutoff = new Date(Date.now() - locationConfig.heroLocationStaleSeconds * 1000);
    const activeOnly = filters.active ?? true;

    const rows = await locationRepository.listDashboardHeroLiveLocations({
      city: filters.city,
      serviceText: filters.serviceText,
      serviceId: filters.serviceId,
      activeOnly,
      freshCutoff,
      limit: filters.limit,
    });

    return rows.map((row) => {
      const firstName = row.hero.firstName?.trim();
      const middleName = row.hero.middleName?.trim();
      const lastName = row.hero.lastName?.trim();
      const displayName = [firstName, middleName, lastName].filter(Boolean).join(" ") || row.hero.username;
      const stale = this.isStale(row.lastUpdatedAt);

      return {
        heroId: row.iHeroUserMasterId,
        username: row.hero.username,
        displayName,
        mobileNo: row.hero.mobileNo ?? null,
        workerState: row.hero.heroProfile?.workerState ?? null,
        isAvailable: row.hero.heroProfile?.isAvailable ?? null,
        averageRating: row.hero.heroProfile ? Number(row.hero.heroProfile.averageRating) : null,
        totalRatings: row.hero.heroProfile?.totalRatings ?? null,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        accuracy: row.accuracy,
        heading: row.heading,
        speed: row.speed,
        batteryLevel: row.batteryLevel,
        lastUpdatedAt: row.lastUpdatedAt,
        isStale: stale,
        status: stale ? "STALE" : "LIVE",
        serviceAreas: row.hero.heroServiceAreas,
        services: row.hero.heroServiceMappings.map((mapping) => ({
          serviceId: mapping.iServiceMasterId,
          serviceCode: mapping.service.sCode,
          serviceName: mapping.service.sName,
        })),
      };
    });
  }
}

export const locationService = new LocationService();
