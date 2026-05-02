import { Request, Response } from "express";
import { handleControllerError, sendSuccess } from "../../utils/error-handler";
import { parseOptionalString, parseRequiredString, validateRequestBodyFields } from "../../utils/request-parsers";
import { parseIndianMobileNumber } from "../../utils/mobile";
import { heroAuthService } from "./hero-auth.service";

export async function requestHeroOtp(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["mobileNumber"],
      requiredFields: ["mobileNumber"],
    });

    const mobileNumber = parseIndianMobileNumber(parseRequiredString(req.body.mobileNumber, "mobileNumber"));
    const result = heroAuthService.requestOtp(mobileNumber);
    sendSuccess(res, 200, "OTP sent successfully.", result);
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
      mobileNumber: parseIndianMobileNumber(parseRequiredString(req.body.mobileNumber, "mobileNumber")),
      otp: parseRequiredString(req.body.otp, "otp"),
      deviceInfo: parseOptionalString(req.body.deviceInfo),
      ipAddress: req.ip,
    });

    sendSuccess(res, 200, "Hero logged in successfully.", result);
  } catch (error) {
    handleControllerError(res, error);
  }
}
