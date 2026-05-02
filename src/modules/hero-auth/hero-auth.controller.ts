import { Request, Response } from "express";
import { handleControllerError, sendSuccess } from "../../utils/error-handler";
import { parseOptionalString, parseRequiredString, validateRequestBodyFields } from "../../utils/request-parsers";
import { heroAuthService } from "./hero-auth.service";

export async function requestHeroOtp(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["mobileNumber"],
      requiredFields: ["mobileNumber"],
    });

    const result = heroAuthService.requestOtp(parseRequiredString(req.body.mobileNumber, "mobileNumber"));
    sendSuccess(res, 200, "Mock OTP generated successfully.", result);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function verifyHeroOtp(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["mobileNumber", "otp", "deviceInfo"],
      requiredFields: ["mobileNumber", "otp"],
    });

    const result = await heroAuthService.verifyOtp({
      mobileNumber: parseRequiredString(req.body.mobileNumber, "mobileNumber"),
      otp: parseRequiredString(req.body.otp, "otp"),
      deviceInfo: parseOptionalString(req.body.deviceInfo),
      ipAddress: req.ip,
    });

    sendSuccess(res, 200, "Hero logged in successfully.", result);
  } catch (error) {
    handleControllerError(res, error);
  }
}
