import { HeroVerificationStatus, Prisma } from "@prisma/client";
import { AuthenticatedUser } from "../../types/auth";
import { ApiError } from "../../utils/api-error";
import { parseOptionalString } from "../../utils/request-parsers";
import { hasCoordinates, haversineKm } from "./hub-distance";
import { heroOnboardingRepository } from "./hero-onboarding.repository";

const HERO_MARKERS = new Set(["HERO", "WORKER", "UT_HERO", "UT_WORKER"]);

export type HeroOnboardingInput = {
  fullName: string;
  mobileNumber: string;
  email?: string;
  dateOfBirth?: Date;
  gender?: string;
  fatherName?: string;
  alternateMobileNumber?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  selectedJobRole?: string;
  selectedCity?: string;
  workType?: string;
  vehicleType?: string;
  earningsType?: string;
  onboardingSource?: string;
  referralCode?: string;
};

class HeroOnboardingService {
  private assertHeroUser(user: AuthenticatedUser): void {
    const code = user.userTypeCode?.trim().toUpperCase();
    const name = user.userTypeName?.trim().toUpperCase();

    if ((!code || !HERO_MARKERS.has(code)) && name !== "HERO" && name !== "WORKER") {
      throw new ApiError(403, "Only hero users can access hero onboarding.");
    }
  }

  private buildDisplayName(application: { fullName: string } | null, user: AuthenticatedUser): string {
    return application?.fullName || user.username;
  }

  private toDecimal(value?: number): Prisma.Decimal | null {
    return value === undefined ? null : new Prisma.Decimal(value);
  }

  private serializeHub(
    hub: Awaited<ReturnType<typeof heroOnboardingRepository.getActiveHubs>>[number],
    distanceKm?: number,
  ) {
    return {
      id: hub.iMasterId,
      name: hub.sName,
      addressLine1: hub.addressLine1,
      city: hub.city,
      latitude: Number(hub.latitude),
      longitude: Number(hub.longitude),
      contactNumber: hub.contactNumber,
      distanceKm: distanceKm !== undefined ? Number(distanceKm.toFixed(2)) : undefined,
    };
  }

  private serializeApplication(application: Awaited<ReturnType<typeof heroOnboardingRepository.getApplicationByHeroId>>) {
    if (!application) {
      return null;
    }

    return {
      id: application.iTransId,
      heroUserId: application.iHeroUserMasterId,
      fullName: application.fullName,
      mobileNumber: application.mobileNumber,
      email: application.email,
      dateOfBirth: application.dateOfBirth?.toISOString() ?? null,
      gender: application.gender,
      fatherName: application.fatherName,
      alternateMobileNumber: application.alternateMobileNumber,
      addressLine1: application.addressLine1,
      addressLine2: application.addressLine2,
      city: application.city,
      state: application.state,
      pincode: application.pincode,
      latitude: application.latitude ? Number(application.latitude) : null,
      longitude: application.longitude ? Number(application.longitude) : null,
      selectedJobRole: application.selectedJobRole,
      selectedCity: application.selectedCity,
      workType: application.workType,
      vehicleType: application.vehicleType,
      earningsType: application.earningsType,
      onboardingSource: application.onboardingSource,
      referralCode: application.referralCode,
      verificationStatus: application.verificationStatus,
      submittedAt: application.submittedAt?.toISOString() ?? null,
      verifiedAt: application.verifiedAt?.toISOString() ?? null,
      rejectionReason: application.rejectionReason,
      adminRemarks: application.adminRemarks,
      nearestHub: application.nearestHub ? this.serializeHub(application.nearestHub) : null,
    };
  }

  async findNearestHub(input: { latitude?: number; longitude?: number; city?: string }) {
    const hubs = await heroOnboardingRepository.getActiveHubs();
    if (hubs.length === 0) {
      return null;
    }

    if (hasCoordinates(input)) {
      const ranked = hubs
        .map((hub) => ({
          hub,
          distanceKm: haversineKm(input.latitude, input.longitude, Number(hub.latitude), Number(hub.longitude)),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm);

      return this.serializeHub(ranked[0].hub, ranked[0].distanceKm);
    }

    const city = parseOptionalString(input.city)?.toUpperCase();
    const cityMatch = city ? hubs.find((hub) => hub.city.trim().toUpperCase() === city) : undefined;
    return this.serializeHub(cityMatch ?? hubs[0]);
  }

  async getStatus(user: AuthenticatedUser) {
    this.assertHeroUser(user);

    const [application, profile] = await Promise.all([
      heroOnboardingRepository.getApplicationByHeroId(user.iMasterId),
      heroOnboardingRepository.getHeroProfileByUserId(user.iMasterId),
    ]);

    const verificationStatus =
      profile?.verificationStatus ?? application?.verificationStatus ?? HeroVerificationStatus.DRAFT;

    return {
      heroUserId: user.iMasterId,
      displayName: this.buildDisplayName(application, user),
      verificationStatus,
      isVerified: Boolean(profile?.isVerified && verificationStatus === HeroVerificationStatus.VERIFIED),
      canGoOnline: Boolean(profile?.isVerified && verificationStatus === HeroVerificationStatus.VERIFIED),
      application: this.serializeApplication(application),
      nearestHub: application?.nearestHub ? this.serializeHub(application.nearestHub) : null,
    };
  }

  async getApplication(user: AuthenticatedUser) {
    this.assertHeroUser(user);
    const application = await heroOnboardingRepository.getApplicationByHeroId(user.iMasterId);
    if (!application) {
      throw new ApiError(404, "Hero onboarding application not found.");
    }

    return this.serializeApplication(application);
  }

  async submit(user: AuthenticatedUser, input: HeroOnboardingInput) {
    this.assertHeroUser(user);

    const profile = await heroOnboardingRepository.getHeroProfileByUserId(user.iMasterId);
    if (!profile || !profile.isActive) {
      throw new ApiError(404, "Active hero profile not found.");
    }

    if (profile.verificationStatus === HeroVerificationStatus.VERIFIED) {
      throw new ApiError(400, "Hero is already verified.");
    }

    const nearestHub = await this.findNearestHub({
      latitude: input.latitude,
      longitude: input.longitude,
      city: input.selectedCity ?? input.city,
    });

    const application = await heroOnboardingRepository.upsertSubmittedApplication({
      iHeroUserMasterId: user.iMasterId,
      ...input,
      latitude: this.toDecimal(input.latitude),
      longitude: this.toDecimal(input.longitude),
      nearestHubId: nearestHub?.id ?? null,
    });

    return {
      application: this.serializeApplication(application),
      nearestHub,
      message: nearestHub
        ? "Please visit nearest Jiffit hub for verification."
        : "Please visit a Jiffit hub for verification.",
    };
  }

  resubmit(user: AuthenticatedUser, input: HeroOnboardingInput) {
    return this.submit(user, input);
  }
}

export const heroOnboardingService = new HeroOnboardingService();
