import { EmploymentStatus } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";

type LoginResult = {
  token: string;
  user: {
    id: number;
    username: string;
    name: string;
    email: string;
    role: string;
    roleCode: string;
    isActive: boolean;
  };
};

type LoginUser = {
  iMasterId: number;
  username: string;
  password: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  email: string | null;
  isActive: boolean;
  employmentStatus: EmploymentStatus;
  role: {
    sCode: string;
    sName: string;
  } | null;
};

class AuthService {
  private buildDisplayName(user: LoginUser): string {
    const parts = [user.firstName, user.middleName, user.lastName]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value));

    if (parts.length === 0) {
      return user.username;
    }

    return parts.join(" ");
  }

  private generateSessionToken(userId: number): string {
    const seed = `${userId}:${Date.now()}:${randomBytes(24).toString("hex")}`;
    return Buffer.from(seed).toString("base64url");
  }

  async login(username: string, password: string): Promise<LoginResult> {
    const user = await prisma.mUsers.findFirst({
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
        role: {
          select: {
            sCode: true,
            sName: true,
          },
        },
      },
    });

    if (!user || user.password !== password) {
      throw new ApiError(401, "Invalid username or password.");
    }

    if (!user.isActive || user.employmentStatus !== EmploymentStatus.ACTIVE) {
      throw new ApiError(403, "This account is inactive. Contact administrator.");
    }

    return {
      token: this.generateSessionToken(user.iMasterId),
      user: {
        id: user.iMasterId,
        username: user.username,
        name: this.buildDisplayName(user),
        email: user.email ?? "",
        role: user.role?.sName ?? "User",
        roleCode: user.role?.sCode ?? "",
        isActive: user.isActive,
      },
    };
  }
}

export const authService = new AuthService();
