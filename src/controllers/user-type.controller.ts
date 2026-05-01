import { Request, Response } from "express";
import { userTypeService } from "../services/user-type.service";
import { ApiError } from "../utils/api-error";
import { handleControllerError, sendSuccess } from "../utils/error-handler";
import {
  parseOptionalBoolean,
  parseOptionalString,
  parseRequiredInt,
  parseRequiredIntArray,
  parseRequiredString,
  validateRequestBodyFields,
} from "../utils/request-parsers";

export async function createUserType(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["sCode", "sName", "isActive"],
      requiredFields: ["sCode", "sName"],
    });

    const sCode = parseRequiredString(req.body.sCode, "sCode");
    const sName = parseRequiredString(req.body.sName, "sName");
    const isActive = parseOptionalBoolean(req.body.isActive, "isActive");

    const userType = await userTypeService.createUserType({
      sCode,
      sName,
      isActive,
    });

    sendSuccess(res, 201, "User type created successfully.", userType);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getUserTypes(req: Request, res: Response) {
  try {
    const sCode = parseOptionalString(req.query.sCode);
    const sName = parseOptionalString(req.query.sName) ?? parseOptionalString(req.query.name);
    const isActive = parseOptionalBoolean(req.query.isActive, "isActive");
    const includeDeleted = parseOptionalBoolean(req.query.includeDeleted, "includeDeleted");

    const userTypes = await userTypeService.getUserTypes({
      sCode,
      sName,
      isActive,
      includeDeleted,
    });

    if (userTypes.length === 0) {
      sendSuccess(res, 200, "No user types found.", userTypes);
      return;
    }

    sendSuccess(res, 200, "User types fetched successfully.", userTypes);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getUserTypeById(req: Request, res: Response) {
  try {
    const iMasterId = parseRequiredInt(req.params.iMasterId ?? req.params.id, "iMasterId");
    const includeDeleted = parseOptionalBoolean(req.query.includeDeleted, "includeDeleted");
    const userType = await userTypeService.getUserTypeById(iMasterId, includeDeleted);

    if (!userType) {
      throw new ApiError(404, "User type not found.");
    }

    sendSuccess(res, 200, "User type fetched successfully.", userType);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getUserTypeBySName(req: Request, res: Response) {
  try {
    const sName = parseRequiredString(req.params.sName ?? req.params.name, "sName");
    const includeDeleted = parseOptionalBoolean(req.query.includeDeleted, "includeDeleted");
    const userType = await userTypeService.getUserTypeBySName(sName, includeDeleted);

    if (!userType) {
      throw new ApiError(404, "User type not found.");
    }

    sendSuccess(res, 200, "User type fetched successfully.", userType);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function updateUserTypeById(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["sCode", "sName", "isActive"],
      atLeastOneFieldFrom: ["sCode", "sName", "isActive"],
    });

    const iMasterId = parseRequiredInt(req.params.iMasterId ?? req.params.id, "iMasterId");
    const sCode = parseOptionalString(req.body.sCode);
    const sName = parseOptionalString(req.body.sName);
    const isActive = parseOptionalBoolean(req.body.isActive, "isActive");

    const userType = await userTypeService.updateUserTypeById(iMasterId, {
      sCode,
      sName,
      isActive,
    });

    sendSuccess(res, 200, "User type updated successfully.", userType);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function updateUserTypeBySCode(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["sCode", "sName", "isActive"],
      atLeastOneFieldFrom: ["sCode", "sName", "isActive"],
    });

    const existingSCode = parseRequiredString(req.params.sCode, "sCode");
    const sCode = parseOptionalString(req.body.sCode);
    const sName = parseOptionalString(req.body.sName);
    const isActive = parseOptionalBoolean(req.body.isActive, "isActive");

    const userType = await userTypeService.updateUserTypeBySCode(existingSCode, {
      sCode,
      sName,
      isActive,
    });

    sendSuccess(res, 200, "User type updated successfully.", userType);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function deleteUserTypeById(req: Request, res: Response) {
  try {
    const iMasterId = parseRequiredInt(req.params.iMasterId ?? req.params.id, "iMasterId");
    const userType = await userTypeService.deleteUserTypeById(iMasterId);

    sendSuccess(res, 200, "User type deleted successfully.", userType);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function deleteUserTypeBySCode(req: Request, res: Response) {
  try {
    const sCode = parseRequiredString(req.params.sCode, "sCode");
    const userType = await userTypeService.deleteUserTypeBySCode(sCode);

    sendSuccess(res, 200, "User type deleted successfully.", userType);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function deleteUserTypesByIds(req: Request, res: Response) {
  try {
    const userTypesId = parseRequiredIntArray(
      req.body.userTypesId ?? req.body.userTypeIds,
      "userTypesId",
    );
    const result = await userTypeService.deleteUserTypesByIds(userTypesId);

    sendSuccess(res, 200, "User types deleted successfully.", result);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function restoreUserTypeById(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: [],
    });

    const iMasterId = parseRequiredInt(req.params.iMasterId ?? req.params.id, "iMasterId");
    const userType = await userTypeService.restoreUserTypeById(iMasterId);

    sendSuccess(res, 200, "User type restored successfully.", userType);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getUsersByUserTypeId(req: Request, res: Response) {
  try {
    const iMasterId = parseRequiredInt(req.params.iMasterId ?? req.params.id, "iMasterId");
    const users = await userTypeService.getUsersByUserTypeId(iMasterId);

    if (users.length === 0) {
      sendSuccess(res, 200, "No users found for this user type.", users);
      return;
    }

    sendSuccess(res, 200, "Users fetched successfully for user type.", users);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getUsersByUserTypeSName(req: Request, res: Response) {
  try {
    const sName = parseRequiredString(req.params.sName ?? req.params.name, "sName");
    const users = await userTypeService.getUsersByUserTypeSName(sName);

    if (users.length === 0) {
      sendSuccess(res, 200, "No users found for this user type.", users);
      return;
    }

    sendSuccess(res, 200, "Users fetched successfully for user type.", users);
  } catch (error) {
    handleControllerError(res, error);
  }
}
