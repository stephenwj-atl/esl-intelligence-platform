import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { TOTP, generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import { db, usersTable, sessionsTable, auditLogsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { getSessionSecret, SESSION_TIMEOUT_HOURS } from "../middleware/auth";
import { encrypt, decrypt } from "../lib/encryption";

const router: IRouter = Router();

const SALT_ROUNDS = 12;

async function validateActiveSession(token: string): Promise<{ sessionId: number; userId: number; session: typeof sessionsTable.$inferSelect } | null> {
  try {
    const payload = jwt.verify(token, getSessionSecret()) as { sessionId: number; userId: number };
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
    if (!session) return null;
    return { sessionId: payload.sessionId, userId: payload.userId, session };
  } catch {
    return null;
  }
}

function createSessionToken(sessionId: number, userId: number): string {
  return jwt.sign({ sessionId, userId }, getSessionSecret(), { expiresIn: `${SESSION_TIMEOUT_HOURS}h` });
}

router.post("/auth/register", async (req, res) => {
  const { email, password, role, adminSecret } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ message: "Password must be at least 8 characters" });
    return;
  }

  let userRole = "Analyst";

  if (role && role !== "Analyst") {
    const token = req.cookies?.session_token || req.headers.authorization?.replace("Bearer ", "");
    let isAdmin = false;

    if (token) {
      try {
        const payload = jwt.verify(token, getSessionSecret()) as { userId: number };
        const [requestingUser] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));
        if (requestingUser?.role === "Admin") {
          isAdmin = true;
        }
      } catch {}
    }

    if (!isAdmin && adminSecret && process.env.ADMIN_BOOTSTRAP_SECRET && adminSecret === process.env.ADMIN_BOOTSTRAP_SECRET) {
      isAdmin = true;
    }

    const validRoles = ["Analyst", "Investment Officer", "Admin"];
    if (isAdmin && validRoles.includes(role)) {
      userRole = role;
    }
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existing) {
    res.status(409).json({ message: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [user] = await db.insert(usersTable).values({
    email: email.toLowerCase(),
    passwordHash,
    role: userRole,
  }).returning();

  await db.insert(auditLogsTable).values({
    action: "User Registered",
    user: email.toLowerCase(),
    details: `New user registered with role: ${userRole}`,
  });

  res.status(201).json({
    id: user.id,
    email: user.email,
    role: user.role,
    totpEnabled: user.totpEnabled,
  });
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (!user) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_HOURS * 60 * 60 * 1000);

  const [session] = await db.insert(sessionsTable).values({
    userId: user.id,
    token: jwt.sign({ random: Math.random() }, getSessionSecret()),
    expiresAt,
    twoFactorVerified: !user.totpEnabled,
  }).returning();

  const token = createSessionToken(session.id, user.id);

  await db.update(usersTable).set({ lastLogin: new Date() }).where(eq(usersTable.id, user.id));

  await db.insert(auditLogsTable).values({
    action: "User Login",
    user: user.email,
    details: `Login from ${req.ip || "unknown"}`,
  });

  res.cookie("session_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TIMEOUT_HOURS * 60 * 60 * 1000,
    path: "/",
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      totpEnabled: user.totpEnabled,
    },
    requiresTwoFactor: user.totpEnabled,
  });
});

router.post("/auth/totp/setup", async (req, res) => {
  const token = req.cookies?.session_token || req.headers.authorization?.replace("Bearer ", "");
  if (!token) { res.status(401).json({ message: "Authentication required" }); return; }

  const validated = await validateActiveSession(token);
  if (!validated) { res.status(401).json({ message: "Session expired or invalid" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, validated.userId));
  if (!user) { res.status(404).json({ message: "User not found" }); return; }

  if (user.totpEnabled && !validated.session.twoFactorVerified) {
    res.status(403).json({ message: "Must complete existing 2FA verification before resetting TOTP" });
    return;
  }

  const { password } = req.body;
  if (password) {
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ message: "Invalid password" });
      return;
    }
  }

  const secret = generateSecret();
  const otpauth = generateURI({ issuer: "ESL Intelligence", label: user.email, secret, algorithm: "sha1", digits: 6, period: 30 });
  const qrCode = await QRCode.toDataURL(otpauth);

  const encryptedSecret = encrypt(secret);
  await db.update(usersTable).set({ totpSecret: encryptedSecret }).where(eq(usersTable.id, user.id));

  await db.insert(auditLogsTable).values({
    action: "TOTP Setup",
    user: user.email,
    details: user.totpEnabled ? "TOTP secret reset" : "TOTP setup initiated",
  });

  res.json({ qrCode, secret, otpauth });
});

router.post("/auth/totp/verify", async (req, res) => {
  const { code } = req.body;
  const token = req.cookies?.session_token || req.headers.authorization?.replace("Bearer ", "");

  if (!token || !code) {
    res.status(400).json({ message: "Token and code are required" });
    return;
  }

  const validated = await validateActiveSession(token);
  if (!validated) { res.status(401).json({ message: "Session expired or invalid" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, validated.userId));

  if (!user || !user.totpSecret) {
    res.status(400).json({ message: "TOTP not configured for this user" });
    return;
  }

  const decryptedSecret = decrypt(user.totpSecret);
  const isValid = verifySync({ token: code, secret: decryptedSecret });

  if (!isValid) {
    res.status(401).json({ message: "Invalid TOTP code" });
    return;
  }

  if (!user.totpEnabled) {
    await db.update(usersTable).set({ totpEnabled: true }).where(eq(usersTable.id, user.id));
  }

  await db.update(sessionsTable)
    .set({ twoFactorVerified: true })
    .where(eq(sessionsTable.id, validated.sessionId));

  await db.insert(auditLogsTable).values({
    action: "TOTP Verified",
    user: user.email,
    details: "Two-factor authentication verified",
  });

  res.json({ verified: true });
});

router.post("/auth/logout", async (req, res) => {
  const token = req.cookies?.session_token || req.headers.authorization?.replace("Bearer ", "");

  if (token) {
    try {
      const payload = jwt.verify(token, getSessionSecret()) as { sessionId: number; userId: number };
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));

      await db.delete(sessionsTable).where(eq(sessionsTable.id, payload.sessionId));

      if (user) {
        await db.insert(auditLogsTable).values({
          action: "User Logout",
          user: user.email,
          details: "User logged out",
        });
      }
    } catch {
    }
  }

  res.clearCookie("session_token", { path: "/" });
  res.json({ message: "Logged out" });
});

router.get("/auth/me", async (req, res) => {
  const token = req.cookies?.session_token || req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  try {
    const payload = jwt.verify(token, getSessionSecret()) as { sessionId: number; userId: number };

    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(
        and(
          eq(sessionsTable.id, payload.sessionId),
          gt(sessionsTable.expiresAt, new Date())
        )
      );

    if (!session) {
      res.status(401).json({ message: "Session expired" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      totpEnabled: user.totpEnabled,
      twoFactorVerified: session.twoFactorVerified,
    });
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
});

export default router;
