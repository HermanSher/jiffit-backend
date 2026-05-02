import { WorkerState } from "@prisma/client";
import { locationConfig } from "../../config/location.config";
import { assignmentRepository } from "./assignment.repository";

export type AssignmentCandidate = {
  iHeroUserMasterId: number;
  distanceKm: number;
  activeJobs: number;
  averageRating: number;
  locationAgeMs: number;
};

type BookingLocation = {
  city?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
};

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(bLat - aLat);
  const dLon = toRadians(bLon - aLon);
  const cLat1 = toRadians(aLat);
  const cLat2 = toRadians(bLat);

  const aa =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(cLat1) * Math.cos(cLat2);
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return earthRadiusKm * c;
}

class AssignmentEngine {
  private locationStaleMs = locationConfig.heroLocationStaleSeconds * 1000;

  private parseBookingLocation(snapshot: unknown): BookingLocation {
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
      return {};
    }

    const data = snapshot as Record<string, unknown>;
    const rawLatitude = data.latitude;
    const rawLongitude = data.longitude;
    const latitude =
      typeof rawLatitude === "number"
        ? rawLatitude
        : typeof rawLatitude === "string" && rawLatitude.trim() !== ""
          ? Number(rawLatitude)
          : undefined;
    const longitude =
      typeof rawLongitude === "number"
        ? rawLongitude
        : typeof rawLongitude === "string" && rawLongitude.trim() !== ""
          ? Number(rawLongitude)
          : undefined;

    return {
      city: typeof data.city === "string" ? data.city.trim().toUpperCase() : undefined,
      pincode: typeof data.pincode === "string" ? data.pincode.trim() : undefined,
      latitude: Number.isFinite(latitude) ? latitude : undefined,
      longitude: Number.isFinite(longitude) ? longitude : undefined,
    };
  }

  private isProfileAvailable(workerState: WorkerState): boolean {
    return ([WorkerState.AVAILABLE, WorkerState.ONLINE, WorkerState.COMPLETED] as WorkerState[]).includes(workerState);
  }

  private hasFreshLiveLocation(lastUpdatedAt: Date): boolean {
    return Date.now() - lastUpdatedAt.getTime() <= this.locationStaleMs;
  }

  private isAreaMatch(
    bookingLocation: BookingLocation,
    area: {
      city: string | null;
      pincode: string | null;
      latitude: any;
      longitude: any;
      radiusKm: any;
    },
  ): { matched: boolean; distanceKm: number } {
    const bookingLat = bookingLocation.latitude;
    const bookingLon = bookingLocation.longitude;
    const areaLat = area.latitude ? Number(area.latitude) : undefined;
    const areaLon = area.longitude ? Number(area.longitude) : undefined;
    const radiusKm = area.radiusKm ? Number(area.radiusKm) : undefined;

    if (bookingLat !== undefined && bookingLon !== undefined && areaLat !== undefined && areaLon !== undefined) {
      const distanceKm = haversineKm(bookingLat, bookingLon, areaLat, areaLon);
      const matched = radiusKm ? distanceKm <= radiusKm : true;
      return {
        matched,
        distanceKm,
      };
    }

    const cityMatch = bookingLocation.city && area.city
      ? bookingLocation.city === area.city.trim().toUpperCase()
      : false;
    const pincodeMatch = bookingLocation.pincode && area.pincode
      ? bookingLocation.pincode === area.pincode.trim()
      : false;

    return {
      matched: cityMatch || pincodeMatch,
      distanceKm: cityMatch || pincodeMatch ? 0 : Number.MAX_SAFE_INTEGER,
    };
  }

  async findRankedCandidates(iServiceMasterId: number, serviceAddressSnapshot: unknown): Promise<AssignmentCandidate[]> {
    const mappings = await assignmentRepository.findEligibleHeroMappings(iServiceMasterId);
    const bookingLocation = this.parseBookingLocation(serviceAddressSnapshot);
    const candidates: AssignmentCandidate[] = [];

    for (const mapping of mappings) {
      const hero = mapping.hero;
      const profile = hero.heroProfile;
      const liveLocation = hero.heroLiveLocation;

      if (!profile || !profile.isActive || !this.isProfileAvailable(profile.workerState)) {
        continue;
      }

      if (!liveLocation || !this.hasFreshLiveLocation(liveLocation.lastUpdatedAt)) {
        continue;
      }

      const areaMatches = hero.heroServiceAreas
        .map((area) => this.isAreaMatch(bookingLocation, area))
        .filter((result) => result.matched);

      if (areaMatches.length === 0) {
        continue;
      }

      const bookingLat = bookingLocation.latitude;
      const bookingLon = bookingLocation.longitude;
      const heroLat = Number(liveLocation.latitude);
      const heroLon = Number(liveLocation.longitude);
      const distanceKm =
        bookingLat !== undefined && bookingLon !== undefined
          ? haversineKm(bookingLat, bookingLon, heroLat, heroLon)
          : Math.min(...areaMatches.map((match) => match.distanceKm));
      const activeJobs = await assignmentRepository.getActiveJobsCount(hero.iMasterId);
      const locationAgeMs = Date.now() - liveLocation.lastUpdatedAt.getTime();

      candidates.push({
        iHeroUserMasterId: hero.iMasterId,
        distanceKm,
        activeJobs,
        averageRating: Number(profile.averageRating),
        locationAgeMs,
      });
    }

    candidates.sort((a, b) => {
      if (a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }

      if (a.locationAgeMs !== b.locationAgeMs) {
        return a.locationAgeMs - b.locationAgeMs;
      }

      if (a.activeJobs !== b.activeJobs) {
        return a.activeJobs - b.activeJobs;
      }

      return b.averageRating - a.averageRating;
    });

    return candidates;
  }
}

export const assignmentEngine = new AssignmentEngine();
