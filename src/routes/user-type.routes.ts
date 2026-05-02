import { Router } from "express";
import { permissionCodes } from "../constants/permission-codes";
import {
  createUserType,
  deleteUserTypeById,
  deleteUserTypeBySCode,
  deleteUserTypesByIds,
  getUserTypeById,
  getUserTypeBySName,
  getUserTypes,
  getUsersByUserTypeId,
  getUsersByUserTypeSName,
  restoreUserTypeById,
  updateUserTypeById,
  updateUserTypeBySCode,
} from "../controllers/user-type.controller";
import { requirePermission } from "../middlewares/permission.middleware";

const userTypeRouter = Router();

userTypeRouter.post("/", requirePermission(permissionCodes.USER_TYPES_CREATE), createUserType);
userTypeRouter.get("/", requirePermission(permissionCodes.USER_TYPES_VIEW), getUserTypes);
userTypeRouter.get("/by-sname/:sName", requirePermission(permissionCodes.USER_TYPES_VIEW), getUserTypeBySName);
userTypeRouter.delete("/bulk", requirePermission(permissionCodes.USER_TYPES_DELETE), deleteUserTypesByIds);
userTypeRouter.patch("/by-scode/:sCode", requirePermission(permissionCodes.USER_TYPES_UPDATE), updateUserTypeBySCode);
userTypeRouter.delete("/by-scode/:sCode", requirePermission(permissionCodes.USER_TYPES_DELETE), deleteUserTypeBySCode);
userTypeRouter.get("/:iMasterId/users", requirePermission(permissionCodes.USER_TYPES_VIEW), getUsersByUserTypeId);
userTypeRouter.get("/sname/:sName/users", requirePermission(permissionCodes.USER_TYPES_VIEW), getUsersByUserTypeSName);
userTypeRouter.patch("/:iMasterId/restore", requirePermission(permissionCodes.USER_TYPES_UPDATE), restoreUserTypeById);
userTypeRouter.patch("/:iMasterId", requirePermission(permissionCodes.USER_TYPES_UPDATE), updateUserTypeById);
userTypeRouter.delete("/:iMasterId", requirePermission(permissionCodes.USER_TYPES_DELETE), deleteUserTypeById);
userTypeRouter.get("/:iMasterId", requirePermission(permissionCodes.USER_TYPES_VIEW), getUserTypeById);

export default userTypeRouter;
