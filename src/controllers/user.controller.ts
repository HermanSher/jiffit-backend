import { EmploymentStatus } from "@prisma/client";
import { Request, Response } from "express";
import { userService } from "../services/user.service";
import { ApiError } from "../utils/api-error";
import { handleControllerError, sendSuccess } from "../utils/error-handler";
import {
  parseOptionalBoolean,
  parseOptionalDate,
  parseOptionalInt,
  parseOptionalString,
  parseRequiredIntArray,
  parseRequiredInt,
  parseRequiredString,
  validateRequestBodyFields,
} from "../utils/request-parsers";

function parseEmploymentStatus(value: unknown): EmploymentStatus | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toUpperCase();

    if (normalized === EmploymentStatus.ACTIVE) {
      return EmploymentStatus.ACTIVE;
    }

    if (normalized === EmploymentStatus.LEFT) {
      return EmploymentStatus.LEFT;
    }
  }

  throw new ApiError(400, "employmentStatus must be ACTIVE or LEFT.");
}

export async function createUser(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: [
        "username",
        "firstName",
        "middleName",
        "lastName",
        "address",
        "mobileNo",
        "alternateNumber",
        "email",
        "password",
        "iRoleMasterId",
        "iUserTypeMasterId",
        "createdByUserId",
        "isActive",
      ],
      requiredFields: ["username", "password", "iRoleMasterId", "iUserTypeMasterId"],
    });

    const username = parseRequiredString(req.body.username, "username");
    const email = parseOptionalString(req.body.email);
    const password = parseRequiredString(req.body.password, "password");
    const iRoleMasterId = parseRequiredInt(req.body.iRoleMasterId, "iRoleMasterId");
    const iUserTypeMasterId = parseRequiredInt(req.body.iUserTypeMasterId, "iUserTypeMasterId");
    const createdByUserIdFromBody = parseOptionalInt(req.body.createdByUserId, "createdByUserId");
    const createdByUserId = req.authUser?.iMasterId ?? createdByUserIdFromBody;
    if (!createdByUserId) {
      throw new ApiError(401, "Authenticated creator user is required.");
    }

    if (createdByUserIdFromBody && req.authUser && createdByUserIdFromBody !== req.authUser.iMasterId) {
      throw new ApiError(403, "createdByUserId must match current authenticated user.");
    }
    const isActive = parseOptionalBoolean(req.body.isActive, "isActive");

    const user = await userService.createUser({
      username,
      firstName: parseOptionalString(req.body.firstName),
      middleName: parseOptionalString(req.body.middleName),
      lastName: parseOptionalString(req.body.lastName),
      address: parseOptionalString(req.body.address),
      mobileNo: parseOptionalString(req.body.mobileNo),
      alternateNumber: parseOptionalString(req.body.alternateNumber),
      email,
      password,
      iRoleMasterId,
      iUserTypeMasterId,
      createdByUserId,
      isActive,
    });

    sendSuccess(res, 201, "User created successfully.", {
      id: user.id,
      username: user.username,
      role: user.role
        ? {
            iMasterId: user.role.iMasterId,
            sCode: user.role.sCode,
            sName: user.role.sName,
          }
        : null,
      userType: user.userType
        ? {
            iMasterId: user.userType.iMasterId,
            sName: user.userType.sName,
          }
        : null,
    });
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getUsers(req: Request, res: Response) {
  try {
    const createdFrom =
      parseOptionalDate(req.query.createdFrom, "createdFrom") ??
      parseOptionalDate(req.query.fromDate, "fromDate");
    const createdTo =
      parseOptionalDate(req.query.createdTo, "createdTo") ??
      parseOptionalDate(req.query.toDate, "toDate");

    if (createdFrom && createdTo && createdFrom.getTime() > createdTo.getTime()) {
      throw new ApiError(400, "createdFrom must be less than or equal to createdTo.");
    }

    const users = await userService.getUsers({
      id: parseOptionalInt(req.query.id, "id"),
      username: parseOptionalString(req.query.username),
      firstName: parseOptionalString(req.query.firstName),
      middleName: parseOptionalString(req.query.middleName),
      lastName: parseOptionalString(req.query.lastName),
      address: parseOptionalString(req.query.address),
      mobileNo: parseOptionalString(req.query.mobileNo),
      alternateNumber: parseOptionalString(req.query.alternateNumber),
      email: parseOptionalString(req.query.email),
      iRoleMasterId:
        parseOptionalInt(req.query.iRoleMasterId, "iRoleMasterId") ??
        parseOptionalInt(req.query.roleId, "roleId"),
      iUserTypeMasterId:
        parseOptionalInt(req.query.iUserTypeMasterId, "iUserTypeMasterId") ??
        parseOptionalInt(req.query.userTypeId, "userTypeId"),
      sRoleName: parseOptionalString(req.query.sRoleName) ?? parseOptionalString(req.query.roleName),
      sUserTypeName:
        parseOptionalString(req.query.sUserTypeName) ?? parseOptionalString(req.query.userTypeName),
      isActive: parseOptionalBoolean(req.query.isActive, "isActive"),
      employmentStatus: parseEmploymentStatus(req.query.employmentStatus),
      createdFrom,
      createdTo,
      includeDeleted: parseOptionalBoolean(req.query.includeDeleted, "includeDeleted"),
    });

    if (users.length === 0) {
      sendSuccess(res, 200, "No users found.", users);
      return;
    }

    sendSuccess(res, 200, "Users fetched successfully.", users);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    const id = parseRequiredInt(req.params.id, "id");
    const includeDeleted = parseOptionalBoolean(req.query.includeDeleted, "includeDeleted");
    const user = await userService.getUserById(id, includeDeleted);

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    sendSuccess(res, 200, "User fetched successfully.", user);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getUserByUsername(req: Request, res: Response) {
  try {
    const username = parseRequiredString(req.params.username, "username");
    const includeDeleted = parseOptionalBoolean(req.query.includeDeleted, "includeDeleted");
    const user = await userService.getUserByUsername(username, includeDeleted);

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    sendSuccess(res, 200, "User fetched successfully.", user);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getUsersByRoleId(req: Request, res: Response) {
  try {
    const iMasterId = parseRequiredInt(req.params.iMasterId ?? req.params.roleId, "iMasterId");
    const users = await userService.getUsersByRoleId(iMasterId);

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
    const sName = parseRequiredString(req.params.sName ?? req.params.roleName, "sName");
    const users = await userService.getUsersByRoleSName(sName);

    if (users.length === 0) {
      sendSuccess(res, 200, "No users found for this role.", users);
      return;
    }

    sendSuccess(res, 200, "Users fetched successfully for role.", users);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getUsersByUserTypeId(req: Request, res: Response) {
  try {
    const iMasterId = parseRequiredInt(req.params.iMasterId ?? req.params.userTypeId, "iMasterId");
    const users = await userService.getUsersByUserTypeId(iMasterId);

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
    const sName = parseRequiredString(req.params.sName ?? req.params.userTypeName, "sName");
    const users = await userService.getUsersByUserTypeSName(sName);

    if (users.length === 0) {
      sendSuccess(res, 200, "No users found for this user type.", users);
      return;
    }

    sendSuccess(res, 200, "Users fetched successfully for user type.", users);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function markUserLeftById(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["leftAt"],
    });

    const id = parseRequiredInt(req.params.id, "id");
    const leftAt = parseOptionalDate(req.body.leftAt, "leftAt");
    const user = await userService.markUserLeftById(id, leftAt);

    sendSuccess(res, 200, "User marked as left successfully.", user);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function markUserLeftByUsername(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: ["leftAt"],
    });

    const username = parseRequiredString(req.params.username, "username");
    const leftAt = parseOptionalDate(req.body.leftAt, "leftAt");
    const user = await userService.markUserLeftByUsername(username, leftAt);

    sendSuccess(res, 200, "User marked as left successfully.", user);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function rejoinUserById(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: [],
    });

    const id = parseRequiredInt(req.params.id, "id");
    const user = await userService.rejoinUserById(id);

    sendSuccess(res, 200, "User rejoined successfully.", user);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function rejoinUserByUsername(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: [],
    });

    const username = parseRequiredString(req.params.username, "username");
    const user = await userService.rejoinUserByUsername(username);

    sendSuccess(res, 200, "User rejoined successfully.", user);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function deleteUserById(req: Request, res: Response) {
  try {
    const id = parseRequiredInt(req.params.id, "id");
    const user = await userService.deleteUserById(id);

    sendSuccess(res, 200, "User deleted successfully.", user);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function deleteUserByUsername(req: Request, res: Response) {
  try {
    const username = parseRequiredString(req.params.username, "username");
    const user = await userService.deleteUserByUsername(username);

    sendSuccess(res, 200, "User deleted successfully.", user);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function deleteUsersByIds(req: Request, res: Response) {
  try {
    const usersId = parseRequiredIntArray(req.body.usersId ?? req.body.userIds, "usersId");
    const result = await userService.deleteUsersByIds(usersId);

    sendSuccess(res, 200, "Users deleted successfully.", result);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function restoreUserById(req: Request, res: Response) {
  try {
    validateRequestBodyFields(req.body, {
      allowedFields: [],
    });

    const id = parseRequiredInt(req.params.iMasterId ?? req.params.id, "iMasterId");
    const user = await userService.restoreUserById(id);

    sendSuccess(res, 200, "User restored successfully.", user);
  } catch (error) {
    handleControllerError(res, error);
  }
}
