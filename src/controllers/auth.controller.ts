import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { handleControllerError, sendSuccess } from "../utils/error-handler";
import {
  parseRequiredString,
  validateRequestBodyFields,
} from "../utils/request-parsers";

export async function login(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["username", "password"],
      requiredFields: ["username", "password"],
    });

    const username = parseRequiredString(req.body.username, "username");
    const password = parseRequiredString(req.body.password, "password");
    const loginResult = await authService.login(username, password);

    sendSuccess(res, 200, "Login successful.", loginResult);
  } catch (error) {
    handleControllerError(res, error);
  }
}
