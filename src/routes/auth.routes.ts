import { Router } from "express";
import { login, logout, me, refresh } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

const authRouter = Router();

authRouter.post("/login", login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", authenticate, logout);
authRouter.get("/me", authenticate, me);

export default authRouter;
