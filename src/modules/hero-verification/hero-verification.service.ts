import { HeroVerificationStatus } from "@prisma/client";
import { ApiError } from "../../utils/api-error";
import {
  heroVerificationRepository,
  HeroVerificationFilters,
  HeroVerificationUpdateInput,
} from "./hero-verification.repository";

class HeroVerificationService {
  private serializeUserName(user: {
    username: string;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
  } | null): string | null {
    if (!user) {
      return null;
    }

    const parts = [user.firstName, user.middleName, user.lastName]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value));

    return parts.length > 0 ? parts.join(" ") : user.username;
  }

  private serializeHub(hub: { iMasterId: number; sName: string; addressLine1: string; city: string; latitude: any; longitude: any; contactNumber: string | null } | null) {
    if (!hub) {
      return null;
    }

    return {
      id: hub.iMasterId,
      name: hub.sName,
      addressLine1: hub.addressLine1,
      city: hub.city,
      latitude: Number(hub.latitude),
      longitude: Number(hub.longitude),
      contactNumber: hub.contactNumber,
    };
  }

  private serializeApplication(application: Awaited<ReturnType<typeof heroVerificationRepository.getApplicationById>>) {
    if (!application) {
      return null;
    }

    return {
      id: application.iTransId,
      heroUserId: application.iHeroUserMasterId,
      heroCode: application.hero.heroProfile?.heroCode ?? null,
      username: application.hero.username,
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
      selectedServiceIds: application.hero.heroServiceMappings.map((mapping) => mapping.iServiceMasterId),
      selectedServices: application.hero.heroServiceMappings.map((mapping) => ({
        id: mapping.service.iMasterId,
        code: mapping.service.sCode,
        name: mapping.service.sName,
      })),
      workType: application.workType,
      vehicleType: application.vehicleType,
      earningsType: application.earningsType,
      onboardingSource: application.onboardingSource,
      referralCode: application.referralCode,
      verificationStatus: application.verificationStatus,
      isVerified: application.hero.heroProfile?.isVerified ?? false,
      workerState: application.hero.heroProfile?.workerState ?? null,
      nearestHub: this.serializeHub(application.nearestHub),
      submittedAt: application.submittedAt?.toISOString() ?? null,
      verifiedAt: application.verifiedAt?.toISOString() ?? null,
      verifiedBy: application.verifiedBy
        ? {
            id: application.verifiedBy.iMasterId,
            username: application.verifiedBy.username,
            name: this.serializeUserName(application.verifiedBy),
          }
        : null,
      rejectionReason: application.rejectionReason,
      adminRemarks: application.adminRemarks,
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
    };
  }

  async list(filters: HeroVerificationFilters) {
    const rows = await heroVerificationRepository.listApplications(filters);
    return rows.map((row) => this.serializeApplication(row));
  }

  async getById(id: number) {
    const application = await heroVerificationRepository.getApplicationById(id);
    if (!application) {
      throw new ApiError(404, "Hero verification application not found.");
    }

    return this.serializeApplication(application);
  }

  async verify(id: number, verifiedByUserMasterId: number, adminRemarks?: string) {
    const application = await heroVerificationRepository.getApplicationById(id);
    if (!application) {
      throw new ApiError(404, "Hero verification application not found.");
    }

    if (application.verificationStatus === HeroVerificationStatus.VERIFIED) {
      throw new ApiError(400, "Hero is already verified.");
    }

    const updated = await heroVerificationRepository.verifyApplication(id, verifiedByUserMasterId, adminRemarks);
    return this.serializeApplication(updated);
  }

  async update(id: number, input: HeroVerificationUpdateInput) {
    const application = await heroVerificationRepository.getApplicationById(id);
    if (!application) {
      throw new ApiError(404, "Hero verification application not found.");
    }

    if (application.verificationStatus === HeroVerificationStatus.VERIFIED && input.verificationStatus !== HeroVerificationStatus.VERIFIED) {
      throw new ApiError(400, "Verified heroes cannot be moved back using this endpoint.");
    }

    const updated = await heroVerificationRepository.updateApplication(id, input);
    return this.serializeApplication(updated);
  }

  async reject(id: number, rejectionReason: string, adminRemarks?: string) {
    const application = await heroVerificationRepository.getApplicationById(id);
    if (!application) {
      throw new ApiError(404, "Hero verification application not found.");
    }

    const updated = await heroVerificationRepository.rejectApplication(id, rejectionReason, adminRemarks);
    return this.serializeApplication(updated);
  }

  async requireResubmission(id: number, adminRemarks: string) {
    const application = await heroVerificationRepository.getApplicationById(id);
    if (!application) {
      throw new ApiError(404, "Hero verification application not found.");
    }

    const updated = await heroVerificationRepository.requireResubmission(id, adminRemarks);
    return this.serializeApplication(updated);
  }
}

export const heroVerificationService = new HeroVerificationService();
