import { Router } from "express";
import { permissionCodes } from "../../constants/permission-codes";
import { requirePermission } from "../../middlewares/permission.middleware";
import { dispatchAssignment, retryAssignment } from "./assignment.controller";

const assignmentRouter = Router();

assignmentRouter.post(
  "/dispatch/:bookingId",
  requirePermission(permissionCodes.ASSIGNMENTS_UPDATE),
  dispatchAssignment,
);
assignmentRouter.post(
  "/retry/:bookingId",
  requirePermission(permissionCodes.ASSIGNMENTS_UPDATE),
  retryAssignment,
);

export default assignmentRouter;
