import { NextFunction, Request, Response } from "express";
import { accessControlService } from "../services/access-control.service";
import { isCustomerUserType } from "../utils/dashboard";
import { isSuperUserRole } from "../utils/role-precedence";
import { sendError } from "../utils/error-handler";

export function requirePermission(permissionCode: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authUser = req.authUser;
    if (!authUser) {
      sendError(res, 401, "Authentication required.");
      return;
    }

    if (isCustomerUserType({ sCode: authUser.userTypeCode, sName: authUser.userTypeName })) {
      sendError(res, 403, "Customer users cannot access this endpoint.");
      return;
    }

    if (isSuperUserRole({ sCode: authUser.roleCode ?? "" })) {
      next();
      return;
    }

    const allowed = await accessControlService.hasPermission(authUser, permissionCode);
    if (!allowed) {
      sendError(res, 403, `Permission denied. Missing ${permissionCode}.`);
      return;
    }

    next();
  };
}

export function requireAnyPermission(permissionCodes: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authUser = req.authUser;
    if (!authUser) {
      sendError(res, 401, "Authentication required.");
      return;
    }

    if (isCustomerUserType({ sCode: authUser.userTypeCode, sName: authUser.userTypeName })) {
      sendError(res, 403, "Customer users cannot access this endpoint.");
      return;
    }

    if (isSuperUserRole({ sCode: authUser.roleCode ?? "" })) {
      next();
      return;
    }

    const results = await Promise.all(
      permissionCodes.map((permissionCode) => accessControlService.hasPermission(authUser, permissionCode)),
    );

    if (!results.some(Boolean)) {
      sendError(res, 403, `Permission denied. Missing one of: ${permissionCodes.join(", ")}.`);
      return;
    }

    next();
  };
}

export function requireScreenAccess(screenCode: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authUser = req.authUser;
    if (!authUser) {
      sendError(res, 401, "Authentication required.");
      return;
    }

    if (isCustomerUserType({ sCode: authUser.userTypeCode, sName: authUser.userTypeName })) {
      sendError(res, 403, "Customer users cannot access this endpoint.");
      return;
    }

    if (isSuperUserRole({ sCode: authUser.roleCode ?? "" })) {
      next();
      return;
    }

    const allowed = await accessControlService.hasScreenAccess(authUser, screenCode);
    if (!allowed) {
      sendError(res, 403, `Screen access denied for ${screenCode}.`);
      return;
    }

    next();
  };
}
