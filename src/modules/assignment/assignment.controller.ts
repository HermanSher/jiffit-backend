import { Request, Response } from "express";
import { ApiError } from "../../utils/api-error";
import { handleControllerError, sendSuccess } from "../../utils/error-handler";
import { parseRequiredInt } from "../../utils/request-parsers";
import { idempotencyService } from "../../services/idempotency.service";
import { assignmentService } from "./assignment.service";

export async function dispatchAssignment(req: Request, res: Response) {
  try {
    const bookingId = parseRequiredInt(req.params.bookingId, "bookingId");
    const result = await idempotencyService.run({
      key: req.headers["x-idempotency-key"]?.toString(),
      scope: "assignment.dispatch",
      requestBody: {
        bookingId,
      },
      createdByUserMasterId: req.authUser?.iMasterId,
      executor: async () =>
        assignmentService.dispatchAssignment(bookingId, req.authUser, "manual-dispatch"),
    });

    sendSuccess(res, 200, "Assignment dispatch processed.", result);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function retryAssignment(req: Request, res: Response) {
  try {
    const bookingId = parseRequiredInt(req.params.bookingId, "bookingId");
    const result = await idempotencyService.run({
      key: req.headers["x-idempotency-key"]?.toString(),
      scope: "assignment.retry",
      requestBody: {
        bookingId,
      },
      createdByUserMasterId: req.authUser?.iMasterId,
      executor: async () => assignmentService.retryAssignment(bookingId, "manual-retry"),
    });

    sendSuccess(res, 200, "Assignment retry processed.", result);
  } catch (error) {
    handleControllerError(res, error);
  }
}
