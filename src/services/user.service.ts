import { EmploymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { hashPassword } from "../utils/password";
import { parseOptionalString } from "../utils/request-parsers";
import { canManageRole, isSuperUserRole, RoleScope } from "../utils/role-precedence";

export type CreateUserInput = {
  username: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  address?: string;
  mobileNo?: string;
  alternateNumber?: string;
  email?: string;
  password: string;
  iRoleMasterId: number;
  iUserTypeMasterId: number;
  createdByUserId: number;
  isActive?: boolean;
};

export type UserFilters = {
  id?: number;
  iMasterId?: number;
  username?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  address?: string;
  mobileNo?: string;
  alternateNumber?: string;
  email?: string;
  iRoleMasterId?: number;
  iUserTypeMasterId?: number;
  sRoleName?: string;
  sUserTypeName?: string;
  isActive?: boolean;
  employmentStatus?: EmploymentStatus;
  createdFrom?: Date;
  createdTo?: Date;
  includeDeleted?: boolean;
};

const userSelect = {
  iMasterId: true,
  username: true,
  firstName: true,
  middleName: true,
  lastName: true,
  mobileNo: true,
  alternateNumber: true,
  email: true,
  iRoleMasterId: true,
  iUserTypeMasterId: true,
  employmentStatus: true,
  joinedAt: true,
  leftAt: true,
  isActive: true,
  isDeleted: true,
  deletedAt: true,
  deletedByUserMasterId: true,
  createdAt: true,
  updatedAt: true,
  role: {
    select: {
      iMasterId: true,
      sCode: true,
      sName: true,
      isActive: true,
    },
  },
  userType: {
    select: {
      iMasterId: true,
      sCode: true,
      sName: true,
      isActive: true,
    },
  },
  addresses: {
    select: {
      iMasterId: true,
      addressType: true,
      addressLine1: true,
      addressLine2: true,
      landmark: true,
      city: true,
      state: true,
      pincode: true,
      latitude: true,
      longitude: true,
      isDefault: true,
      isActive: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true,
    },
    where: {
      isDeleted: false,
    },
    orderBy: [{ isDefault: "desc" }, { iMasterId: "asc" }],
  },
} satisfies Prisma.mUsersSelect;

const SU_ROLE_CODE = "SU";

type UserForSuGuard = {
  iMasterId: number;
  isActive: boolean;
  employmentStatus: EmploymentStatus;
  role: {
    sCode: string;
    sName: string;
  } | null;
};

type UserWithMasterId = {
  iMasterId: number;
  addresses?: Array<{ addressLine1: string; isDefault: boolean }>;
};

function withUserIdAlias<T extends UserWithMasterId>(user: T): T & { id: number; address: string | null } {
  const defaultAddress = user.addresses?.find((address) => address.isDefault) ?? user.addresses?.[0];

  return {
    ...user,
    id: user.iMasterId,
    address: defaultAddress?.addressLine1 ?? null,
  };
}

function withUserIdAliases<T extends UserWithMasterId>(users: T[]): Array<T & { id: number; address: string | null }> {
  return users.map((user) => withUserIdAlias(user));
}

class UserService {
  private isSuRole(role: { sCode: string; sName: string } | null): boolean {
    if (!role) {
      return false;
    }

    const code = role.sCode.trim().toUpperCase();
    return code === SU_ROLE_CODE;
  }

  private isActiveSuUser(user: UserForSuGuard): boolean {
    return (
      user.isActive &&
      user.employmentStatus === EmploymentStatus.ACTIVE &&
      this.isSuRole(user.role)
    );
  }

  private async getActiveSuUserCount(excludedUserIds: number[] = []): Promise<number> {
    return prisma.mUsers.count({
      where: {
        iMasterId: excludedUserIds.length > 0 ? { notIn: excludedUserIds } : undefined,
        isActive: true,
        isDeleted: false,
        employmentStatus: EmploymentStatus.ACTIVE,
        role: {
          is: {
            sCode: SU_ROLE_CODE,
          },
        },
      },
    });
  }

  private async ensureAtLeastOneActiveSuRemainsForUsers(users: UserForSuGuard[]) {
    const activeSuUsers = users.filter((user) => this.isActiveSuUser(user));

    if (activeSuUsers.length === 0) {
      return;
    }

    const remainingActiveSuCount = await this.getActiveSuUserCount(
      activeSuUsers.map((user) => user.iMasterId),
    );

    if (remainingActiveSuCount === 0) {
      throw new ApiError(400, "Operation denied: at least one active SU user must remain.");
    }
  }

  async createUser(input: CreateUserInput) {
    const creator = await prisma.mUsers.findFirst({
      where: { iMasterId: input.createdByUserId, isDeleted: false },
      select: {
        iMasterId: true,
        isActive: true,
        employmentStatus: true,
        role: {
          select: {
            iMasterId: true,
            sCode: true,
            sName: true,
            precedence: true,
          },
        },
      },
    });

    if (!creator) {
      throw new ApiError(404, "Creator user not found for provided createdByUserId.");
    }

    if (!creator.isActive || creator.employmentStatus !== EmploymentStatus.ACTIVE || !creator.role) {
      throw new ApiError(403, "Only active dashboard users can create new user credentials.");
    }

    const actorRole: RoleScope = {
      iMasterId: creator.role.iMasterId,
      sCode: creator.role.sCode,
      sName: creator.role.sName,
      precedence: creator.role.precedence,
    };

    const targetRole = await prisma.mRoles.findFirst({
      where: { iMasterId: input.iRoleMasterId, isDeleted: false },
      select: { iMasterId: true, sCode: true, sName: true, precedence: true },
    });

    if (!targetRole) {
      throw new ApiError(404, "Role not found for provided iRoleMasterId.");
    }

    if (!isSuperUserRole(actorRole) && !canManageRole(actorRole, targetRole)) {
      throw new ApiError(403, "You can only create users with lower privilege roles.");
    }

    const userType = await prisma.mUserTypes.findFirst({
      where: { iMasterId: input.iUserTypeMasterId, isDeleted: false },
      select: { iMasterId: true },
    });

    if (!userType) {
      throw new ApiError(404, "User type not found for provided iUserTypeMasterId.");
    }

    const address = parseOptionalString(input.address);
    const hashedPassword = await hashPassword(input.password);
    const user = await prisma.mUsers.create({
      data: {
        username: input.username,
        firstName: parseOptionalString(input.firstName),
        middleName: parseOptionalString(input.middleName),
        lastName: parseOptionalString(input.lastName),
        mobileNo: parseOptionalString(input.mobileNo),
        alternateNumber: parseOptionalString(input.alternateNumber),
        email: parseOptionalString(input.email),
        password: hashedPassword,
        iRoleMasterId: input.iRoleMasterId,
        iUserTypeMasterId: input.iUserTypeMasterId,
        employmentStatus: EmploymentStatus.ACTIVE,
        joinedAt: new Date(),
        leftAt: null,
        isActive: input.isActive ?? true,
        addresses: address
          ? {
              create: {
                addressLine1: address,
                addressType: "HOME",
                isDefault: true,
              },
            }
          : undefined,
      },
      select: userSelect,
    });

    return withUserIdAlias(user);
  }

  async getUsers(filters: UserFilters) {
    const createdAtFilter =
      filters.createdFrom || filters.createdTo
        ? {
            gte: filters.createdFrom,
            lte: filters.createdTo,
          }
        : undefined;

    const users = await prisma.mUsers.findMany({
      where: {
        iMasterId: filters.iMasterId ?? filters.id,
        isDeleted: filters.includeDeleted ? undefined : false,
        username: filters.username ? { contains: filters.username } : undefined,
        firstName: filters.firstName ? { contains: filters.firstName } : undefined,
        middleName: filters.middleName ? { contains: filters.middleName } : undefined,
        lastName: filters.lastName ? { contains: filters.lastName } : undefined,
        addresses: filters.address
          ? {
              some: {
                addressLine1: { contains: filters.address },
                isDeleted: false,
              },
            }
          : undefined,
        mobileNo: filters.mobileNo ? { contains: filters.mobileNo } : undefined,
        alternateNumber: filters.alternateNumber
          ? { contains: filters.alternateNumber }
          : undefined,
        email: filters.email ? { contains: filters.email } : undefined,
        iRoleMasterId: filters.iRoleMasterId,
        iUserTypeMasterId: filters.iUserTypeMasterId,
        isActive: filters.isActive,
        employmentStatus: filters.employmentStatus,
        role: filters.sRoleName
          ? {
              sName: {
                contains: filters.sRoleName,
              },
            }
          : undefined,
        userType: filters.sUserTypeName
          ? {
              sName: {
                contains: filters.sUserTypeName,
              },
            }
          : undefined,
        createdAt: createdAtFilter,
      },
      orderBy: {
        iMasterId: "asc",
      },
      select: userSelect,
    });

    return withUserIdAliases(users);
  }

  async getUserById(id: number, includeDeleted = false) {
    const user = await prisma.mUsers.findFirst({
      where: { iMasterId: id, isDeleted: includeDeleted ? undefined : false },
      select: userSelect,
    });

    return user ? withUserIdAlias(user) : null;
  }

  async getUserByUsername(username: string, includeDeleted = false) {
    const user = await prisma.mUsers.findFirst({
      where: { username, isDeleted: includeDeleted ? undefined : false },
      select: userSelect,
    });

    return user ? withUserIdAlias(user) : null;
  }

  async getUsersByRoleId(iMasterId: number) {
    return this.getUsers({ iRoleMasterId: iMasterId });
  }

  async getUsersByRoleSName(sName: string) {
    return this.getUsers({ sRoleName: sName });
  }

  async getUsersByUserTypeId(iMasterId: number) {
    return this.getUsers({ iUserTypeMasterId: iMasterId });
  }

  async getUsersByUserTypeSName(sName: string) {
    return this.getUsers({ sUserTypeName: sName });
  }

  async markUserLeftById(id: number, leftAt?: Date) {
    const user = await this.getUserById(id);

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    await this.ensureAtLeastOneActiveSuRemainsForUsers([
      {
        iMasterId: user.iMasterId,
        isActive: user.isActive,
        employmentStatus: user.employmentStatus,
        role: user.role
          ? {
              sCode: user.role.sCode,
              sName: user.role.sName,
            }
          : null,
      },
    ]);

    const updated = await prisma.mUsers.update({
      where: { iMasterId: id },
      data: {
        employmentStatus: EmploymentStatus.LEFT,
        leftAt: leftAt ?? new Date(),
        isActive: false,
      },
      select: userSelect,
    });

    return withUserIdAlias(updated);
  }

  async markUserLeftByUsername(username: string, leftAt?: Date) {
    const user = await this.getUserByUsername(username);

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    await this.ensureAtLeastOneActiveSuRemainsForUsers([
      {
        iMasterId: user.iMasterId,
        isActive: user.isActive,
        employmentStatus: user.employmentStatus,
        role: user.role
          ? {
              sCode: user.role.sCode,
              sName: user.role.sName,
            }
          : null,
      },
    ]);

    const updated = await prisma.mUsers.update({
      where: { username },
      data: {
        employmentStatus: EmploymentStatus.LEFT,
        leftAt: leftAt ?? new Date(),
        isActive: false,
      },
      select: userSelect,
    });

    return withUserIdAlias(updated);
  }

  async rejoinUserById(id: number) {
    const user = await this.getUserById(id);

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    const updated = await prisma.mUsers.update({
      where: { iMasterId: id },
      data: {
        employmentStatus: EmploymentStatus.ACTIVE,
        leftAt: null,
        isActive: true,
      },
      select: userSelect,
    });

    return withUserIdAlias(updated);
  }

  async rejoinUserByUsername(username: string) {
    const user = await this.getUserByUsername(username);

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    const updated = await prisma.mUsers.update({
      where: { username },
      data: {
        employmentStatus: EmploymentStatus.ACTIVE,
        leftAt: null,
        isActive: true,
      },
      select: userSelect,
    });

    return withUserIdAlias(updated);
  }

  async deleteUserById(id: number) {
    const user = await this.getUserById(id);

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    await this.ensureAtLeastOneActiveSuRemainsForUsers([
      {
        iMasterId: user.iMasterId,
        isActive: user.isActive,
        employmentStatus: user.employmentStatus,
        role: user.role
          ? {
              sCode: user.role.sCode,
              sName: user.role.sName,
            }
          : null,
      },
    ]);

    const deleted = await prisma.mUsers.update({
      where: { iMasterId: id },
      data: {
        isDeleted: true,
        isActive: false,
        employmentStatus: EmploymentStatus.LEFT,
        leftAt: new Date(),
        deletedAt: new Date(),
        deletedByUserMasterId: null,
      },
      select: userSelect,
    });

    return withUserIdAlias(deleted);
  }

  async deleteUserByUsername(username: string) {
    const user = await this.getUserByUsername(username);

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    await this.ensureAtLeastOneActiveSuRemainsForUsers([
      {
        iMasterId: user.iMasterId,
        isActive: user.isActive,
        employmentStatus: user.employmentStatus,
        role: user.role
          ? {
              sCode: user.role.sCode,
              sName: user.role.sName,
            }
          : null,
      },
    ]);

    const deleted = await prisma.mUsers.update({
      where: { username },
      data: {
        isDeleted: true,
        isActive: false,
        employmentStatus: EmploymentStatus.LEFT,
        leftAt: new Date(),
        deletedAt: new Date(),
        deletedByUserMasterId: null,
      },
      select: userSelect,
    });

    return withUserIdAlias(deleted);
  }

  async deleteUsersByIds(ids: number[]) {
    const uniqueIds = [...new Set(ids)];

    const existingUsers = await prisma.mUsers.findMany({
      where: {
        iMasterId: {
          in: uniqueIds,
        },
        isDeleted: false,
      },
      select: {
        iMasterId: true,
        isActive: true,
        employmentStatus: true,
        role: {
          select: {
            sCode: true,
            sName: true,
          },
        },
      },
    });

    const existingUserIds = new Set(existingUsers.map((user) => user.iMasterId));
    const missingUserIds = uniqueIds.filter((id) => !existingUserIds.has(id));

    if (missingUserIds.length > 0) {
      throw new ApiError(404, `Users not found for id: ${missingUserIds.join(", ")}.`);
    }

    await this.ensureAtLeastOneActiveSuRemainsForUsers(existingUsers);

    const deleted = await prisma.mUsers.updateMany({
      where: {
        iMasterId: {
          in: uniqueIds,
        },
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        isActive: false,
        employmentStatus: EmploymentStatus.LEFT,
        leftAt: new Date(),
        deletedAt: new Date(),
        deletedByUserMasterId: null,
      },
    });

    return {
      requestedCount: uniqueIds.length,
      deletedCount: deleted.count,
      deletedUserIds: uniqueIds,
    };
  }

  async restoreUserById(id: number) {
    const user = await prisma.mUsers.findUnique({
      where: { iMasterId: id },
      select: { iMasterId: true },
    });

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    const restored = await prisma.mUsers.update({
      where: { iMasterId: id },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedByUserMasterId: null,
        isActive: true,
        employmentStatus: EmploymentStatus.ACTIVE,
        leftAt: null,
      },
      select: userSelect,
    });

    return withUserIdAlias(restored);
  }
}

export const userService = new UserService();
