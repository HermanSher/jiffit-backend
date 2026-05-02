import crypto from "node:crypto";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";

function hashPayload(payload: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(payload ?? null)).digest("hex");
}

class IdempotencyService {
  private expiryHours = Number(process.env.IDEMPOTENCY_EXPIRY_HOURS ?? 24);

  async run<T>(input: {
    key?: string;
    scope: string;
    requestBody: unknown;
    createdByUserMasterId?: number;
    executor: () => Promise<T>;
  }): Promise<T> {
    if (!input.key) {
      return input.executor();
    }

    const requestHash = hashPayload(input.requestBody);
    const existing = await prisma.tIdempotencyKeys.findFirst({
      where: {
        key: input.key,
        scope: input.scope,
        expiresAt: { gt: new Date() },
      },
    });

    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new ApiError(409, "Idempotency key reuse with different payload is not allowed.");
      }

      return (existing.responseJson ?? null) as T;
    }

    const result = await input.executor();
    const expiresAt = new Date(Date.now() + this.expiryHours * 60 * 60 * 1000);

    await prisma.tIdempotencyKeys.create({
      data: {
        key: input.key,
        scope: input.scope,
        requestHash,
        responseJson: result as object,
        createdByUserMasterId: input.createdByUserMasterId,
        expiresAt,
      },
    });

    return result;
  }
}

export const idempotencyService = new IdempotencyService();
