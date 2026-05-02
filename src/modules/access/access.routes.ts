import { Router } from "express";
import { permissionCodes } from "../../constants/permission-codes";
import { requirePermission } from "../../middlewares/permission.middleware";
import {
  assignRoleScreenPermissions,
  assignUserScreenPermissions,
  createPermission,
  createScreen,
  deletePermission,
  deleteScreen,
  getMyPermissions,
  getMyScreens,
  getPermissions,
  getRoleScreenPermissions,
  getScreens,
  getUserScreenPermissions,
  updatePermission,
  updateScreen,
} from "./access.controller";

const accessRouter = Router();

accessRouter.post("/screens", requirePermission(permissionCodes.SCREENS_CREATE), createScreen);
accessRouter.get("/screens", requirePermission(permissionCodes.SCREENS_VIEW), getScreens);
accessRouter.patch("/screens/:id", requirePermission(permissionCodes.SCREENS_UPDATE), updateScreen);
accessRouter.delete("/screens/:id", requirePermission(permissionCodes.SCREENS_DELETE), deleteScreen);

accessRouter.post("/permissions", requirePermission(permissionCodes.PERMISSIONS_CREATE), createPermission);
accessRouter.get("/permissions", requirePermission(permissionCodes.PERMISSIONS_VIEW), getPermissions);
accessRouter.patch("/permissions/:id", requirePermission(permissionCodes.PERMISSIONS_UPDATE), updatePermission);
accessRouter.delete("/permissions/:id", requirePermission(permissionCodes.PERMISSIONS_DELETE), deletePermission);

accessRouter.post(
  "/roles/:roleId/screen-permissions",
  requirePermission(permissionCodes.PERMISSIONS_ASSIGN),
  assignRoleScreenPermissions,
);
accessRouter.get(
  "/roles/:roleId/screen-permissions",
  requirePermission(permissionCodes.PERMISSIONS_VIEW),
  getRoleScreenPermissions,
);

accessRouter.post(
  "/users/:userId/screen-permissions",
  requirePermission(permissionCodes.PERMISSIONS_ASSIGN),
  assignUserScreenPermissions,
);
accessRouter.get(
  "/users/:userId/screen-permissions",
  requirePermission(permissionCodes.PERMISSIONS_VIEW),
  getUserScreenPermissions,
);

accessRouter.get("/me/screens", requirePermission(permissionCodes.DASHBOARD_VIEW), getMyScreens);
accessRouter.get("/me/permissions", requirePermission(permissionCodes.DASHBOARD_VIEW), getMyPermissions);

export default accessRouter;
