import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { handleControllerError, sendSuccess } from "../utils/error-handler";
import {
  parseOptionalString,
  parseRequiredString,
  validateRequestBodyFields,
} from "../utils/request-parsers";
import { ApiError } from "../utils/api-error";

export async function login(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["username", "password", "deviceInfo"],
      requiredFields: ["username", "password"],
    });

    const username = parseRequiredString(req.body.username, "username");
    const password = parseRequiredString(req.body.password, "password");
    const deviceInfo = parseOptionalString(req.body.deviceInfo);
    const loginResult = await authService.login({
      username,
      password,
      deviceInfo,
      ipAddress: req.ip,
    });

    sendSuccess(res, 200, "Login successful.", loginResult);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["refreshToken"],
      requiredFields: ["refreshToken"],
    });

    const refreshToken = parseRequiredString(req.body.refreshToken, "refreshToken");
    const tokenPair = await authService.refresh({ refreshToken });

    sendSuccess(res, 200, "Token refreshed successfully.", tokenPair);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const sessionId = req.authUser?.sessionId;
    if (!sessionId) {
      throw new ApiError(401, "Authentication required.");
    }

    await authService.logout({ sessionId });
    sendSuccess(res, 200, "Logout successful.", null);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function me(req: Request, res: Response) {
  try {
    if (!req.authUser) {
      throw new ApiError(401, "Authentication required.");
    }

    const profile = await authService.me(req.authUser);
    sendSuccess(res, 200, "Current user fetched successfully.", profile);
  } catch (error) {
    handleControllerError(res, error);
  }
}
