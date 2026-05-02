import { authConfig } from "../config/auth.config";
import { authRepository } from "../repositories/auth.repository";
import { AuthenticatedUser } from "../types/auth";
import { ApiError } from "../utils/api-error";
import { sha256, signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { hashPassword, isBcryptHash, verifyPassword } from "../utils/password";

type LoginInput = {
  username: string;
  password: string;
  deviceInfo?: string;
  ipAddress?: string;
};

type RefreshInput = {
  refreshToken: string;
};

type LogoutInput = {
  sessionId: number;
};

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type LoginResult = AuthTokens & {
  user: {
    id: number;
    username: string;
    name: string;
    email: string;
    role: string;
    roleCode: string;
    userType: string;
    userTypeCode: string;
    isActive: boolean;
  };
};

type MeResult = {
  id: number;
  username: string;
  name: string;
  email: string;
  role: {
    iMasterId: number | null;
    sCode: string | null;
    sName: string | null;
    precedence: number | null;
  };
  userType: {
    iMasterId: number | null;
    sCode: string | null;
    sName: string | null;
  };
  isActive: boolean;
  employmentStatus: "ACTIVE" | "LEFT";
};

class AuthService {
  private buildDisplayName(input: {
    username: string;
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
  }): string {
    const parts = [input.firstName, input.middleName, input.lastName]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value));

    return parts.length > 0 ? parts.join(" ") : input.username;
  }

  private buildSessionExpiryDate(): Date {
    const expires = new Date();
    expires.setDate(expires.getDate() + authConfig.refreshSessionDays);
    return expires;
  }

  private buildUserPayload(user: {
    iMasterId: number;
    username: string;
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    email: string | null;
    role: { sName: string; sCode: string } | null;
    userType: { sName: string; sCode: string } | null;
    isActive: boolean;
  }) {
    return {
      id: user.iMasterId,
      username: user.username,
      name: this.buildDisplayName(user),
      email: user.email ?? "",
      role: user.role?.sName ?? "User",
      roleCode: user.role?.sCode ?? "",
      userType: user.userType?.sName ?? "",
      userTypeCode: user.userType?.sCode ?? "",
      isActive: user.isActive,
    };
  }

  private async issueTokensForSession(input: { userId: number; sessionId: number }): Promise<AuthTokens> {
    const accessToken = signAccessToken({
      sub: input.userId,
      sid: input.sessionId,
    });

    const refreshToken = signRefreshToken({
      sub: input.userId,
      sid: input.sessionId,
      typ: "refresh",
    });

    return { accessToken, refreshToken };
  }

  async login(input: LoginInput): Promise<LoginResult> {
    const user = await authRepository.findUserByUsername(input.username);
    if (!user) {
      throw new ApiError(401, "Invalid username or password.");
    }

    const isValidPassword = await verifyPassword(input.password, user.password);
    if (!isValidPassword) {
      throw new ApiError(401, "Invalid username or password.");
    }

    if (!authRepository.isUserActiveForLogin(user)) {
      throw new ApiError(403, "This account is inactive. Contact administrator.");
    }

    if (!isBcryptHash(user.password)) {
      const upgradedHash = await hashPassword(input.password);
      await authRepository.updateUserPassword(user.iMasterId, upgradedHash);
    }

    const sessionExpiry = this.buildSessionExpiryDate();
    const provisionalRefreshToken = signRefreshToken({
      sub: user.iMasterId,
      sid: 0,
      typ: "refresh",
    });

    const session = await authRepository.createSession({
      userId: user.iMasterId,
      refreshTokenHash: sha256(provisionalRefreshToken),
      deviceInfo: input.deviceInfo,
      ipAddress: input.ipAddress,
      expiresAt: sessionExpiry,
    });

    const tokens = await this.issueTokensForSession({
      userId: user.iMasterId,
      sessionId: session.id,
    });

    await authRepository.rotateSessionToken(
      session.id,
      sha256(tokens.refreshToken),
      sessionExpiry,
    );

    return {
      ...tokens,
      user: this.buildUserPayload(user),
    };
  }

  async refresh(input: RefreshInput): Promise<AuthTokens> {
    let payload: { sub: number; sid: number; typ: "refresh" };
    try {
      payload = verifyRefreshToken(input.refreshToken);
    } catch {
      throw new ApiError(401, "Invalid refresh token.");
    }

    const session = await authRepository.findActiveSessionById(payload.sid);
    if (!session || session.userId !== payload.sub) {
      throw new ApiError(401, "Session is no longer active.");
    }

    const providedHash = sha256(input.refreshToken);
    if (providedHash !== session.refreshTokenHash) {
      await authRepository.revokeSessionById(session.id);
      throw new ApiError(401, "Refresh token mismatch. Please login again.");
    }

    const nextExpiry = this.buildSessionExpiryDate();
    const tokens = await this.issueTokensForSession({
      userId: session.userId,
      sessionId: session.id,
    });

    await authRepository.rotateSessionToken(
      session.id,
      sha256(tokens.refreshToken),
      nextExpiry,
    );

    return tokens;
  }

  async logout(input: LogoutInput): Promise<void> {
    await authRepository.revokeSessionById(input.sessionId);
  }

  async me(user: AuthenticatedUser): Promise<MeResult> {
    const currentUser = await authRepository.findUserById(user.iMasterId);
    if (!currentUser) {
      throw new ApiError(404, "User not found.");
    }

    return {
      id: currentUser.iMasterId,
      username: currentUser.username,
      name: this.buildDisplayName(currentUser),
      email: currentUser.email ?? "",
      role: {
        iMasterId: currentUser.role?.iMasterId ?? null,
        sCode: currentUser.role?.sCode ?? null,
        sName: currentUser.role?.sName ?? null,
        precedence: currentUser.role?.precedence ?? null,
      },
      userType: {
        iMasterId: currentUser.userType?.iMasterId ?? null,
        sCode: currentUser.userType?.sCode ?? null,
        sName: currentUser.userType?.sName ?? null,
      },
      isActive: currentUser.isActive,
      employmentStatus: currentUser.employmentStatus,
    };
  }
}

export const authService = new AuthService();
