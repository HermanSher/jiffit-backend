import { Router } from "express";
import { permissionCodes } from "../constants/permission-codes";
import {
  createRole,
  deleteRolesByIds,
  deleteRoleById,
  deleteRoleBySCode,
  getRoleById,
  getRoleBySName,
  getRoles,
  getUsersByRoleId,
  getUsersByRoleSName,
  restoreRoleById,
  updateRoleById,
  updateRoleBySCode,
} from "../controllers/role.controller";
import { requirePermission } from "../middlewares/permission.middleware";

const roleRouter = Router();

roleRouter.post("/", requirePermission(permissionCodes.ROLES_CREATE), createRole);
roleRouter.get("/", requirePermission(permissionCodes.ROLES_VIEW), getRoles);
roleRouter.get("/by-sname/:sName", requirePermission(permissionCodes.ROLES_VIEW), getRoleBySName);
roleRouter.delete("/bulk", requirePermission(permissionCodes.ROLES_DELETE), deleteRolesByIds);
roleRouter.patch("/by-scode/:sCode", requirePermission(permissionCodes.ROLES_UPDATE), updateRoleBySCode);
roleRouter.delete("/by-scode/:sCode", requirePermission(permissionCodes.ROLES_DELETE), deleteRoleBySCode);
roleRouter.get("/:iMasterId/users", requirePermission(permissionCodes.ROLES_VIEW), getUsersByRoleId);
roleRouter.get("/sname/:sName/users", requirePermission(permissionCodes.ROLES_VIEW), getUsersByRoleSName);
roleRouter.patch("/:iMasterId/restore", requirePermission(permissionCodes.ROLES_UPDATE), restoreRoleById);
roleRouter.patch("/:iMasterId", requirePermission(permissionCodes.ROLES_UPDATE), updateRoleById);
roleRouter.delete("/:iMasterId", requirePermission(permissionCodes.ROLES_DELETE), deleteRoleById);
roleRouter.get("/:iMasterId", requirePermission(permissionCodes.ROLES_VIEW), getRoleById);

export default roleRouter;
