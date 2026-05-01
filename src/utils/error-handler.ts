import { Prisma } from "@prisma/client";
import { Response } from "express";
import { ApiError } from "./api-error";

export function sendSuccess(
  res: Response,
  statusCode: number,
  message: string,
  data: unknown = null,
): void {
  res.status(statusCode).json({
    result: 1,
    message,
    data,
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  data: unknown = null,
): void {
  res.status(statusCode).json({
    result: -1,
    message,
    data,
  });
}

export function handleControllerError(res: Response, error: unknown): void {
  if (error instanceof ApiError) {
    sendError(res, error.statusCode, error.message);
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      sendError(res, 409, "Duplicate value. Record already exists.");
      return;
    }

    if (error.code === "P2003") {
      sendError(res, 400, "Invalid relation reference.");
      return;
    }

    if (error.code === "P2025") {
      sendError(res, 404, "Record not found.");
      return;
    }

    if (error.code === "P2021" || error.code === "P2022") {
      sendError(
        res,
        500,
        "Database schema is not in sync. Run prisma migrations and restart the server.",
      );
      return;
    }
  }

  sendError(res, 500, "Internal server error.");
}
