import { NextFunction, Request, Response } from "express";
import { EmploymentStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AccessTokenPayload } from "../types/auth";
import { verifyAccessToken } from "../utils/jwt";
import { sendError } from "../utils/error-handler";

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

async function loadAuthenticatedUser(payload: AccessTokenPayload) {
  const session = await prisma.authSession.findFirst({
    where: {
      id: payload.sid,
      userId: payload.sub,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!session) {
    return null;
  }

  const user = await prisma.mUsers.findFirst({
    where: {
      iMasterId: payload.sub,
      isDeleted: false,
      isActive: true,
      employmentStatus: EmploymentStatus.ACTIVE,
    },
    select: {
      iMasterId: true,
      username: true,
      iRoleMasterId: true,
      iUserTypeMasterId: true,
      isActive: true,
      employmentStatus: true,
      role: {
        select: {
          sCode: true,
          sName: true,
          precedence: true,
        },
      },
      userType: {
        select: {
          sCode: true,
          sName: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
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
  } as const;
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      sendError(res, 401, "Authorization token is required.");
      return;
    }

    const payload = verifyAccessToken(token);
    const authUser = await loadAuthenticatedUser(payload);

    if (!authUser) {
      sendError(res, 401, "Invalid or expired session.");
      return;
    }

    req.authUser = authUser;
    req.ipAddress = req.ip;
    next();
  } catch (error) {
    sendError(res, 401, "Invalid or expired token.");
  }
}

export function requireAuthenticatedUser(req: Request, res: Response, next: NextFunction) {
  if (!req.authUser) {
    sendError(res, 401, "Authentication required.");
    return;
  }

  next();
}
