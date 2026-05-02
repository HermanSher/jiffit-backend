import { Router } from "express";
import {
  getHeroOnboardingApplication,
  getHeroOnboardingStatus,
  getNearestHub,
  resubmitHeroOnboarding,
  submitHeroOnboarding,
} from "./hero-onboarding.controller";

export const heroOnboardingRouter = Router();
export const heroRouter = Router();

heroOnboardingRouter.get("/status", getHeroOnboardingStatus);
heroOnboardingRouter.get("/application", getHeroOnboardingApplication);
heroOnboardingRouter.post("/submit", submitHeroOnboarding);
heroOnboardingRouter.patch("/resubmit", resubmitHeroOnboarding);

heroRouter.get("/nearest-hub", getNearestHub);
