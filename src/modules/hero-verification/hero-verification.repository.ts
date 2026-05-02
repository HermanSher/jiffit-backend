import { HeroVerificationStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export type HeroVerificationFilters = {
  status?: HeroVerificationStatus;
  city?: string;
  search?: string;
  limit: number;
};

class HeroVerificationRepository {
  private includeDetails = {
    hero: {
      select: {
        iMasterId: true,
        username: true,
        mobileNo: true,
        email: true,
        heroProfile: {
          select: {
            heroCode: true,
            isVerified: true,
            verificationStatus: true,
            workerState: true,
          },
        },
      },
    },
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
  } satisfies Prisma.tHeroOnboardingApplicationsInclude;

  listApplications(filters: HeroVerificationFilters) {
    return prisma.tHeroOnboardingApplications.findMany({
      where: {
        verificationStatus: filters.status,
        city: filters.city ? { contains: filters.city } : undefined,
        OR: filters.search
          ? [
              { fullName: { contains: filters.search } },
              { mobileNumber: { contains: filters.search } },
              { email: { contains: filters.search } },
              { city: { contains: filters.search } },
            ]
          : undefined,
      },
      include: this.includeDetails,
      orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
      take: filters.limit,
    });
  }

  getApplicationById(iTransId: number) {
    return prisma.tHeroOnboardingApplications.findFirst({
      where: { iTransId },
      include: this.includeDetails,
    });
  }

  verifyApplication(iTransId: number, verifiedByUserMasterId: number, adminRemarks?: string) {
    return prisma.$transaction(async (tx) => {
      const application = await tx.tHeroOnboardingApplications.update({
        where: { iTransId },
        data: {
          verificationStatus: HeroVerificationStatus.VERIFIED,
          verifiedAt: new Date(),
          verifiedByUserMasterId,
          adminRemarks: adminRemarks ?? null,
          rejectionReason: null,
        },
        include: this.includeDetails,
      });

      await tx.mHeroProfiles.updateMany({
        where: {
          iUserMasterId: application.iHeroUserMasterId,
          isDeleted: false,
        },
        data: {
          isVerified: true,
          verificationStatus: HeroVerificationStatus.VERIFIED,
        },
      });

      return application;
    });
  }

  rejectApplication(iTransId: number, rejectionReason: string, adminRemarks?: string) {
    return prisma.$transaction(async (tx) => {
      const application = await tx.tHeroOnboardingApplications.update({
        where: { iTransId },
        data: {
          verificationStatus: HeroVerificationStatus.REJECTED,
          verifiedAt: null,
          verifiedByUserMasterId: null,
          rejectionReason,
          adminRemarks: adminRemarks ?? null,
        },
        include: this.includeDetails,
      });

      await tx.mHeroProfiles.updateMany({
        where: {
          iUserMasterId: application.iHeroUserMasterId,
          isDeleted: false,
        },
        data: {
          isVerified: false,
          verificationStatus: HeroVerificationStatus.REJECTED,
          isAvailable: false,
        },
      });

      return application;
    });
  }

  requireResubmission(iTransId: number, adminRemarks: string) {
    return prisma.$transaction(async (tx) => {
      const application = await tx.tHeroOnboardingApplications.update({
        where: { iTransId },
        data: {
          verificationStatus: HeroVerificationStatus.RESUBMISSION_REQUIRED,
          verifiedAt: null,
          verifiedByUserMasterId: null,
          adminRemarks,
        },
        include: this.includeDetails,
      });

      await tx.mHeroProfiles.updateMany({
        where: {
          iUserMasterId: application.iHeroUserMasterId,
          isDeleted: false,
        },
        data: {
          isVerified: false,
          verificationStatus: HeroVerificationStatus.RESUBMISSION_REQUIRED,
          isAvailable: false,
        },
      });

      return application;
    });
  }
}

export const heroVerificationRepository = new HeroVerificationRepository();
