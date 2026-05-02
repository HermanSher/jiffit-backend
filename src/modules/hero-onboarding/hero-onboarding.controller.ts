import { Request, Response } from "express";
import { ApiError } from "../../utils/api-error";
import { handleControllerError, sendSuccess } from "../../utils/error-handler";
import {
  parseOptionalDate,
  parseOptionalString,
  parseRequiredString,
  validateRequestBodyFields,
} from "../../utils/request-parsers";
import { heroOnboardingService, HeroOnboardingInput } from "./hero-onboarding.service";

const ONBOARDING_FIELDS = [
  "fullName",
  "mobileNumber",
  "email",
  "dateOfBirth",
  "gender",
  "fatherName",
  "alternateMobileNumber",
  "addressLine1",
  "addressLine2",
  "city",
  "state",
  "pincode",
  "latitude",
  "longitude",
  "selectedJobRole",
  "selectedCity",
  "workType",
  "vehicleType",
  "earningsType",
  "onboardingSource",
  "referralCode",
];

const DRAFT_FIELDS = ["fullName", "mobileNumber", "selectedCity", "selectedJobRole"];

function requireAuthUser(req: Request) {
  if (!req.authUser) {
    throw new ApiError(401, "Authentication required.");
  }

  return req.authUser;
}

function parseOptionalNumber(value: unknown, fieldName: string): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ApiError(400, `${fieldName} must be a valid number.`);
  }

  return parsed;
}

function parsePayload(body: Record<string, unknown>): HeroOnboardingInput {
  const latitude = parseOptionalNumber(body.latitude, "latitude");
  const longitude = parseOptionalNumber(body.longitude, "longitude");

  if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
    throw new ApiError(400, "latitude must be between -90 and 90.");
  }

  if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
    throw new ApiError(400, "longitude must be between -180 and 180.");
  }

  return {
    fullName: parseRequiredString(body.fullName, "fullName"),
    mobileNumber: parseRequiredString(body.mobileNumber, "mobileNumber"),
    email: parseOptionalString(body.email),
    dateOfBirth: parseOptionalDate(body.dateOfBirth, "dateOfBirth"),
    gender: parseOptionalString(body.gender),
    fatherName: parseOptionalString(body.fatherName),
    alternateMobileNumber: parseOptionalString(body.alternateMobileNumber),
    addressLine1: parseRequiredString(body.addressLine1, "addressLine1"),
    addressLine2: parseOptionalString(body.addressLine2),
    city: parseRequiredString(body.city, "city"),
    state: parseOptionalString(body.state),
    pincode: parseOptionalString(body.pincode),
    latitude,
    longitude,
    selectedJobRole: parseOptionalString(body.selectedJobRole),
    selectedCity: parseOptionalString(body.selectedCity),
    workType: parseOptionalString(body.workType),
    vehicleType: parseOptionalString(body.vehicleType),
    earningsType: parseOptionalString(body.earningsType),
    onboardingSource: parseOptionalString(body.onboardingSource),
    referralCode: parseOptionalString(body.referralCode),
  };
}

export async function getHeroOnboardingStatus(req: Request, res: Response) {
  try {
    const status = await heroOnboardingService.getStatus(requireAuthUser(req));
    sendSuccess(res, 200, "Hero onboarding status fetched successfully.", status);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getHeroOnboardingApplication(req: Request, res: Response) {
  try {
    const application = await heroOnboardingService.getApplication(requireAuthUser(req));
    sendSuccess(res, 200, "Hero onboarding application fetched successfully.", application);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function submitHeroOnboarding(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ONBOARDING_FIELDS,
      requiredFields: ["fullName", "mobileNumber", "addressLine1", "city"],
    });

    const result = await heroOnboardingService.submit(requireAuthUser(req), parsePayload(req.body));
    sendSuccess(res, 201, result.message, result);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function saveHeroOnboardingDraft(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: DRAFT_FIELDS,
      requiredFields: ["fullName", "mobileNumber"],
    });

    const result = await heroOnboardingService.saveDraft(requireAuthUser(req), {
      fullName: parseRequiredString(req.body.fullName, "fullName"),
      mobileNumber: parseRequiredString(req.body.mobileNumber, "mobileNumber"),
      selectedCity: parseOptionalString(req.body.selectedCity),
      selectedJobRole: parseOptionalString(req.body.selectedJobRole),
    });

    sendSuccess(res, 200, result.message, result);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function resubmitHeroOnboarding(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ONBOARDING_FIELDS,
      requiredFields: ["fullName", "mobileNumber", "addressLine1", "city"],
    });

    const result = await heroOnboardingService.resubmit(requireAuthUser(req), parsePayload(req.body));
    sendSuccess(res, 200, result.message, result);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getNearestHub(req: Request, res: Response) {
  try {
    const hub = await heroOnboardingService.findNearestHub({
      latitude: parseOptionalNumber(req.query.latitude, "latitude"),
      longitude: parseOptionalNumber(req.query.longitude, "longitude"),
      city: parseOptionalString(req.query.city),
    });

    sendSuccess(res, 200, "Nearest hub fetched successfully.", hub);
  } catch (error) {
    handleControllerError(res, error);
  }
}
