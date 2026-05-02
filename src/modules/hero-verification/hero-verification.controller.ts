import { HeroVerificationStatus } from "@prisma/client";
import { Request, Response } from "express";
import { ApiError } from "../../utils/api-error";
import { handleControllerError, sendSuccess } from "../../utils/error-handler";
import {
  parseOptionalString,
  parseRequiredInt,
  parseRequiredString,
  validateRequestBodyFields,
} from "../../utils/request-parsers";
import { heroVerificationService } from "./hero-verification.service";

function parseStatus(value: unknown): HeroVerificationStatus | undefined {
  const normalized = parseOptionalString(value)?.toUpperCase();
  if (!normalized) {
    return undefined;
  }

  if (!Object.values(HeroVerificationStatus).includes(normalized as HeroVerificationStatus)) {
    throw new ApiError(400, "status is invalid.");
  }

  return normalized as HeroVerificationStatus;
}

function parseLimit(value: unknown): number {
  if (value === undefined || value === null || value === "") {
    return 100;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 500) {
    throw new ApiError(400, "limit must be an integer between 1 and 500.");
  }

  return parsed;
}

function requireAuthUserId(req: Request): number {
  if (!req.authUser) {
    throw new ApiError(401, "Authentication required.");
  }

  return req.authUser.iMasterId;
}

export async function listHeroVerifications(req: Request, res: Response) {
  try {
    const data = await heroVerificationService.list({
      status: parseStatus(req.query.status),
      city: parseOptionalString(req.query.city),
      search: parseOptionalString(req.query.search),
      limit: parseLimit(req.query.limit),
    });

    sendSuccess(res, 200, "Hero verifications fetched successfully.", data);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getHeroVerification(req: Request, res: Response) {
  try {
    const id = parseRequiredInt(req.params.id, "id");
    const data = await heroVerificationService.getById(id);
    sendSuccess(res, 200, "Hero verification fetched successfully.", data);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function verifyHeroApplication(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["adminRemarks"],
    });

    const data = await heroVerificationService.verify(
      parseRequiredInt(req.params.id, "id"),
      requireAuthUserId(req),
      parseOptionalString(req.body.adminRemarks),
    );

    sendSuccess(res, 200, "Hero verified successfully.", data);
  } catch (error) {
    handleControllerError(res, error);
  }
}

function parseDashboardUpdateStatus(value: unknown): HeroVerificationStatus | undefined {
  const status = parseStatus(value);
  if (!status) {
    return undefined;
  }

  if (status !== HeroVerificationStatus.PENDING_HUB_VERIFICATION && status !== HeroVerificationStatus.VERIFIED) {
    throw new ApiError(400, "verificationStatus can only be PENDING_HUB_VERIFICATION or VERIFIED.");
  }

  return status;
}

export async function updateHeroVerification(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: [
        "fullName",
        "selectedCity",
        "selectedJobRole",
        "addressLine1",
        "addressLine2",
        "city",
        "state",
        "pincode",
        "workType",
        "vehicleType",
        "earningsType",
        "adminRemarks",
        "verificationStatus",
      ],
    });

    const data = await heroVerificationService.update(parseRequiredInt(req.params.id, "id"), {
      fullName: parseOptionalString(req.body.fullName),
      selectedCity: parseOptionalString(req.body.selectedCity),
      selectedJobRole: parseOptionalString(req.body.selectedJobRole),
      addressLine1: parseOptionalString(req.body.addressLine1),
      addressLine2: parseOptionalString(req.body.addressLine2),
      city: parseOptionalString(req.body.city),
      state: parseOptionalString(req.body.state),
      pincode: parseOptionalString(req.body.pincode),
      workType: parseOptionalString(req.body.workType),
      vehicleType: parseOptionalString(req.body.vehicleType),
      earningsType: parseOptionalString(req.body.earningsType),
      adminRemarks: parseOptionalString(req.body.adminRemarks),
      verificationStatus: parseDashboardUpdateStatus(req.body.verificationStatus),
      verifiedByUserMasterId: requireAuthUserId(req),
    });

    sendSuccess(res, 200, "Hero verification updated successfully.", data);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function rejectHeroApplication(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["rejectionReason", "adminRemarks"],
      requiredFields: ["rejectionReason"],
    });

    const data = await heroVerificationService.reject(
      parseRequiredInt(req.params.id, "id"),
      parseRequiredString(req.body.rejectionReason, "rejectionReason"),
      parseOptionalString(req.body.adminRemarks),
    );

    sendSuccess(res, 200, "Hero verification rejected successfully.", data);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function requireHeroResubmission(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["adminRemarks"],
      requiredFields: ["adminRemarks"],
    });

    const data = await heroVerificationService.requireResubmission(
      parseRequiredInt(req.params.id, "id"),
      parseRequiredString(req.body.adminRemarks, "adminRemarks"),
    );

    sendSuccess(res, 200, "Hero resubmission requested successfully.", data);
  } catch (error) {
    handleControllerError(res, error);
  }
}
