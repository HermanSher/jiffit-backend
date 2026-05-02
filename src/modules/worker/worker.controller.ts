import { WorkerState } from "@prisma/client";
import { Request, Response } from "express";
import { ApiError } from "../../utils/api-error";
import { handleControllerError, sendSuccess } from "../../utils/error-handler";
import { parseRequiredString, validateRequestBodyFields } from "../../utils/request-parsers";
import { workerService } from "./worker.service";

function parseWorkerState(value: unknown): WorkerState {
  const state = parseRequiredString(value, "state").trim().toUpperCase();
  if (!Object.values(WorkerState).includes(state as WorkerState)) {
    throw new ApiError(400, "state is invalid.");
  }

  return state as WorkerState;
}

function requireAuthUser(req: Request) {
  if (!req.authUser) {
    throw new ApiError(401, "Authentication required.");
  }

  return req.authUser;
}

export async function goOnline(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, { allowedFields: [] });
    const updated = await workerService.goOnline(requireAuthUser(req));
    sendSuccess(res, 200, "Worker moved online successfully.", updated);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function goOffline(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, { allowedFields: [] });
    const updated = await workerService.goOffline(requireAuthUser(req));
    sendSuccess(res, 200, "Worker moved offline successfully.", updated);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function updateWorkerState(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["state"],
      requiredFields: ["state"],
    });

    const updated = await workerService.updateState(requireAuthUser(req), parseWorkerState(req.body.state));
    sendSuccess(res, 200, "Worker state updated successfully.", updated);
  } catch (error) {
    handleControllerError(res, error);
  }
}
