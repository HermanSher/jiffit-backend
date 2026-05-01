import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { parseOptionalString } from "../utils/request-parsers";

export type CreateUserTypeInput = {
  sCode: string;
  sName: string;
  isActive?: boolean;
};

export type UpdateUserTypeInput = {
  sCode?: string;
  sName?: string;
  isActive?: boolean;
};

export type UserTypeFilters = {
  sCode?: string;
  sName?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
};

const userTypeSelect = {
  iMasterId: true,
  sCode: true,
  sName: true,
  isActive: true,
  isDeleted: true,
  deletedAt: true,
  deletedByUserMasterId: true,
  createdAt: true,
  updatedAt: true,
} as const;

const userTypeUsersSelect = {
  iMasterId: true,
  username: true,
  firstName: true,
  middleName: true,
  lastName: true,
  email: true,
  mobileNo: true,
  alternateNumber: true,
  iRoleMasterId: true,
  iUserTypeMasterId: true,
  employmentStatus: true,
  joinedAt: true,
  leftAt: true,
  isActive: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
} as const;

class UserTypeService {
  async createUserType(input: CreateUserTypeInput) {
    return prisma.mUserTypes.create({
      data: {
        sCode: input.sCode,
        sName: input.sName,
        isActive: input.isActive ?? true,
      },
      select: userTypeSelect,
    });
  }

  async getUserTypes(filters: UserTypeFilters) {
    return prisma.mUserTypes.findMany({
      where: {
        sCode: filters.sCode ? { contains: filters.sCode } : undefined,
        sName: filters.sName ? { contains: filters.sName } : undefined,
        isActive: filters.isActive,
        isDeleted: filters.includeDeleted ? undefined : false,
      },
      orderBy: {
        iMasterId: "asc",
      },
      select: userTypeSelect,
    });
  }

  async getUserTypeById(iMasterId: number, includeDeleted = false) {
    return prisma.mUserTypes.findFirst({
      where: { iMasterId, isDeleted: includeDeleted ? undefined : false },
      select: userTypeSelect,
    });
  }

  async getUserTypeBySName(sName: string, includeDeleted = false) {
    return prisma.mUserTypes.findFirst({
      where: { sName, isDeleted: includeDeleted ? undefined : false },
      select: userTypeSelect,
    });
  }

  async updateUserTypeById(iMasterId: number, input: UpdateUserTypeInput) {
    const userType = await this.getUserTypeById(iMasterId);

    if (!userType) {
      throw new ApiError(404, "User type not found.");
    }

    return prisma.mUserTypes.update({
      where: { iMasterId },
      data: {
        sCode: parseOptionalString(input.sCode),
        sName: parseOptionalString(input.sName),
        isActive: input.isActive,
      },
      select: userTypeSelect,
    });
  }

  async updateUserTypeBySCode(sCode: string, input: UpdateUserTypeInput) {
    const userType = await prisma.mUserTypes.findFirst({
      where: { sCode, isDeleted: false },
      select: { iMasterId: true },
    });

    if (!userType) {
      throw new ApiError(404, "User type not found.");
    }

    return prisma.mUserTypes.update({
      where: { sCode },
      data: {
        sCode: parseOptionalString(input.sCode),
        sName: parseOptionalString(input.sName),
        isActive: input.isActive,
      },
      select: userTypeSelect,
    });
  }

  async deleteUserTypeById(iMasterId: number) {
    const userType = await this.getUserTypeById(iMasterId);

    if (!userType) {
      throw new ApiError(404, "User type not found.");
    }

    const assignedUsersCount = await prisma.mUsers.count({
      where: {
        iUserTypeMasterId: iMasterId,
        isDeleted: false,
      },
    });

    if (assignedUsersCount > 0) {
      throw new ApiError(400, "Cannot delete user type assigned to non-deleted users.");
    }

    return prisma.mUserTypes.update({
      where: { iMasterId },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
        deletedByUserMasterId: null,
      },
      select: userTypeSelect,
    });
  }

  async deleteUserTypeBySCode(sCode: string) {
    const userType = await prisma.mUserTypes.findFirst({
      where: { sCode, isDeleted: false },
      select: { iMasterId: true },
    });

    if (!userType) {
      throw new ApiError(404, "User type not found.");
    }

    return this.deleteUserTypeById(userType.iMasterId);
  }

  async deleteUserTypesByIds(iMasterIds: number[]) {
    const uniqueIds = [...new Set(iMasterIds)];

    const existingUserTypes = await prisma.mUserTypes.findMany({
      where: {
        iMasterId: {
          in: uniqueIds,
        },
        isDeleted: false,
      },
      select: {
        iMasterId: true,
      },
    });

    const existingUserTypeIds = new Set(existingUserTypes.map((userType) => userType.iMasterId));
    const missingUserTypeIds = uniqueIds.filter((id) => !existingUserTypeIds.has(id));

    if (missingUserTypeIds.length > 0) {
      throw new ApiError(404, `User types not found for iMasterId: ${missingUserTypeIds.join(", ")}.`);
    }

    const assignedUsers = await prisma.mUsers.findMany({
      where: {
        iUserTypeMasterId: {
          in: uniqueIds,
        },
        isDeleted: false,
      },
      select: {
        iUserTypeMasterId: true,
      },
      distinct: ["iUserTypeMasterId"],
    });

    const blockedUserTypeIds = assignedUsers
      .map((user) => user.iUserTypeMasterId)
      .filter((iUserTypeMasterId): iUserTypeMasterId is number => iUserTypeMasterId !== null);

    if (blockedUserTypeIds.length > 0) {
      throw new ApiError(
        400,
        `Cannot delete user types assigned to users. Remove assignments first for iMasterId: ${blockedUserTypeIds.join(", ")}.`,
      );
    }

    const deleted = await prisma.mUserTypes.updateMany({
      where: {
        iMasterId: {
          in: uniqueIds,
        },
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
        deletedByUserMasterId: null,
      },
    });

    return {
      requestedCount: uniqueIds.length,
      deletedCount: deleted.count,
      deletedUserTypeIds: uniqueIds,
    };
  }

  async getUsersByUserTypeId(iMasterId: number) {
    const userType = await prisma.mUserTypes.findFirst({
      where: { iMasterId, isDeleted: false },
      select: { iMasterId: true },
    });

    if (!userType) {
      throw new ApiError(404, "User type not found.");
    }

    return prisma.mUsers.findMany({
      where: { iUserTypeMasterId: iMasterId, isDeleted: false },
      orderBy: { iMasterId: "asc" },
      select: userTypeUsersSelect,
    });
  }

  async getUsersByUserTypeSName(sName: string) {
    const parsedSName = parseOptionalString(sName);

    if (!parsedSName) {
      throw new ApiError(400, "sName is required.");
    }

    const userType = await prisma.mUserTypes.findFirst({
      where: { sName: parsedSName, isDeleted: false },
      select: { iMasterId: true },
    });

    if (!userType) {
      throw new ApiError(404, "User type not found.");
    }

    return prisma.mUsers.findMany({
      where: { iUserTypeMasterId: userType.iMasterId, isDeleted: false },
      orderBy: { iMasterId: "asc" },
      select: userTypeUsersSelect,
    });
  }

  async restoreUserTypeById(iMasterId: number) {
    const userType = await prisma.mUserTypes.findUnique({
      where: { iMasterId },
      select: { iMasterId: true },
    });

    if (!userType) {
      throw new ApiError(404, "User type not found.");
    }

    return prisma.mUserTypes.update({
      where: { iMasterId },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedByUserMasterId: null,
        isActive: true,
      },
      select: userTypeSelect,
    });
  }
}

export const userTypeService = new UserTypeService();
