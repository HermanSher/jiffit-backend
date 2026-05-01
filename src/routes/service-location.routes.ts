import { Router } from "express";
import { serviceLocations } from "../constants/service-locations";
import { ApiError } from "../utils/api-error";
import { handleControllerError, sendSuccess } from "../utils/error-handler";

const serviceLocationRouter = Router();

serviceLocationRouter.get("/", (req, res) => {
  sendSuccess(res, 200, "Service locations fetched successfully.", serviceLocations);
});

serviceLocationRouter.get("/:sCode", (req, res) => {
  try {
    const location = serviceLocations.find(
      (item) => item.sCode === req.params.sCode.trim().toUpperCase(),
    );

    if (!location) {
      throw new ApiError(404, "Service location not found.");
    }

    sendSuccess(res, 200, "Service location fetched successfully.", location);
  } catch (error) {
    handleControllerError(res, error);
  }
});

export default serviceLocationRouter;
