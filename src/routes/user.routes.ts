import { Router } from "express";
import { permissionCodes } from "../constants/permission-codes";
import {
  createUser,
  deleteUsersByIds,
  deleteUserById,
  deleteUserByUsername,
  getUserById,
  getUserByUsername,
  getUsers,
  getUsersByRoleId,
  getUsersByRoleSName,
  getUsersByUserTypeId,
  getUsersByUserTypeSName,
  markUserLeftById,
  markUserLeftByUsername,
  rejoinUserById,
  rejoinUserByUsername,
  restoreUserById,
} from "../controllers/user.controller";
import { requirePermission } from "../middlewares/permission.middleware";

const userRouter = Router();

userRouter.post("/", requirePermission(permissionCodes.USERS_CREATE), createUser);
userRouter.get("/", requirePermission(permissionCodes.USERS_VIEW), getUsers);
userRouter.get("/by-username/:username", requirePermission(permissionCodes.USERS_VIEW), getUserByUsername);
userRouter.get("/by-role/:iMasterId", requirePermission(permissionCodes.USERS_VIEW), getUsersByRoleId);
userRouter.get("/by-role-sname/:sName", requirePermission(permissionCodes.USERS_VIEW), getUsersByRoleSName);
userRouter.get("/by-user-type/:iMasterId", requirePermission(permissionCodes.USERS_VIEW), getUsersByUserTypeId);
userRouter.get("/by-user-type-sname/:sName", requirePermission(permissionCodes.USERS_VIEW), getUsersByUserTypeSName);

userRouter.patch("/:id/leave", requirePermission(permissionCodes.USERS_UPDATE), markUserLeftById);
userRouter.patch("/by-username/:username/leave", requirePermission(permissionCodes.USERS_UPDATE), markUserLeftByUsername);
userRouter.patch("/:id/rejoin", requirePermission(permissionCodes.USERS_UPDATE), rejoinUserById);
userRouter.patch("/by-username/:username/rejoin", requirePermission(permissionCodes.USERS_UPDATE), rejoinUserByUsername);
userRouter.patch("/:iMasterId/restore", requirePermission(permissionCodes.USERS_UPDATE), restoreUserById);

userRouter.delete("/bulk", requirePermission(permissionCodes.USERS_DELETE), deleteUsersByIds);
userRouter.delete("/by-username/:username", requirePermission(permissionCodes.USERS_DELETE), deleteUserByUsername);
userRouter.delete("/:id", requirePermission(permissionCodes.USERS_DELETE), deleteUserById);

userRouter.get("/:id", requirePermission(permissionCodes.USERS_VIEW), getUserById);

export default userRouter;
