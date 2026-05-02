import { accessControlService } from "../../services/access-control.service";
import { AuthenticatedUser } from "../../types/auth";
import { ApiError } from "../../utils/api-error";
import { isCustomerUserType } from "../../utils/dashboard";
import { canManageRole, isSuperUserRole, RoleScope } from "../../utils/role-precedence";
import { accessRepository } from "./access.repository";

type PermissionAssignmentInput = {
  screenId: number;
  permissionId: number;
  isAllowed: boolean;
};

class AccessService {
  private getActorRole(actor: AuthenticatedUser): RoleScope {
    if (
      actor.iRoleMasterId === null ||
      actor.roleCode === null ||
      actor.roleName === null ||
      actor.rolePrecedence === null
    ) {
      throw new ApiError(403, "Current user role metadata is missing.");
    }

    return {
      iMasterId: actor.iRoleMasterId,
      sCode: actor.roleCode,
      sName: actor.roleName,
      precedence: actor.rolePrecedence,
    };
  }

  private assertActorCanManageRole(actor: AuthenticatedUser, targetRole: RoleScope): void {
    const actorRole = this.getActorRole(actor);
    if (isSuperUserRole(actorRole)) {
      return;
    }

    if (!canManageRole(actorRole, targetRole)) {
      throw new ApiError(403, "You can only manage roles lower than your own privilege.");
    }
  }

  async createScreen(input: {
    sCode: string;
    sName: string;
    description?: string;
    routePath?: string;
    parentScreenId?: number;
    displayOrder?: number;
    isActive?: boolean;
  }) {
    if (input.parentScreenId) {
      const parentScreen = await accessRepository.getScreenById(input.parentScreenId);
      if (!parentScreen) {
        throw new ApiError(404, "Parent screen not found.");
      }
    }

    return accessRepository.createScreen(input);
  }

  listScreens(includeDeleted = false) {
    return accessRepository.getScreens(includeDeleted);
  }

  async updateScreenById(
    id: number,
    input: Partial<{
      sCode: string;
      sName: string;
      description: string | null;
      routePath: string | null;
      parentScreenId: number | null;
      displayOrder: number;
      isActive: boolean;
    }>,
  ) {
    const screen = await accessRepository.getScreenById(id, true);
    if (!screen) {
      throw new ApiError(404, "Screen not found.");
    }

    if (input.parentScreenId) {
      const parentScreen = await accessRepository.getScreenById(input.parentScreenId);
      if (!parentScreen) {
        throw new ApiError(404, "Parent screen not found.");
      }
    }

    return accessRepository.updateScreenById(id, input);
  }

  async deleteScreenById(id: number) {
    const screen = await accessRepository.getScreenById(id, true);
    if (!screen) {
      throw new ApiError(404, "Screen not found.");
    }

    return accessRepository.softDeleteScreenById(id);
  }

  createPermission(input: { sCode: string; sName: string; description?: string; isActive?: boolean }) {
    return accessRepository.createPermission(input);
  }

  listPermissions(includeDeleted = false) {
    return accessRepository.getPermissions(includeDeleted);
  }

  async updatePermissionById(
    id: number,
    input: Partial<{
      sCode: string;
      sName: string;
      description: string | null;
      isActive: boolean;
    }>,
  ) {
    const permission = await accessRepository.getPermissionById(id, true);
    if (!permission) {
      throw new ApiError(404, "Permission not found.");
    }

    return accessRepository.updatePermissionById(id, input);
  }

  async deletePermissionById(id: number) {
    const permission = await accessRepository.getPermissionById(id, true);
    if (!permission) {
      throw new ApiError(404, "Permission not found.");
    }

    return accessRepository.softDeletePermissionById(id);
  }

  private async assertScreenAndPermissionExist(entries: PermissionAssignmentInput[]) {
    for (const entry of entries) {
      const [screen, permission] = await Promise.all([
        accessRepository.getScreenById(entry.screenId),
        accessRepository.getPermissionById(entry.permissionId),
      ]);

      if (!screen) {
        throw new ApiError(404, `Screen not found: ${entry.screenId}`);
      }

      if (!permission) {
        throw new ApiError(404, `Permission not found: ${entry.permissionId}`);
      }
    }
  }

  async assignRoleScreenPermissions(
    actor: AuthenticatedUser,
    roleId: number,
    entries: PermissionAssignmentInput[],
  ) {
    const targetRole = await accessRepository.getRoleById(roleId);
    if (!targetRole) {
      throw new ApiError(404, "Target role not found.");
    }

    this.assertActorCanManageRole(actor, targetRole);
    await this.assertScreenAndPermissionExist(entries);

    return accessRepository.upsertRolePermissions(roleId, entries);
  }

  async getRoleScreenPermissions(actor: AuthenticatedUser, roleId: number) {
    const targetRole = await accessRepository.getRoleById(roleId);
    if (!targetRole) {
      throw new ApiError(404, "Target role not found.");
    }

    this.assertActorCanManageRole(actor, targetRole);
    return accessRepository.getRoleScreenPermissions(roleId);
  }

  async assignUserScreenPermissions(
    actor: AuthenticatedUser,
    userId: number,
    entries: PermissionAssignmentInput[],
  ) {
    const targetUser = await accessRepository.getUserById(userId);
    if (!targetUser || !targetUser.role) {
      throw new ApiError(404, "Target user not found.");
    }

    if (targetUser.userType && isCustomerUserType(targetUser.userType)) {
      throw new ApiError(403, "Customer users cannot be assigned dashboard permissions.");
    }

    this.assertActorCanManageRole(actor, targetUser.role);
    await this.assertScreenAndPermissionExist(entries);

    return accessRepository.upsertUserPermissions(userId, entries);
  }

  async getUserScreenPermissions(actor: AuthenticatedUser, userId: number) {
    const targetUser = await accessRepository.getUserById(userId);
    if (!targetUser || !targetUser.role) {
      throw new ApiError(404, "Target user not found.");
    }

    this.assertActorCanManageRole(actor, targetUser.role);
    return accessRepository.getUserScreenPermissions(userId);
  }

  async getMyScreens(actor: AuthenticatedUser) {
    const effectivePermissions = await accessControlService.getEffectivePermissions(actor);
    const screenCodes = [...new Set(effectivePermissions.filter((p) => p.isAllowed).map((p) => p.screenCode))];

    const screens = await accessRepository.getScreens(false);
    return screens.filter((screen) => screenCodes.includes(screen.sCode));
  }

  async getMyPermissions(actor: AuthenticatedUser) {
    return accessControlService.getEffectivePermissions(actor);
  }
}

export const accessService = new AccessService();
