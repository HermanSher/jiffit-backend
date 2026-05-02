import { Router } from "express";
import { permissionCodes } from "../../constants/permission-codes";
import { requirePermission } from "../../middlewares/permission.middleware";
import {
  getBookingHeroLocation,
  getDashboardHeroesLive,
  updateWorkerLocation,
} from "./location.controller";

const locationRouter = Router();

locationRouter.post("/worker/location", updateWorkerLocation);
locationRouter.get("/bookings/:id/hero-location", getBookingHeroLocation);
locationRouter.get(
  "/dashboard/heroes/live",
  requirePermission(permissionCodes.DASHBOARD_VIEW),
  getDashboardHeroesLive,
);

export default locationRouter;
