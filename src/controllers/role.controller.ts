import { Request, Response } from "express";
import { roleService } from "../services/role.service";
import { handleControllerError, sendSuccess } from "../utils/error-handler";
import {
  parseOptionalBoolean,
  parseOptionalInt,
  parseOptionalString,
  parseRequiredIntArray,
  parseRequiredInt,
  parseRequiredString,
  validateRequestBodyFields,
} from "../utils/request-parsers";
import { ApiError } from "../utils/api-error";

export async function createRole(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["sCode", "sName", "precedence", "isActive"],
      requiredFields: ["sCode", "sName", "precedence"],
    });

    const sCode = parseRequiredString(req.body.sCode, "sCode");
    const sName = parseRequiredString(req.body.sName, "sName");
    const precedence = parseRequiredInt(req.body.precedence, "precedence");
    const isActive = parseOptionalBoolean(req.body.isActive, "isActive");

    const role = await roleService.createRole({
      sCode,
      sName,
      precedence,
      isActive,
    });

    sendSuccess(res, 201, "Role created successfully.", role);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getRoles(req: Request, res: Response) {
  try {
    const sCode = parseOptionalString(req.query.sCode);
    const sName = parseOptionalString(req.query.sName) ?? parseOptionalString(req.query.name);
    const precedence = parseOptionalInt(req.query.precedence, "precedence");
    const isActive = parseOptionalBoolean(req.query.isActive, "isActive");
    const includeDeleted = parseOptionalBoolean(req.query.includeDeleted, "includeDeleted");

    const roles = await roleService.getRoles({
      sCode,
      sName,
      precedence,
      isActive,
      includeDeleted,
    });

    if (roles.length === 0) {
      sendSuccess(res, 200, "No roles found.", roles);
      return;
    }

    sendSuccess(res, 200, "Roles fetched successfully.", roles);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getRoleById(req: Request, res: Response) {
  try {
    const iMasterId = parseRequiredInt(req.params.iMasterId ?? req.params.id, "iMasterId");
    const includeDeleted = parseOptionalBoolean(req.query.includeDeleted, "includeDeleted");
    const role = await roleService.getRoleById(iMasterId, includeDeleted);

    if (!role) {
      throw new ApiError(404, "Role not found.");
    }

    sendSuccess(res, 200, "Role fetched successfully.", role);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getRoleBySName(req: Request, res: Response) {
  try {
    const sName = parseRequiredString(req.params.sName ?? req.params.name, "sName");
    const includeDeleted = parseOptionalBoolean(req.query.includeDeleted, "includeDeleted");
    const role = await roleService.getRoleBySName(sName, includeDeleted);

    if (!role) {
      throw new ApiError(404, "Role not found.");
    }

    sendSuccess(res, 200, "Role fetched successfully.", role);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function updateRoleById(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["sCode", "sName", "precedence", "isActive"],
      atLeastOneFieldFrom: ["sCode", "sName", "precedence", "isActive"],
    });

    const iMasterId = parseRequiredInt(req.params.iMasterId ?? req.params.id, "iMasterId");
    const sCode = parseOptionalString(req.body.sCode);
    const sName = parseOptionalString(req.body.sName);
    const precedence = parseOptionalInt(req.body.precedence, "precedence");
    const isActive = parseOptionalBoolean(req.body.isActive, "isActive");

    const role = await roleService.updateRoleById(iMasterId, {
      sCode,
      sName,
      precedence,
      isActive,
    });

    sendSuccess(res, 200, "Role updated successfully.", role);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function updateRoleBySCode(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["sCode", "sName", "precedence", "isActive"],
      atLeastOneFieldFrom: ["sCode", "sName", "precedence", "isActive"],
    });

    const existingSCode = parseRequiredString(req.params.sCode, "sCode");
    const sCode = parseOptionalString(req.body.sCode);
    const sName = parseOptionalString(req.body.sName);
    const precedence = parseOptionalInt(req.body.precedence, "precedence");
    const isActive = parseOptionalBoolean(req.body.isActive, "isActive");

    const role = await roleService.updateRoleBySCode(existingSCode, {
      sCode,
      sName,
      precedence,
      isActive,
    });

    sendSuccess(res, 200, "Role updated successfully.", role);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function deleteRoleById(req: Request, res: Response) {
  try {
    const iMasterId = parseRequiredInt(req.params.iMasterId ?? req.params.id, "iMasterId");
    const role = await roleService.deleteRoleById(iMasterId);

    sendSuccess(res, 200, "Role deleted successfully.", role);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function deleteRoleBySCode(req: Request, res: Response) {
  try {
    const sCode = parseRequiredString(req.params.sCode, "sCode");
    const role = await roleService.deleteRoleBySCode(sCode);

    sendSuccess(res, 200, "Role deleted successfully.", role);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function deleteRolesByIds(req: Request, res: Response) {
  try {
    const rolesId = parseRequiredIntArray(req.body.rolesId ?? req.body.roleIds, "rolesId");
    const result = await roleService.deleteRolesByIds(rolesId);

    sendSuccess(res, 200, "Roles deleted successfully.", result);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function restoreRoleById(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: [],
    });

    const iMasterId = parseRequiredInt(req.params.iMasterId ?? req.params.id, "iMasterId");
    const role = await roleService.restoreRoleById(iMasterId);

    sendSuccess(res, 200, "Role restored successfully.", role);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getUsersByRoleId(req: Request, res: Response) {
  try {
    const iMasterId = parseRequiredInt(req.params.iMasterId ?? req.params.id, "iMasterId");
    const users = await roleService.getUsersByRoleId(iMasterId);

    if (users.length === 0) {
      sendSuccess(res, 200, "No users found for this role.", users);
      return;
    }

    sendSuccess(res, 200, "Users fetched successfully for role.", users);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getUsersByRoleSName(req: Request, res: Response) {
  try {
    const sName = parseRequiredString(req.params.sName ?? req.params.name, "sName");
    const users = await roleService.getUsersByRoleSName(sName);

    if (users.length === 0) {
      sendSuccess(res, 200, "No users found for this role.", users);
      return;
    }

    sendSuccess(res, 200, "Users fetched successfully for role.", users);
  } catch (error) {
    handleControllerError(res, error);
  }
}
