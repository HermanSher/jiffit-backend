import { NextFunction, Request, Response } from "express";
import { accessControlService } from "../services/access-control.service";
import { isCustomerUserType } from "../utils/dashboard";
import { isSuperUserRole } from "../utils/role-precedence";
import { sendError } from "../utils/error-handler";

export async function requireDashboardAccess(req: Request, res: Response, next: NextFunction) {
  const authUser = req.authUser;
  if (!authUser) {
    sendError(res, 401, "Authentication required.");
    return;
  }

  if (isCustomerUserType({ sCode: authUser.userTypeCode, sName: authUser.userTypeName })) {
    sendError(res, 403, "Customer users cannot access dashboard APIs.");
    return;
  }

  if (isSuperUserRole({ sCode: authUser.roleCode ?? "" })) {
    next();
    return;
  }

  const hasDashboardView = await accessControlService.hasPermission(authUser, "DASHBOARD_VIEW");
  if (!hasDashboardView) {
    sendError(res, 403, "Dashboard access denied.");
    return;
  }

  next();
}
