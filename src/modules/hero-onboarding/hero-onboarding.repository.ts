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
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
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
  selectedServiceIds?: number[];
};

export type HeroOnboardingDraftUpsertInput = Pick<
  HeroOnboardingUpsertInput,
  | "iHeroUserMasterId"
  | "fullName"
  | "mobileNumber"
  | "selectedCity"
  | "selectedJobRole"
  | "latitude"
  | "longitude"
  | "nearestHubId"
  | "selectedServiceIds"
>;

class HeroOnboardingRepository {
  private includeApplicationDetails = {
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
    hero: {
      select: {
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
                shortDescription: true,
                description: true,
                basePrice: true,
                salePrice: true,
                estimatedDurationMinutes: true,
                category: {
                  select: {
                    iMasterId: true,
                    sName: true,
                  },
                },
                serviceType: {
                  select: {
                    iMasterId: true,
                    sName: true,
                  },
                },
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
  } satisfies Prisma.tHeroOnboardingApplicationsInclude;

  getApplicationByHeroId(iHeroUserMasterId: number) {
    return prisma.tHeroOnboardingApplications.findUnique({
      where: { iHeroUserMasterId },
      include: this.includeApplicationDetails,
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

  getActiveServices() {
    return prisma.mServices.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
      select: {
        iMasterId: true,
        sCode: true,
        sName: true,
        description: true,
        shortDescription: true,
        basePrice: true,
        salePrice: true,
        estimatedDurationMinutes: true,
        category: {
          select: {
            iMasterId: true,
            sName: true,
          },
        },
        serviceType: {
          select: {
            iMasterId: true,
            sName: true,
          },
        },
      },
      orderBy: [{ sName: "asc" }],
    });
  }

  async findActiveServiceIds(serviceIds: number[]) {
    if (serviceIds.length === 0) {
      return [];
    }

    const services = await prisma.mServices.findMany({
      where: {
        iMasterId: { in: serviceIds },
        isActive: true,
        isDeleted: false,
      },
      select: { iMasterId: true },
    });

    return services.map((service) => service.iMasterId);
  }

  private async syncHeroServiceMappings(
    tx: Prisma.TransactionClient,
    iHeroUserMasterId: number,
    selectedServiceIds?: number[],
  ) {
    if (selectedServiceIds === undefined) {
      return;
    }

    const uniqueServiceIds = [...new Set(selectedServiceIds)];

    await tx.mHeroServiceMappings.updateMany({
      where: {
        iHeroUserMasterId,
        iServiceMasterId: uniqueServiceIds.length > 0 ? { notIn: uniqueServiceIds } : undefined,
      },
      data: {
        isActive: false,
      },
    });

    await Promise.all(
      uniqueServiceIds.map((iServiceMasterId) =>
        tx.mHeroServiceMappings.upsert({
          where: {
            iHeroUserMasterId_iServiceMasterId: {
              iHeroUserMasterId,
              iServiceMasterId,
            },
          },
          create: {
            iHeroUserMasterId,
            iServiceMasterId,
            isActive: true,
            isDeleted: false,
          },
          update: {
            isActive: true,
            isDeleted: false,
            deletedAt: null,
            deletedByUserMasterId: null,
          },
        }),
      ),
    );
  }

  upsertDraftApplication(input: HeroOnboardingDraftUpsertInput) {
    const data = {
      fullName: input.fullName,
      mobileNumber: input.mobileNumber,
      selectedCity: input.selectedCity,
      selectedJobRole: input.selectedJobRole,
      latitude: input.latitude,
      longitude: input.longitude,
      nearestHubId: input.nearestHubId,
      verificationStatus: HeroVerificationStatus.DRAFT,
      submittedAt: null,
      verifiedAt: null,
      verifiedByUserMasterId: null,
      rejectionReason: null,
    };

    return prisma.$transaction(async (tx) => {
      await tx.tHeroOnboardingApplications.upsert({
        where: { iHeroUserMasterId: input.iHeroUserMasterId },
        create: {
          iHeroUserMasterId: input.iHeroUserMasterId,
          ...data,
        },
        update: data,
        include: this.includeApplicationDetails,
      });

      await this.syncHeroServiceMappings(tx, input.iHeroUserMasterId, input.selectedServiceIds);

      await tx.mHeroProfiles.updateMany({
        where: {
          iUserMasterId: input.iHeroUserMasterId,
          isDeleted: false,
        },
        data: {
          isVerified: false,
          verificationStatus: HeroVerificationStatus.DRAFT,
          isAvailable: false,
        },
      });

      return tx.tHeroOnboardingApplications.findUniqueOrThrow({
        where: { iHeroUserMasterId: input.iHeroUserMasterId },
        include: this.includeApplicationDetails,
      });
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
        include: this.includeApplicationDetails,
      });

      await this.syncHeroServiceMappings(tx, input.iHeroUserMasterId, input.selectedServiceIds);

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

      return tx.tHeroOnboardingApplications.findUniqueOrThrow({
        where: { iHeroUserMasterId: input.iHeroUserMasterId },
        include: this.includeApplicationDetails,
      });
    });
  }
}

export const heroOnboardingRepository = new HeroOnboardingRepository();
