import { Router } from "express";
import { permissionCodes } from "../../constants/permission-codes";
import { requireAnyPermission, requirePermission } from "../../middlewares/permission.middleware";
import {
  getHeroVerification,
  listHeroVerifications,
  rejectHeroApplication,
  requireHeroResubmission,
  updateHeroVerification,
  verifyHeroApplication,
} from "./hero-verification.controller";

const heroVerificationRouter = Router();

heroVerificationRouter.get("/", requirePermission(permissionCodes.HERO_VERIFICATION_VIEW), listHeroVerifications);
heroVerificationRouter.get("/:id", requirePermission(permissionCodes.HERO_VERIFICATION_VIEW), getHeroVerification);
heroVerificationRouter.patch(
  "/:id",
  requireAnyPermission([permissionCodes.HERO_VERIFICATION_UPDATE, permissionCodes.HERO_VERIFICATION_VERIFY]),
  updateHeroVerification,
);
heroVerificationRouter.post("/:id/verify", requirePermission(permissionCodes.HERO_VERIFICATION_VERIFY), verifyHeroApplication);
heroVerificationRouter.post("/:id/reject", requirePermission(permissionCodes.HERO_VERIFICATION_REJECT), rejectHeroApplication);
heroVerificationRouter.post(
  "/:id/resubmission-required",
  requirePermission(permissionCodes.HERO_VERIFICATION_REJECT),
  requireHeroResubmission,
);

export default heroVerificationRouter;
