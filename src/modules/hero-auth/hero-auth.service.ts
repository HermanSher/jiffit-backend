import crypto from "node:crypto";
import { authConfig } from "../../config/auth.config";
import { ApiError } from "../../utils/api-error";
import { sha256, signAccessToken, signRefreshToken } from "../../utils/jwt";
import { hashPassword } from "../../utils/password";
import { heroOnboardingService } from "../hero-onboarding/hero-onboarding.service";
import { heroAuthRepository } from "./hero-auth.repository";

const HERO_MARKERS = new Set(["HERO", "WORKER", "UT_HERO", "UT_WORKER"]);

type VerifyOtpInput = {
  mobileNumber: string;
  otp: string;
  deviceInfo?: string;
  ipAddress?: string;
};

class HeroAuthService {
  private buildSessionExpiryDate(): Date {
    const expires = new Date();
    expires.setDate(expires.getDate() + authConfig.refreshSessionDays);
    return expires;
  }

  private isHeroUser(user: { userType: { sCode: string; sName: string } | null }): boolean {
    const code = user.userType?.sCode?.trim().toUpperCase();
    const name = user.userType?.sName?.trim().toUpperCase();
    return Boolean((code && HERO_MARKERS.has(code)) || name === "HERO" || name === "WORKER");
  }

  private buildUsername(mobileNumber: string): string {
    return `hero_${mobileNumber.replace(/\D/g, "")}`;
  }

  private buildFullName(user: {
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    mobileNo?: string | null;
    username: string;
    heroOnboardingApplication?: { fullName: string } | null;
  }): string {
    if (user.heroOnboardingApplication?.fullName?.trim()) {
      return user.heroOnboardingApplication.fullName.trim();
    }

    const parts = [user.firstName, user.middleName, user.lastName]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value));

    if (parts.length > 0) {
      return parts.join(" ");
    }

    return user.mobileNo ? `Hero ${user.mobileNo}` : user.username;
  }

  private buildUserPayload(user: {
    iMasterId: number;
    username: string;
    mobileNo: string | null;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    role: { sName: string; sCode: string } | null;
    userType: { sName: string; sCode: string } | null;
    heroProfile: { isVerified: boolean; verificationStatus: string } | null;
    heroOnboardingApplication?: { fullName: string } | null;
  }) {
    return {
      id: user.iMasterId,
      username: user.username,
      mobileNumber: user.mobileNo ?? "",
      fullName: this.buildFullName(user),
      role: user.role?.sName ?? "Hero",
      roleCode: user.role?.sCode ?? "HERO",
      userType: user.userType?.sName ?? "Hero",
      userTypeCode: user.userType?.sCode ?? "HERO",
      isVerified: user.heroProfile?.isVerified ?? false,
      verificationStatus: user.heroProfile?.verificationStatus ?? "DRAFT",
    };
  }

  requestOtp(mobileNumber: string) {
    return {
      mobileNumber,
      otp: "123456",
      expiresInSeconds: 300,
      mock: true,
    };
  }

  async verifyOtp(input: VerifyOtpInput) {
    if (!input.otp.trim()) {
      throw new ApiError(400, "otp is required.");
    }

    let user = await heroAuthRepository.findHeroUserByMobile(input.mobileNumber);

    if (user && !this.isHeroUser(user)) {
      throw new ApiError(403, "This mobile number is not registered as a hero account.");
    }

    if (!user) {
      const [role, userType] = await Promise.all([
        heroAuthRepository.ensureHeroRole(),
        heroAuthRepository.ensureHeroUserType(),
      ]);

      user = await heroAuthRepository.createHeroUser({
        mobileNumber: input.mobileNumber,
        username: this.buildUsername(input.mobileNumber),
        password: await hashPassword(crypto.randomBytes(24).toString("hex")),
        iRoleMasterId: role.iMasterId,
        iUserTypeMasterId: userType.iMasterId,
      });
    } else if (!user.heroProfile) {
      await heroAuthRepository.ensureHeroProfile(user.iMasterId);
      user = await heroAuthRepository.findHeroUserByMobile(input.mobileNumber);
    }

    if (!user || !user.isActive || user.employmentStatus !== "ACTIVE") {
      throw new ApiError(403, "Hero account is inactive. Contact administrator.");
    }

    const sessionExpiry = this.buildSessionExpiryDate();
    const provisionalRefreshToken = signRefreshToken({
      sub: user.iMasterId,
      sid: 0,
      typ: "refresh",
    });

    const session = await heroAuthRepository.createSession({
      userId: user.iMasterId,
      refreshTokenHash: sha256(provisionalRefreshToken),
      deviceInfo: input.deviceInfo,
      ipAddress: input.ipAddress,
      expiresAt: sessionExpiry,
    });

    const accessToken = signAccessToken({
      sub: user.iMasterId,
      sid: session.id,
    });
    const refreshToken = signRefreshToken({
      sub: user.iMasterId,
      sid: session.id,
      typ: "refresh",
    });

    await heroAuthRepository.rotateSessionToken(session.id, sha256(refreshToken), sessionExpiry);

    const authUser = {
      iMasterId: user.iMasterId,
      username: user.username,
      iRoleMasterId: user.iRoleMasterId ?? null,
      iUserTypeMasterId: user.iUserTypeMasterId ?? null,
      roleCode: user.role?.sCode ?? null,
      roleName: user.role?.sName ?? null,
      rolePrecedence: user.role?.precedence ?? null,
      userTypeCode: user.userType?.sCode ?? null,
      userTypeName: user.userType?.sName ?? null,
      isActive: user.isActive,
      employmentStatus: user.employmentStatus,
      sessionId: session.id,
    };

    if (!user.heroOnboardingApplication && !user.heroProfile?.isVerified) {
      await heroOnboardingService.saveDraft(authUser, {
        fullName: this.buildFullName(user),
        mobileNumber: user.mobileNo ?? input.mobileNumber,
      });
    }

    const status = await heroOnboardingService.getStatus(authUser);

    return {
      accessToken,
      refreshToken,
      user: this.buildUserPayload(user),
      onboarding: status,
    };
  }
}

export const heroAuthService = new HeroAuthService();
