import { ApiError } from "../utils/api-error";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new ApiError(500, `${name} is not configured.`);
  }

  return value;
}

function parseIntEnv(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (!raw) {
    return defaultValue;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return defaultValue;
  }

  return parsed;
}

export const authConfig = {
  accessTokenSecret: () => requireEnv("JWT_ACCESS_SECRET"),
  refreshTokenSecret: () => requireEnv("JWT_REFRESH_SECRET"),
  accessTokenTtl: process.env.JWT_ACCESS_TTL ?? "15m",
  refreshTokenTtl: process.env.JWT_REFRESH_TTL ?? "30d",
  refreshSessionDays: parseIntEnv("REFRESH_SESSION_DAYS", 30),
  bcryptSaltRounds: parseIntEnv("BCRYPT_SALT_ROUNDS", 12),
};
