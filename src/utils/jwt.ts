import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { authConfig } from "../config/auth.config";
import { AccessTokenPayload, RefreshTokenPayload } from "../types/auth";

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, authConfig.accessTokenSecret(), {
    expiresIn: authConfig.accessTokenTtl as jwt.SignOptions["expiresIn"],
  });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, authConfig.refreshTokenSecret(), {
    expiresIn: authConfig.refreshTokenTtl as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, authConfig.accessTokenSecret()) as unknown as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, authConfig.refreshTokenSecret()) as unknown as RefreshTokenPayload;
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
