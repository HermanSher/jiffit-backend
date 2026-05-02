import bcrypt from "bcryptjs";
import { authConfig } from "../config/auth.config";

const BCRYPT_PREFIX = /^\$2[aby]\$\d{2}\$/;

export function isBcryptHash(value: string): boolean {
  return BCRYPT_PREFIX.test(value);
}

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, authConfig.bcryptSaltRounds);
}

export async function verifyPassword(plainText: string, storedPassword: string): Promise<boolean> {
  if (isBcryptHash(storedPassword)) {
    return bcrypt.compare(plainText, storedPassword);
  }

  return plainText === storedPassword;
}
