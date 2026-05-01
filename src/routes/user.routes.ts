import { Router } from "express";
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

const userRouter = Router();

userRouter.post("/", createUser);
userRouter.get("/", getUsers);
userRouter.get("/by-username/:username", getUserByUsername);
userRouter.get("/by-role/:iMasterId", getUsersByRoleId);
userRouter.get("/by-role-sname/:sName", getUsersByRoleSName);
userRouter.get("/by-user-type/:iMasterId", getUsersByUserTypeId);
userRouter.get("/by-user-type-sname/:sName", getUsersByUserTypeSName);

userRouter.patch("/:id/leave", markUserLeftById);
userRouter.patch("/by-username/:username/leave", markUserLeftByUsername);
userRouter.patch("/:id/rejoin", rejoinUserById);
userRouter.patch("/by-username/:username/rejoin", rejoinUserByUsername);
userRouter.patch("/:iMasterId/restore", restoreUserById);

userRouter.delete("/bulk", deleteUsersByIds);
userRouter.delete("/by-username/:username", deleteUserByUsername);
userRouter.delete("/:id", deleteUserById);

userRouter.get("/:id", getUserById);

export default userRouter;
