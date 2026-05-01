import { ApiError } from "./api-error";
import { z } from "zod";

type RequestBodyValidationConfig = {
  allowedFields: string[];
  requiredFields?: string[];
  atLeastOneFieldFrom?: string[];
};

export function parseRequiredInt(value: unknown, fieldName: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    throw new ApiError(400, `${fieldName} must be an integer.`);
  }

  return parsed;
}

export function parseOptionalInt(value: unknown, fieldName: string): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return parseRequiredInt(value, fieldName);
}

export function parseOptionalBoolean(value: unknown, fieldName: string): boolean | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true" || normalized === "1") {
      return true;
    }

    if (normalized === "false" || normalized === "0") {
      return false;
    }
  }

  throw new ApiError(400, `${fieldName} must be a boolean.`);
}

export function parseOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function parseRequiredString(value: unknown, fieldName: string): string {
  const parsed = parseOptionalString(value);

  if (!parsed) {
    throw new ApiError(400, `${fieldName} is required.`);
  }

  return parsed;
}

export function parseOptionalDate(value: unknown, fieldName: string): Date | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  throw new ApiError(400, `${fieldName} must be a valid datetime.`);
}

export function parseRequiredIntArray(value: unknown, fieldName: string): number[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ApiError(400, `${fieldName} must be a non-empty array of integers.`);
  }

  const parsed = value.map((item, index) => {
    const parsedItem = Number(item);

    if (!Number.isInteger(parsedItem)) {
      throw new ApiError(400, `${fieldName}[${index}] must be an integer.`);
    }

    return parsedItem;
  });

  return [...new Set(parsed)];
}

export function validateRequestBodyFields(
  value: unknown,
  config: RequestBodyValidationConfig,
): void {
  const schema = z
    .record(z.string(), z.unknown())
    .superRefine((body, ctx) => {
      const receivedFields = Object.keys(body);
      const unknownFields = receivedFields.filter((field) => !config.allowedFields.includes(field));

      if (unknownFields.length > 0) {
        const allowedText =
          config.allowedFields.length > 0 ? config.allowedFields.join(", ") : "none";

        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid request body fields: ${unknownFields.join(", ")}. Allowed fields: ${allowedText}.`,
        });
      }

      if (config.requiredFields && config.requiredFields.length > 0) {
        const missingFields = config.requiredFields.filter((field) => {
          const fieldValue = body[field];

          if (fieldValue === undefined || fieldValue === null) {
            return true;
          }

          if (typeof fieldValue === "string" && fieldValue.trim() === "") {
            return true;
          }

          return false;
        });

        if (missingFields.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Missing required fields: ${missingFields.join(", ")}.`,
          });
        }
      }

      if (config.atLeastOneFieldFrom && config.atLeastOneFieldFrom.length > 0) {
        const hasAtLeastOne = config.atLeastOneFieldFrom.some((field) => {
          const fieldValue = body[field];

          if (fieldValue === undefined || fieldValue === null) {
            return false;
          }

          if (typeof fieldValue === "string" && fieldValue.trim() === "") {
            return false;
          }

          return true;
        });

        if (!hasAtLeastOne) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `At least one field is required to update: ${config.atLeastOneFieldFrom.join(", ")}.`,
          });
        }
      }
    });

  const result = schema.safeParse(value);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const message =
      firstIssue?.code === z.ZodIssueCode.invalid_type
        ? "Request body must be a JSON object."
        : firstIssue?.message ?? "Invalid request body.";

    throw new ApiError(400, message);
  }
}

const geoPointSchema = z
  .object({
    latitude: z.preprocess((input) => {
      if (typeof input === "string" && input.trim() !== "") {
        return Number(input);
      }

      return input;
    }, z.number().finite().min(-90).max(90)),
    longitude: z.preprocess((input) => {
      if (typeof input === "string" && input.trim() !== "") {
        return Number(input);
      }

      return input;
    }, z.number().finite().min(-180).max(180)),
  })
  .strict();

export type GeoPoint = z.infer<typeof geoPointSchema>;

export function parseGeoPoint(value: unknown, fieldName: string = "location"): GeoPoint {
  const result = geoPointSchema.safeParse(value);

  if (!result.success) {
    throw new ApiError(
      400,
      `${fieldName} must include valid latitude (-90 to 90) and longitude (-180 to 180).`,
    );
  }

  return result.data;
}

export function parseOptionalGeoPoint(
  value: unknown,
  fieldName: string = "location",
): GeoPoint | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return parseGeoPoint(value, fieldName);
}
