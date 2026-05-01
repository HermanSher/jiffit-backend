import { Router } from "express";
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

const userTypeRouter = Router();

userTypeRouter.post("/", createUserType);
userTypeRouter.get("/", getUserTypes);
userTypeRouter.get("/by-sname/:sName", getUserTypeBySName);
userTypeRouter.delete("/bulk", deleteUserTypesByIds);
userTypeRouter.patch("/by-scode/:sCode", updateUserTypeBySCode);
userTypeRouter.delete("/by-scode/:sCode", deleteUserTypeBySCode);
userTypeRouter.get("/:iMasterId/users", getUsersByUserTypeId);
userTypeRouter.get("/sname/:sName/users", getUsersByUserTypeSName);
userTypeRouter.patch("/:iMasterId/restore", restoreUserTypeById);
userTypeRouter.patch("/:iMasterId", updateUserTypeById);
userTypeRouter.delete("/:iMasterId", deleteUserTypeById);
userTypeRouter.get("/:iMasterId", getUserTypeById);

export default userTypeRouter;
