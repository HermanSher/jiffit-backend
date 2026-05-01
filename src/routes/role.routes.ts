import { Router } from "express";
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

const roleRouter = Router();

roleRouter.post("/", createRole);
roleRouter.get("/", getRoles);
roleRouter.get("/by-sname/:sName", getRoleBySName);
roleRouter.delete("/bulk", deleteRolesByIds);
roleRouter.patch("/by-scode/:sCode", updateRoleBySCode);
roleRouter.delete("/by-scode/:sCode", deleteRoleBySCode);
roleRouter.get("/:iMasterId/users", getUsersByRoleId);
roleRouter.get("/sname/:sName/users", getUsersByRoleSName);
roleRouter.patch("/:iMasterId/restore", restoreRoleById);
roleRouter.patch("/:iMasterId", updateRoleById);
roleRouter.delete("/:iMasterId", deleteRoleById);
roleRouter.get("/:iMasterId", getRoleById);

export default roleRouter;
