import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { parseOptionalString } from "../utils/request-parsers";

export type CreateRoleInput = {
  sCode: string;
  sName: string;
  precedence: number;
  isActive?: boolean;
};

export type UpdateRoleInput = {
  sCode?: string;
  sName?: string;
  precedence?: number;
  isActive?: boolean;
};

export type RoleFilters = {
  sCode?: string;
  sName?: string;
  precedence?: number;
  isActive?: boolean;
  includeDeleted?: boolean;
};

const SU_ROLE_CODE = "SU";
const SU_TOP_PRECEDENCE = 1;

const roleSelect = {
  iMasterId: true,
  sCode: true,
  sName: true,
  precedence: true,
  isActive: true,
  isDeleted: true,
  deletedAt: true,
  deletedByUserMasterId: true,
  createdAt: true,
  updatedAt: true,
} as const;

const roleUsersSelect = {
  iMasterId: true,
  username: true,
  firstName: true,
  middleName: true,
  lastName: true,
  email: true,
  mobileNo: true,
  alternateNumber: true,
  iRoleMasterId: true,
  employmentStatus: true,
  joinedAt: true,
  leftAt: true,
  isActive: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
} as const;

class RoleService {
  private normalizeRoleCode(value: string): string {
    return value.trim().toUpperCase();
  }

  private assertRolePrecedencePolicy(sCode: string, precedence: number): void {
    const normalizedCode = this.normalizeRoleCode(sCode);

    if (normalizedCode === SU_ROLE_CODE && precedence !== SU_TOP_PRECEDENCE) {
      throw new ApiError(400, "SU role must always have precedence 1.");
    }

    if (normalizedCode !== SU_ROLE_CODE && precedence === SU_TOP_PRECEDENCE) {
      throw new ApiError(400, "Precedence 1 is reserved only for SU role.");
    }
  }

  private assertRoleCanBeSoftDeleted(role: { sCode: string }): void {
    if (this.normalizeRoleCode(role.sCode) === SU_ROLE_CODE) {
      throw new ApiError(400, "SU role cannot be deleted.");
    }
  }

  async createRole(input: CreateRoleInput) {
    this.assertRolePrecedencePolicy(input.sCode, input.precedence);

    return prisma.mRoles.create({
      data: {
        sCode: input.sCode,
        sName: input.sName,
        precedence: input.precedence,
        isActive: input.isActive ?? true,
      },
      select: roleSelect,
    });
  }

  async getRoles(filters: RoleFilters) {
    return prisma.mRoles.findMany({
      where: {
        sCode: filters.sCode ? { contains: filters.sCode } : undefined,
        sName: filters.sName ? { contains: filters.sName } : undefined,
        precedence: filters.precedence,
        isActive: filters.isActive,
        isDeleted: filters.includeDeleted ? undefined : false,
      },
      orderBy: [{ precedence: "asc" }, { iMasterId: "asc" }],
      select: roleSelect,
    });
  }

  async getRoleById(iMasterId: number, includeDeleted = false) {
    return prisma.mRoles.findFirst({
      where: { iMasterId, isDeleted: includeDeleted ? undefined : false },
      select: roleSelect,
    });
  }

  async getRoleBySName(sName: string, includeDeleted = false) {
    return prisma.mRoles.findFirst({
      where: { sName, isDeleted: includeDeleted ? undefined : false },
      select: roleSelect,
    });
  }

  async updateRoleById(iMasterId: number, input: UpdateRoleInput) {
    const role = await this.getRoleById(iMasterId);

    if (!role) {
      throw new ApiError(404, "Role not found.");
    }

    const nextSCode = parseOptionalString(input.sCode) ?? role.sCode;
    const nextPrecedence = input.precedence ?? role.precedence;

    this.assertRolePrecedencePolicy(nextSCode, nextPrecedence);

    return prisma.mRoles.update({
      where: { iMasterId },
      data: {
        sCode: parseOptionalString(input.sCode),
        sName: parseOptionalString(input.sName),
        precedence: input.precedence,
        isActive: input.isActive,
      },
      select: roleSelect,
    });
  }

  async updateRoleBySCode(sCode: string, input: UpdateRoleInput) {
    const role = await prisma.mRoles.findFirst({
      where: { sCode, isDeleted: false },
      select: { iMasterId: true },
    });

    if (!role) {
      throw new ApiError(404, "Role not found.");
    }

    return this.updateRoleById(role.iMasterId, input);
  }

  async deleteRoleById(iMasterId: number) {
    const role = await this.getRoleById(iMasterId);

    if (!role) {
      throw new ApiError(404, "Role not found.");
    }

    this.assertRoleCanBeSoftDeleted(role);

    const assignedUsersCount = await prisma.mUsers.count({
      where: {
        iRoleMasterId: iMasterId,
        isDeleted: false,
      },
    });

    if (assignedUsersCount > 0) {
      throw new ApiError(400, "Cannot delete role assigned to non-deleted users.");
    }

    return prisma.mRoles.update({
      where: { iMasterId },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
        deletedByUserMasterId: null,
      },
      select: roleSelect,
    });
  }

  async deleteRoleBySCode(sCode: string) {
    const role = await prisma.mRoles.findFirst({
      where: { sCode, isDeleted: false },
      select: { iMasterId: true },
    });

    if (!role) {
      throw new ApiError(404, "Role not found.");
    }

    return this.deleteRoleById(role.iMasterId);
  }

  async deleteRolesByIds(iMasterIds: number[]) {
    const uniqueIds = [...new Set(iMasterIds)];

    const existingRoles = await prisma.mRoles.findMany({
      where: {
        iMasterId: {
          in: uniqueIds,
        },
        isDeleted: false,
      },
      select: {
        iMasterId: true,
        sCode: true,
      },
    });

    const existingRoleIds = new Set(existingRoles.map((role) => role.iMasterId));
    const missingRoleIds = uniqueIds.filter((id) => !existingRoleIds.has(id));

    if (missingRoleIds.length > 0) {
      throw new ApiError(404, `Roles not found for iMasterId: ${missingRoleIds.join(", ")}.`);
    }

    const suRole = existingRoles.find((role) => this.normalizeRoleCode(role.sCode) === SU_ROLE_CODE);
    if (suRole) {
      throw new ApiError(400, "SU role cannot be deleted.");
    }

    const assignedUsers = await prisma.mUsers.findMany({
      where: {
        iRoleMasterId: {
          in: uniqueIds,
        },
        isDeleted: false,
      },
      select: {
        iRoleMasterId: true,
      },
      distinct: ["iRoleMasterId"],
    });

    const blockedRoleIds = assignedUsers
      .map((user) => user.iRoleMasterId)
      .filter((iRoleMasterId): iRoleMasterId is number => iRoleMasterId !== null);

    if (blockedRoleIds.length > 0) {
      throw new ApiError(
        400,
        `Cannot delete roles assigned to users. Remove assignments first for iMasterId: ${blockedRoleIds.join(", ")}.`,
      );
    }

    const deleted = await prisma.mRoles.updateMany({
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
      deletedRoleIds: uniqueIds,
    };
  }

  async getUsersByRoleId(iMasterId: number) {
    const role = await prisma.mRoles.findFirst({
      where: { iMasterId, isDeleted: false },
      select: { iMasterId: true },
    });

    if (!role) {
      throw new ApiError(404, "Role not found.");
    }

    return prisma.mUsers.findMany({
      where: { iRoleMasterId: iMasterId, isDeleted: false },
      orderBy: { iMasterId: "asc" },
      select: roleUsersSelect,
    });
  }

  async getUsersByRoleSName(sName: string) {
    const parsedSName = parseOptionalString(sName);

    if (!parsedSName) {
      throw new ApiError(400, "sName is required.");
    }

    const role = await prisma.mRoles.findFirst({
      where: { sName: parsedSName, isDeleted: false },
      select: { iMasterId: true },
    });

    if (!role) {
      throw new ApiError(404, "Role not found.");
    }

    return prisma.mUsers.findMany({
      where: { iRoleMasterId: role.iMasterId, isDeleted: false },
      orderBy: { iMasterId: "asc" },
      select: roleUsersSelect,
    });
  }

  async restoreRoleById(iMasterId: number) {
    const role = await prisma.mRoles.findUnique({
      where: { iMasterId },
      select: { iMasterId: true },
    });

    if (!role) {
      throw new ApiError(404, "Role not found.");
    }

    return prisma.mRoles.update({
      where: { iMasterId },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedByUserMasterId: null,
        isActive: true,
      },
      select: roleSelect,
    });
  }
}

export const roleService = new RoleService();
