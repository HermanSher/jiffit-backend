import { Prisma } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { handleControllerError, sendSuccess } from "../utils/error-handler";

type FieldType = "string" | "int" | "decimal" | "boolean" | "date" | "time" | "json" | "enum";

export type CrudRouteConfig = {
  tag: string;
  model: string;
  idField: "iMasterId" | "iTransId";
  createFields: Record<string, FieldType>;
  updateFields?: Record<string, FieldType>;
  searchableFields?: string[];
  defaultOrderBy?: Record<string, "asc" | "desc">;
};

function getDelegate(model: string) {
  const delegate = (prisma as unknown as Record<string, unknown>)[model];

  if (!delegate) {
    throw new Error(`Prisma delegate not found: ${model}`);
  }

  return delegate as {
    create(args: unknown): Promise<unknown>;
    findMany(args: unknown): Promise<unknown[]>;
    findFirst(args: unknown): Promise<unknown | null>;
    update(args: unknown): Promise<unknown>;
  };
}

function parseValue(value: unknown, field: string, type: FieldType) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (type === "int") {
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
      throw new ApiError(400, `${field} must be an integer.`);
    }
    return parsed;
  }

  if (type === "decimal") {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new ApiError(400, `${field} must be a number.`);
    }
    return new Prisma.Decimal(parsed);
  }

  if (type === "boolean") {
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

    throw new ApiError(400, `${field} must be a boolean.`);
  }

  if (type === "date") {
    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime())) {
      throw new ApiError(400, `${field} must be a valid datetime.`);
    }
    return parsed;
  }

  if (type === "time") {
    const text = String(value).trim();
    const normalized = text.length === 5 ? `${text}:00` : text;
    const parsed = new Date(`1970-01-01T${normalized}.000Z`);

    if (Number.isNaN(parsed.getTime())) {
      throw new ApiError(400, `${field} must be a valid time like 09:00 or 09:00:00.`);
    }

    return parsed;
  }

  if (type === "json") {
    return value;
  }

  return String(value).trim();
}

function pickData(source: Record<string, unknown>, fields: Record<string, FieldType>) {
  const data: Record<string, unknown> = {};

  for (const [field, type] of Object.entries(fields)) {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      data[field] = parseValue(source[field], field, type);
    }
  }

  return data;
}

function buildWhere(query: Record<string, unknown>, fields: Record<string, FieldType>, searchableFields: string[]) {
  const where: Record<string, unknown> = {};

  for (const [field, type] of Object.entries(fields)) {
    if (!Object.prototype.hasOwnProperty.call(query, field)) {
      continue;
    }

    const value = parseValue(query[field], field, type);

    if (value === undefined) {
      continue;
    }

    where[field] =
      type === "string" && searchableFields.includes(field)
        ? { contains: value }
        : value;
  }

  return where;
}

function shouldIncludeDeleted(query: Record<string, unknown>) {
  return query.includeDeleted === true || query.includeDeleted === "true" || query.includeDeleted === "1";
}

export function createCrudRouter(config: CrudRouteConfig) {
  const router = Router();
  const delegate = getDelegate(config.model);
  const updateFields = config.updateFields ?? config.createFields;
  const searchableFields = config.searchableFields ?? ["sCode", "sName", "description"];
  const orderBy = config.defaultOrderBy ?? { [config.idField]: "asc" };

  router.post("/", async (req, res) => {
    try {
      const data = pickData(req.body, config.createFields);
      const created = await delegate.create({ data });
      sendSuccess(res, 201, `${config.tag} created successfully.`, created);
    } catch (error) {
      handleControllerError(res, error);
    }
  });

  router.get("/", async (req, res) => {
    try {
      const where = buildWhere(req.query, { ...config.createFields, ...updateFields }, searchableFields);
      if (!shouldIncludeDeleted(req.query)) {
        where.isDeleted = false;
      }
      const records = await delegate.findMany({ where, orderBy });
      sendSuccess(
        res,
        200,
        records.length === 0 ? `No ${config.tag.toLowerCase()} records found.` : `${config.tag} records fetched successfully.`,
        records,
      );
    } catch (error) {
      handleControllerError(res, error);
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        throw new ApiError(400, "id must be an integer.");
      }

      const record = await delegate.findFirst({
        where: {
          [config.idField]: id,
          isDeleted: shouldIncludeDeleted(req.query) ? undefined : false,
        },
      });
      if (!record) {
        throw new ApiError(404, `${config.tag} record not found.`);
      }

      sendSuccess(res, 200, `${config.tag} record fetched successfully.`, record);
    } catch (error) {
      handleControllerError(res, error);
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        throw new ApiError(400, "id must be an integer.");
      }

      const data = pickData(req.body, updateFields);
      const updated = await delegate.update({ where: { [config.idField]: id }, data });
      sendSuccess(res, 200, `${config.tag} record updated successfully.`, updated);
    } catch (error) {
      handleControllerError(res, error);
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        throw new ApiError(400, "id must be an integer.");
      }

      const deleted = await delegate.update({
        where: { [config.idField]: id },
        data: {
          isDeleted: true,
          isActive: false,
          deletedAt: new Date(),
          deletedByUserMasterId: null,
        },
      });
      sendSuccess(res, 200, `${config.tag} record deleted successfully.`, deleted);
    } catch (error) {
      handleControllerError(res, error);
    }
  });

  return router;
}
