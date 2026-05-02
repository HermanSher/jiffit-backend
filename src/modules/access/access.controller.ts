import { Request, Response } from "express";
import { handleControllerError, sendSuccess } from "../../utils/error-handler";
import {
  parseOptionalBoolean,
  parseOptionalInt,
  parseOptionalString,
  parseRequiredInt,
  parseRequiredString,
  validateRequestBodyFields,
} from "../../utils/request-parsers";
import { ApiError } from "../../utils/api-error";
import { accessService } from "./access.service";

function parsePermissionAssignments(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ApiError(400, "assignments must be a non-empty array.");
  }

  return value.map((entry, index) => {
    if (typeof entry !== "object" || entry === null) {
      throw new ApiError(400, `assignments[${index}] must be an object.`);
    }

    const item = entry as Record<string, unknown>;
    return {
      screenId: parseRequiredInt(item.screenId, `assignments[${index}].screenId`),
      permissionId: parseRequiredInt(item.permissionId, `assignments[${index}].permissionId`),
      isAllowed: parseOptionalBoolean(item.isAllowed, `assignments[${index}].isAllowed`) ?? true,
    };
  });
}

export async function createScreen(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["sCode", "sName", "description", "routePath", "parentScreenId", "displayOrder", "isActive"],
      requiredFields: ["sCode", "sName"],
    });

    const created = await accessService.createScreen({
      sCode: parseRequiredString(req.body.sCode, "sCode"),
      sName: parseRequiredString(req.body.sName, "sName"),
      description: parseOptionalString(req.body.description),
      routePath: parseOptionalString(req.body.routePath),
      parentScreenId: parseOptionalInt(req.body.parentScreenId, "parentScreenId"),
      displayOrder: parseOptionalInt(req.body.displayOrder, "displayOrder"),
      isActive: parseOptionalBoolean(req.body.isActive, "isActive"),
    });

    sendSuccess(res, 201, "Screen created successfully.", created);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getScreens(req: Request, res: Response) {
  try {
    const includeDeleted = parseOptionalBoolean(req.query.includeDeleted, "includeDeleted") ?? false;
    const data = await accessService.listScreens(includeDeleted);
    sendSuccess(res, 200, "Screens fetched successfully.", data);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function updateScreen(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["sCode", "sName", "description", "routePath", "parentScreenId", "displayOrder", "isActive"],
      atLeastOneFieldFrom: ["sCode", "sName", "description", "routePath", "parentScreenId", "displayOrder", "isActive"],
    });

    const id = parseRequiredInt(req.params.id, "id");
    const updated = await accessService.updateScreenById(id, {
      sCode: parseOptionalString(req.body.sCode),
      sName: parseOptionalString(req.body.sName),
      description: Object.prototype.hasOwnProperty.call(req.body, "description")
        ? parseOptionalString(req.body.description) ?? null
        : undefined,
      routePath: Object.prototype.hasOwnProperty.call(req.body, "routePath")
        ? parseOptionalString(req.body.routePath) ?? null
        : undefined,
      parentScreenId: Object.prototype.hasOwnProperty.call(req.body, "parentScreenId")
        ? parseOptionalInt(req.body.parentScreenId, "parentScreenId") ?? null
        : undefined,
      displayOrder: parseOptionalInt(req.body.displayOrder, "displayOrder"),
      isActive: parseOptionalBoolean(req.body.isActive, "isActive"),
    });

    sendSuccess(res, 200, "Screen updated successfully.", updated);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function deleteScreen(req: Request, res: Response) {
  try {
    const id = parseRequiredInt(req.params.id, "id");
    const deleted = await accessService.deleteScreenById(id);
    sendSuccess(res, 200, "Screen deleted successfully.", deleted);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function createPermission(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["sCode", "sName", "description", "isActive"],
      requiredFields: ["sCode", "sName"],
    });

    const created = await accessService.createPermission({
      sCode: parseRequiredString(req.body.sCode, "sCode"),
      sName: parseRequiredString(req.body.sName, "sName"),
      description: parseOptionalString(req.body.description),
      isActive: parseOptionalBoolean(req.body.isActive, "isActive"),
    });

    sendSuccess(res, 201, "Permission created successfully.", created);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getPermissions(req: Request, res: Response) {
  try {
    const includeDeleted = parseOptionalBoolean(req.query.includeDeleted, "includeDeleted") ?? false;
    const data = await accessService.listPermissions(includeDeleted);
    sendSuccess(res, 200, "Permissions fetched successfully.", data);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function updatePermission(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["sCode", "sName", "description", "isActive"],
      atLeastOneFieldFrom: ["sCode", "sName", "description", "isActive"],
    });

    const id = parseRequiredInt(req.params.id, "id");
    const updated = await accessService.updatePermissionById(id, {
      sCode: parseOptionalString(req.body.sCode),
      sName: parseOptionalString(req.body.sName),
      description: Object.prototype.hasOwnProperty.call(req.body, "description")
        ? parseOptionalString(req.body.description) ?? null
        : undefined,
      isActive: parseOptionalBoolean(req.body.isActive, "isActive"),
    });

    sendSuccess(res, 200, "Permission updated successfully.", updated);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function deletePermission(req: Request, res: Response) {
  try {
    const id = parseRequiredInt(req.params.id, "id");
    const deleted = await accessService.deletePermissionById(id);
    sendSuccess(res, 200, "Permission deleted successfully.", deleted);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function assignRoleScreenPermissions(req: Request, res: Response) {
  try {
    if (!req.authUser) {
      throw new ApiError(401, "Authentication required.");
    }

    validateRequestBodyFields(req.body, {
      allowedFields: ["assignments"],
      requiredFields: ["assignments"],
    });

    const roleId = parseRequiredInt(req.params.roleId, "roleId");
    const assignments = parsePermissionAssignments(req.body.assignments);
    const data = await accessService.assignRoleScreenPermissions(req.authUser, roleId, assignments);

    sendSuccess(res, 200, "Role screen permissions saved successfully.", data);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getRoleScreenPermissions(req: Request, res: Response) {
  try {
    if (!req.authUser) {
      throw new ApiError(401, "Authentication required.");
    }

    const roleId = parseRequiredInt(req.params.roleId, "roleId");
    const data = await accessService.getRoleScreenPermissions(req.authUser, roleId);
    sendSuccess(res, 200, "Role screen permissions fetched successfully.", data);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function assignUserScreenPermissions(req: Request, res: Response) {
  try {
    if (!req.authUser) {
      throw new ApiError(401, "Authentication required.");
    }

    validateRequestBodyFields(req.body, {
      allowedFields: ["assignments"],
      requiredFields: ["assignments"],
    });

    const userId = parseRequiredInt(req.params.userId, "userId");
    const assignments = parsePermissionAssignments(req.body.assignments);
    const data = await accessService.assignUserScreenPermissions(req.authUser, userId, assignments);

    sendSuccess(res, 200, "User screen permissions saved successfully.", data);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getUserScreenPermissions(req: Request, res: Response) {
  try {
    if (!req.authUser) {
      throw new ApiError(401, "Authentication required.");
    }

    const userId = parseRequiredInt(req.params.userId, "userId");
    const data = await accessService.getUserScreenPermissions(req.authUser, userId);
    sendSuccess(res, 200, "User screen permissions fetched successfully.", data);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getMyScreens(req: Request, res: Response) {
  try {
    if (!req.authUser) {
      throw new ApiError(401, "Authentication required.");
    }

    const data = await accessService.getMyScreens(req.authUser);
    sendSuccess(res, 200, "Current user screens fetched successfully.", data);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getMyPermissions(req: Request, res: Response) {
  try {
    if (!req.authUser) {
      throw new ApiError(401, "Authentication required.");
    }

    const data = await accessService.getMyPermissions(req.authUser);
    sendSuccess(res, 200, "Current user permissions fetched successfully.", data);
  } catch (error) {
    handleControllerError(res, error);
  }
}
