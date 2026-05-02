import { Request, Response } from "express";
import { locationService } from "./location.service";
import { ApiError } from "../../utils/api-error";
import { handleControllerError, sendSuccess } from "../../utils/error-handler";
import {
  parseOptionalBoolean,
  parseOptionalInt,
  parseOptionalString,
  parseRequiredInt,
  validateRequestBodyFields,
} from "../../utils/request-parsers";

function parseRequiredFloat(value: unknown, fieldName: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ApiError(400, `${fieldName} must be a number.`);
  }

  return parsed;
}

function parseOptionalFloat(value: unknown, fieldName: string): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return parseRequiredFloat(value, fieldName);
}

function parseLatitude(value: unknown): number {
  const latitude = parseRequiredFloat(value, "latitude");
  if (latitude < -90 || latitude > 90) {
    throw new ApiError(400, "latitude must be between -90 and 90.");
  }

  return latitude;
}

function parseLongitude(value: unknown): number {
  const longitude = parseRequiredFloat(value, "longitude");
  if (longitude < -180 || longitude > 180) {
    throw new ApiError(400, "longitude must be between -180 and 180.");
  }

  return longitude;
}

function requireAuthUser(req: Request) {
  if (!req.authUser) {
    throw new ApiError(401, "Authentication required.");
  }

  return req.authUser;
}

export async function updateWorkerLocation(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["latitude", "longitude", "accuracy", "heading", "speed", "batteryLevel"],
      requiredFields: ["latitude", "longitude"],
    });

    const data = await locationService.updateWorkerLocation(requireAuthUser(req), {
      latitude: parseLatitude(req.body.latitude),
      longitude: parseLongitude(req.body.longitude),
      accuracy: parseOptionalFloat(req.body.accuracy, "accuracy"),
      heading: parseOptionalFloat(req.body.heading, "heading"),
      speed: parseOptionalFloat(req.body.speed, "speed"),
      batteryLevel: parseOptionalFloat(req.body.batteryLevel, "batteryLevel"),
    });

    sendSuccess(res, 200, "Hero live location updated successfully.", data);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getBookingHeroLocation(req: Request, res: Response) {
  try {
    const bookingId = parseRequiredInt(req.params.id, "id");
    const data = await locationService.getBookingHeroLocation(requireAuthUser(req), bookingId);
    sendSuccess(res, 200, "Hero live location fetched successfully.", data);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getDashboardHeroesLive(req: Request, res: Response) {
  try {
    const parsedLimit = parseOptionalInt(req.query.limit, "limit");
    const limit = parsedLimit ? Math.min(Math.max(parsedLimit, 1), 500) : 200;

    const data = await locationService.getDashboardHeroesLive(requireAuthUser(req), {
      city: parseOptionalString(req.query.city),
      serviceText: parseOptionalString(req.query.service),
      serviceId: parseOptionalInt(req.query.serviceId, "serviceId"),
      active: parseOptionalBoolean(req.query.active, "active"),
      limit,
    });

    sendSuccess(res, 200, "Live hero locations fetched successfully.", data);
  } catch (error) {
    handleControllerError(res, error);
  }
}
