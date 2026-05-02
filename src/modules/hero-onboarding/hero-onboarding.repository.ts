import { HeroVerificationStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export type HeroOnboardingUpsertInput = {
  iHeroUserMasterId: number;
  fullName: string;
  mobileNumber: string;
  email?: string | null;
  dateOfBirth?: Date | null;
  gender?: string | null;
  fatherName?: string | null;
  alternateMobileNumber?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state?: string | null;
  pincode?: string | null;
  latitude?: Prisma.Decimal | null;
  longitude?: Prisma.Decimal | null;
  selectedJobRole?: string | null;
  selectedCity?: string | null;
  workType?: string | null;
  vehicleType?: string | null;
  earningsType?: string | null;
  onboardingSource?: string | null;
  referralCode?: string | null;
  nearestHubId?: number | null;
};

class HeroOnboardingRepository {
  getApplicationByHeroId(iHeroUserMasterId: number) {
    return prisma.tHeroOnboardingApplications.findUnique({
      where: { iHeroUserMasterId },
      include: {
        nearestHub: true,
        verifiedBy: {
          select: {
            iMasterId: true,
            username: true,
            firstName: true,
            middleName: true,
            lastName: true,
          },
        },
      },
    });
  }

  getHeroProfileByUserId(iHeroUserMasterId: number) {
    return prisma.mHeroProfiles.findFirst({
      where: {
        iUserMasterId: iHeroUserMasterId,
        isDeleted: false,
      },
      select: {
        iMasterId: true,
        iUserMasterId: true,
        isActive: true,
        isVerified: true,
        verificationStatus: true,
      },
    });
  }

  getActiveHubs() {
    return prisma.mHubs.findMany({
      where: { isActive: true },
      orderBy: [{ city: "asc" }, { sName: "asc" }],
    });
  }

  upsertSubmittedApplication(input: HeroOnboardingUpsertInput) {
    const submittedAt = new Date();
    const data = {
      fullName: input.fullName,
      mobileNumber: input.mobileNumber,
      email: input.email ?? null,
      dateOfBirth: input.dateOfBirth ?? null,
      gender: input.gender ?? null,
      fatherName: input.fatherName ?? null,
      alternateMobileNumber: input.alternateMobileNumber ?? null,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2 ?? null,
      city: input.city,
      state: input.state ?? null,
      pincode: input.pincode ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      selectedJobRole: input.selectedJobRole ?? null,
      selectedCity: input.selectedCity ?? null,
      workType: input.workType ?? null,
      vehicleType: input.vehicleType ?? null,
      earningsType: input.earningsType ?? null,
      onboardingSource: input.onboardingSource ?? null,
      referralCode: input.referralCode ?? null,
      verificationStatus: HeroVerificationStatus.PENDING_HUB_VERIFICATION,
      nearestHubId: input.nearestHubId ?? null,
      submittedAt,
      verifiedAt: null,
      verifiedByUserMasterId: null,
      rejectionReason: null,
      adminRemarks: null,
    };

    return prisma.$transaction(async (tx) => {
      const application = await tx.tHeroOnboardingApplications.upsert({
        where: { iHeroUserMasterId: input.iHeroUserMasterId },
        create: {
          iHeroUserMasterId: input.iHeroUserMasterId,
          ...data,
        },
        update: data,
        include: {
          nearestHub: true,
          verifiedBy: {
            select: {
              iMasterId: true,
              username: true,
              firstName: true,
              middleName: true,
              lastName: true,
            },
          },
        },
      });

      await tx.mHeroProfiles.updateMany({
        where: {
          iUserMasterId: input.iHeroUserMasterId,
          isDeleted: false,
        },
        data: {
          isVerified: false,
          verificationStatus: HeroVerificationStatus.PENDING_HUB_VERIFICATION,
          isAvailable: false,
        },
      });

      return application;
    });
  }
}

export const heroOnboardingRepository = new HeroOnboardingRepository();
