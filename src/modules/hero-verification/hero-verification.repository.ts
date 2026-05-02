import { HeroVerificationStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export type HeroVerificationFilters = {
  status?: HeroVerificationStatus;
  city?: string;
  search?: string;
  limit: number;
};

export type HeroVerificationUpdateInput = {
  fullName?: string;
  selectedCity?: string | null;
  selectedJobRole?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  workType?: string | null;
  vehicleType?: string | null;
  earningsType?: string | null;
  adminRemarks?: string | null;
  verificationStatus?: HeroVerificationStatus;
  verifiedByUserMasterId?: number;
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
        heroServiceMappings: {
          where: {
            isActive: true,
            isDeleted: false,
          },
          include: {
            service: {
              select: {
                iMasterId: true,
                sCode: true,
                sName: true,
              },
            },
          },
          orderBy: {
            service: {
              sName: "asc",
            },
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

  updateApplication(iTransId: number, input: HeroVerificationUpdateInput) {
    return prisma.$transaction(async (tx) => {
      const application = await tx.tHeroOnboardingApplications.update({
        where: { iTransId },
        data: {
          fullName: input.fullName,
          selectedCity: input.selectedCity,
          selectedJobRole: input.selectedJobRole,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
          workType: input.workType,
          vehicleType: input.vehicleType,
          earningsType: input.earningsType,
          adminRemarks: input.adminRemarks,
          verificationStatus: input.verificationStatus,
          submittedAt:
            input.verificationStatus === HeroVerificationStatus.PENDING_HUB_VERIFICATION
              ? new Date()
              : undefined,
          verifiedAt: input.verificationStatus === HeroVerificationStatus.VERIFIED ? new Date() : undefined,
          verifiedByUserMasterId:
            input.verificationStatus === HeroVerificationStatus.VERIFIED ? input.verifiedByUserMasterId : undefined,
          rejectionReason: input.verificationStatus ? null : undefined,
        },
        include: this.includeDetails,
      });

      if (input.verificationStatus === HeroVerificationStatus.VERIFIED) {
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
      } else if (input.verificationStatus === HeroVerificationStatus.PENDING_HUB_VERIFICATION) {
        await tx.mHeroProfiles.updateMany({
          where: {
            iUserMasterId: application.iHeroUserMasterId,
            isDeleted: false,
          },
          data: {
            isVerified: false,
            verificationStatus: HeroVerificationStatus.PENDING_HUB_VERIFICATION,
            isAvailable: false,
          },
        });
      }

      return application;
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
