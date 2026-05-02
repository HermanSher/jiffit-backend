import { prisma } from "../lib/prisma";
import { AuthenticatedUser } from "../types/auth";
import { isCustomerUserType } from "../utils/dashboard";
import { isSuperUserRole } from "../utils/role-precedence";

type EffectivePermission = {
  screenCode: string;
  permissionCode: string;
  isAllowed: boolean;
};

class AccessControlService {
  async getEffectivePermissions(user: AuthenticatedUser): Promise<EffectivePermission[]> {
    if (!user.iRoleMasterId) {
      return [];
    }

    const [rolePermissions, userPermissions] = await Promise.all([
      prisma.mRoleScreenPermissions.findMany({
        where: {
          roleId: user.iRoleMasterId,
          screen: { isDeleted: false, isActive: true },
          permission: { isDeleted: false, isActive: true },
        },
        select: {
          screen: { select: { sCode: true } },
          permission: { select: { sCode: true } },
          isAllowed: true,
        },
      }),
      prisma.mUserScreenPermissions.findMany({
        where: {
          userId: user.iMasterId,
          screen: { isDeleted: false, isActive: true },
          permission: { isDeleted: false, isActive: true },
        },
        select: {
          screen: { select: { sCode: true } },
          permission: { select: { sCode: true } },
          isAllowed: true,
        },
      }),
    ]);

    const roleMap = new Map<string, EffectivePermission>();
    for (const entry of rolePermissions) {
      const key = `${entry.screen.sCode}::${entry.permission.sCode}`;
      roleMap.set(key, {
        screenCode: entry.screen.sCode,
        permissionCode: entry.permission.sCode,
        isAllowed: entry.isAllowed,
      });
    }

    for (const override of userPermissions) {
      const key = `${override.screen.sCode}::${override.permission.sCode}`;
      roleMap.set(key, {
        screenCode: override.screen.sCode,
        permissionCode: override.permission.sCode,
        isAllowed: override.isAllowed,
      });
    }

    return [...roleMap.values()];
  }

  async hasPermission(user: AuthenticatedUser, permissionCode: string): Promise<boolean> {
    if (isSuperUserRole({ sCode: user.roleCode ?? "" })) {
      return true;
    }

    if (isCustomerUserType({ sCode: user.userTypeCode, sName: user.userTypeName })) {
      return false;
    }

    const permissions = await this.getEffectivePermissions(user);
    return permissions.some(
      (entry) => entry.permissionCode === permissionCode && entry.isAllowed,
    );
  }

  async hasScreenAccess(user: AuthenticatedUser, screenCode: string): Promise<boolean> {
    if (isSuperUserRole({ sCode: user.roleCode ?? "" })) {
      return true;
    }

    if (isCustomerUserType({ sCode: user.userTypeCode, sName: user.userTypeName })) {
      return false;
    }

    const permissions = await this.getEffectivePermissions(user);
    return permissions.some(
      (entry) => entry.screenCode === screenCode && entry.isAllowed,
    );
  }
}

export const accessControlService = new AccessControlService();
