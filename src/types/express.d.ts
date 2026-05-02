import type { AuthenticatedUser } from "./auth";

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
      ipAddress?: string;
    }
  }
}

export {};
