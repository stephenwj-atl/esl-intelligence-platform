import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, sessionsTable, usersTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  totpEnabled: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const SESSION_SECRET: string = process.env.SESSION_SECRET ?? "";
if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required for secure session management");
}

export const SESSION_TIMEOUT_HOURS = parseInt(process.env.SESSION_TIMEOUT_HOURS || "8", 10);

export function getSessionSecret(): string {
  return SESSION_SECRET;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const path = req.path;
  if (path === "/healthz" || path.startsWith("/auth/")) {
    next();
    return;
  }

  const token = req.cookies?.session_token || req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(token, SESSION_SECRET as string) as unknown as { sessionId: number; userId: number };

    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(
        and(
          eq(sessionsTable.id, payload.sessionId),
          eq(sessionsTable.userId, payload.userId),
          gt(sessionsTable.expiresAt, new Date())
        )
      );

    if (!session) {
      res.status(401).json({ message: "Session expired or invalid" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    if (!user.totpEnabled) {
      res.status(403).json({
        message: "Two-factor authentication setup required",
        requiresTotpSetup: true,
      });
      return;
    }

    if (!session.twoFactorVerified) {
      res.status(403).json({
        message: "Two-factor authentication required",
        requiresTwoFactor: true,
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      totpEnabled: user.totpEnabled,
    };

    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    next();
  };
}
