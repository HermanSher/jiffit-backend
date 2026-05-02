import { EmploymentStatus, HeroVerificationStatus, WorkerState } from "@prisma/client";
import { prisma } from "../../lib/prisma";

class HeroAuthRepository {
  findHeroUserByMobile(mobileNumber: string) {
    return prisma.mUsers.findFirst({
      where: {
        mobileNo: mobileNumber,
        isDeleted: false,
      },
      include: {
        role: true,
        userType: true,
        heroProfile: true,
        heroOnboardingApplication: {
          include: {
            nearestHub: true,
          },
        },
      },
    });
  }

  async ensureHeroUserType() {
    const existing = await prisma.mUserTypes.findFirst({
      where: {
        isDeleted: false,
        OR: [
          { sCode: { in: ["HERO", "WORKER", "UT_HERO", "UT_WORKER"] } },
          { sName: { in: ["Hero", "Worker"] } },
        ],
      },
    });

    if (existing) {
      return existing;
    }

    return prisma.mUserTypes.create({
      data: {
        sCode: "HERO",
        sName: "Hero",
      },
    });
  }

  async ensureHeroRole() {
    const existing = await prisma.mRoles.findFirst({
      where: {
        isDeleted: false,
        OR: [
          { sCode: { in: ["HERO", "WORKER"] } },
          { sName: { in: ["Hero", "Worker"] } },
        ],
      },
    });

    if (existing) {
      return existing;
    }

    const highest = await prisma.mRoles.findFirst({
      orderBy: { precedence: "desc" },
      select: { precedence: true },
    });

    return prisma.mRoles.create({
      data: {
        sCode: "HERO",
        sName: "Hero",
        precedence: (highest?.precedence ?? 10) + 1,
      },
    });
  }

  createHeroUser(input: {
    mobileNumber: string;
    username: string;
    password: string;
    iRoleMasterId: number;
    iUserTypeMasterId: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.mUsers.create({
        data: {
          username: input.username,
          mobileNo: input.mobileNumber,
          password: input.password,
          iRoleMasterId: input.iRoleMasterId,
          iUserTypeMasterId: input.iUserTypeMasterId,
          employmentStatus: EmploymentStatus.ACTIVE,
          isActive: true,
        },
        include: {
          role: true,
          userType: true,
          heroProfile: true,
          heroOnboardingApplication: {
            include: {
              nearestHub: true,
            },
          },
        },
      });

      await tx.mHeroProfiles.create({
        data: {
          iUserMasterId: user.iMasterId,
          heroCode: `HERO-${user.iMasterId}`,
          workerState: WorkerState.OFFLINE,
          isAvailable: false,
          isVerified: false,
          verificationStatus: HeroVerificationStatus.DRAFT,
        },
      });

      return tx.mUsers.findFirstOrThrow({
        where: { iMasterId: user.iMasterId },
        include: {
          role: true,
          userType: true,
          heroProfile: true,
          heroOnboardingApplication: {
            include: {
              nearestHub: true,
            },
          },
        },
      });
    });
  }

  ensureHeroProfile(iUserMasterId: number) {
    return prisma.mHeroProfiles.upsert({
      where: { iUserMasterId },
      create: {
        iUserMasterId,
        heroCode: `HERO-${iUserMasterId}`,
        workerState: WorkerState.OFFLINE,
        isAvailable: false,
        isVerified: false,
        verificationStatus: HeroVerificationStatus.DRAFT,
      },
      update: {},
    });
  }

  createSession(input: {
    userId: number;
    refreshTokenHash: string;
    deviceInfo?: string;
    ipAddress?: string;
    expiresAt: Date;
  }) {
    return prisma.authSession.create({
      data: {
        userId: input.userId,
        refreshTokenHash: input.refreshTokenHash,
        deviceInfo: input.deviceInfo,
        ipAddress: input.ipAddress,
        expiresAt: input.expiresAt,
      },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
      },
    });
  }

  rotateSessionToken(sessionId: number, refreshTokenHash: string, expiresAt: Date) {
    return prisma.authSession.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash,
        expiresAt,
      },
    });
  }
}

export const heroAuthRepository = new HeroAuthRepository();
