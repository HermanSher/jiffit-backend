export type AuthenticatedUser = {
  iMasterId: number;
  username: string;
  iRoleMasterId: number | null;
  iUserTypeMasterId: number | null;
  roleCode: string | null;
  roleName: string | null;
  rolePrecedence: number | null;
  userTypeCode: string | null;
  userTypeName: string | null;
  isActive: boolean;
  employmentStatus: "ACTIVE" | "LEFT";
  sessionId?: number;
};

export type AccessTokenPayload = {
  sub: number;
  sid: number;
};

export type RefreshTokenPayload = {
  sub: number;
  sid: number;
  typ: "refresh";
};
