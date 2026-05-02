import { prisma } from "../../lib/prisma";

type PermissionAssignmentInput = {
  screenId: number;
  permissionId: number;
  isAllowed: boolean;
};

class AccessRepository {
  createScreen(data: {
    sCode: string;
    sName: string;
    description?: string;
    routePath?: string;
    parentScreenId?: number;
    displayOrder?: number;
    isActive?: boolean;
  }) {
    return prisma.mScreens.create({
      data: {
        sCode: data.sCode,
        sName: data.sName,
        description: data.description,
        routePath: data.routePath,
        parentScreenId: data.parentScreenId,
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  getScreens(includeDeleted: boolean) {
    return prisma.mScreens.findMany({
      where: {
        isDeleted: includeDeleted ? undefined : false,
      },
      orderBy: [{ displayOrder: "asc" }, { iMasterId: "asc" }],
    });
  }

  getScreenById(id: number, includeDeleted: boolean = false) {
    return prisma.mScreens.findFirst({
      where: { iMasterId: id, isDeleted: includeDeleted ? undefined : false },
    });
  }

  updateScreenById(id: number, data: Partial<{
    sCode: string;
    sName: string;
    description: string | null;
    routePath: string | null;
    parentScreenId: number | null;
    displayOrder: number;
    isActive: boolean;
  }>) {
    return prisma.mScreens.update({
      where: { iMasterId: id },
      data,
    });
  }

  softDeleteScreenById(id: number) {
    return prisma.mScreens.update({
      where: { iMasterId: id },
      data: {
        isDeleted: true,
        isActive: false,
      },
    });
  }

  createPermission(data: {
    sCode: string;
    sName: string;
    description?: string;
    isActive?: boolean;
  }) {
    return prisma.mPermissions.create({
      data: {
        sCode: data.sCode,
        sName: data.sName,
        description: data.description,
        isActive: data.isActive ?? true,
      },
    });
  }

  getPermissions(includeDeleted: boolean) {
    return prisma.mPermissions.findMany({
      where: {
        isDeleted: includeDeleted ? undefined : false,
      },
      orderBy: [{ sCode: "asc" }],
    });
  }

  getPermissionById(id: number, includeDeleted: boolean = false) {
    return prisma.mPermissions.findFirst({
      where: {
        iMasterId: id,
        isDeleted: includeDeleted ? undefined : false,
      },
    });
  }

  updatePermissionById(id: number, data: Partial<{
    sCode: string;
    sName: string;
    description: string | null;
    isActive: boolean;
  }>) {
    return prisma.mPermissions.update({
      where: { iMasterId: id },
      data,
    });
  }

  softDeletePermissionById(id: number) {
    return prisma.mPermissions.update({
      where: { iMasterId: id },
      data: {
        isDeleted: true,
        isActive: false,
      },
    });
  }

  getRoleById(roleId: number) {
    return prisma.mRoles.findFirst({
      where: { iMasterId: roleId, isDeleted: false },
      select: {
        iMasterId: true,
        sCode: true,
        sName: true,
        precedence: true,
      },
    });
  }

  getUserById(userId: number) {
    return prisma.mUsers.findFirst({
      where: { iMasterId: userId, isDeleted: false },
      select: {
        iMasterId: true,
        username: true,
        iRoleMasterId: true,
        iUserTypeMasterId: true,
        role: {
          select: {
            iMasterId: true,
            sCode: true,
            sName: true,
            precedence: true,
          },
        },
        userType: {
          select: {
            sCode: true,
            sName: true,
          },
        },
      },
    });
  }

  async upsertRolePermissions(roleId: number, permissions: PermissionAssignmentInput[]) {
    return prisma.$transaction(
      permissions.map((entry) =>
        prisma.mRoleScreenPermissions.upsert({
          where: {
            roleId_screenId_permissionId: {
              roleId,
              screenId: entry.screenId,
              permissionId: entry.permissionId,
            },
          },
          create: {
            roleId,
            screenId: entry.screenId,
            permissionId: entry.permissionId,
            isAllowed: entry.isAllowed,
          },
          update: {
            isAllowed: entry.isAllowed,
          },
        }),
      ),
    );
  }

  async upsertUserPermissions(userId: number, permissions: PermissionAssignmentInput[]) {
    return prisma.$transaction(
      permissions.map((entry) =>
        prisma.mUserScreenPermissions.upsert({
          where: {
            userId_screenId_permissionId: {
              userId,
              screenId: entry.screenId,
              permissionId: entry.permissionId,
            },
          },
          create: {
            userId,
            screenId: entry.screenId,
            permissionId: entry.permissionId,
            isAllowed: entry.isAllowed,
          },
          update: {
            isAllowed: entry.isAllowed,
          },
        }),
      ),
    );
  }

  getRoleScreenPermissions(roleId: number) {
    return prisma.mRoleScreenPermissions.findMany({
      where: {
        roleId,
        screen: { isDeleted: false },
        permission: { isDeleted: false },
      },
      include: {
        screen: true,
        permission: true,
      },
      orderBy: [{ screenId: "asc" }, { permissionId: "asc" }],
    });
  }

  getUserScreenPermissions(userId: number) {
    return prisma.mUserScreenPermissions.findMany({
      where: {
        userId,
        screen: { isDeleted: false },
        permission: { isDeleted: false },
      },
      include: {
        screen: true,
        permission: true,
      },
      orderBy: [{ screenId: "asc" }, { permissionId: "asc" }],
    });
  }
}

export const accessRepository = new AccessRepository();
