import { EmploymentStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

class AuthRepository {
  findUserByUsername(username: string) {
    return prisma.mUsers.findFirst({
      where: { username, isDeleted: false },
      select: {
        iMasterId: true,
        username: true,
        password: true,
        firstName: true,
        middleName: true,
        lastName: true,
        email: true,
        isActive: true,
        employmentStatus: true,
        iRoleMasterId: true,
        iUserTypeMasterId: true,
        role: {
          select: {
            iMasterId: true,
            sCode: true,
            sName: true,
            precedence: true,
            isActive: true,
          },
        },
        userType: {
          select: {
            iMasterId: true,
            sCode: true,
            sName: true,
            isActive: true,
          },
        },
      },
    });
  }

  findUserById(userId: number) {
    return prisma.mUsers.findFirst({
      where: {
        iMasterId: userId,
        isDeleted: false,
      },
      select: {
        iMasterId: true,
        username: true,
        firstName: true,
        middleName: true,
        lastName: true,
        email: true,
        isActive: true,
        employmentStatus: true,
        iRoleMasterId: true,
        iUserTypeMasterId: true,
        role: {
          select: {
            iMasterId: true,
            sCode: true,
            sName: true,
            precedence: true,
            isActive: true,
          },
        },
        userType: {
          select: {
            iMasterId: true,
            sCode: true,
            sName: true,
            isActive: true,
          },
        },
      },
    });
  }

  updateUserPassword(userId: number, hashedPassword: string) {
    return prisma.mUsers.update({
      where: { iMasterId: userId },
      data: { password: hashedPassword },
      select: { iMasterId: true },
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

  findActiveSessionById(sessionId: number) {
    return prisma.authSession.findFirst({
      where: {
        id: sessionId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        userId: true,
        refreshTokenHash: true,
        expiresAt: true,
      },
    });
  }

  revokeSessionById(sessionId: number) {
    return prisma.authSession.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  rotateSessionToken(sessionId: number, refreshTokenHash: string, expiresAt: Date) {
    return prisma.authSession.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash,
        expiresAt,
        revokedAt: null,
      },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
      },
    });
  }

  findCurrentSessionForUser(sessionId: number, userId: number) {
    return prisma.authSession.findFirst({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
      },
    });
  }

  isUserActiveForLogin(user: { isActive: boolean; employmentStatus: EmploymentStatus }) {
    return user.isActive && user.employmentStatus === EmploymentStatus.ACTIVE;
  }
}

export const authRepository = new AuthRepository();
