import { Router } from "express";
import { requestHeroOtp, verifyHeroOtp } from "./hero-auth.controller";

const heroAuthRouter = Router();

heroAuthRouter.post("/request-otp", requestHeroOtp);
heroAuthRouter.post("/verify-otp", verifyHeroOtp);

export default heroAuthRouter;
