import { ApiError } from "./api-error";

export type RoleScope = {
  iMasterId: number;
  sCode: string;
  sName: string;
  precedence: number;
};

const SUPER_USER_ROLE_CODE = "SU";

export function isSuperUserRole(role: Pick<RoleScope, "sCode"> | null | undefined): boolean {
  if (!role) {
    return false;
  }

  return role.sCode.trim().toUpperCase() === SUPER_USER_ROLE_CODE;
}

// Lower precedence number means higher privilege.
export function canManageRole(
  actorRole: RoleScope | null | undefined,
  targetRole: RoleScope | null | undefined,
): boolean {
  if (!actorRole || !targetRole) {
    return false;
  }

  if (isSuperUserRole(actorRole)) {
    return true;
  }

  return actorRole.precedence < targetRole.precedence;
}

export function assertCanManageRole(
  actorRole: RoleScope | null | undefined,
  targetRole: RoleScope | null | undefined,
  message: string = "You are not allowed to manage this role.",
): void {
  if (!canManageRole(actorRole, targetRole)) {
    throw new ApiError(403, message);
  }
}

export function assertValidPrecedenceNumber(precedence: number): void {
  if (!Number.isInteger(precedence) || precedence < 1) {
    throw new ApiError(400, "Role precedence must be a positive integer.");
  }
}
