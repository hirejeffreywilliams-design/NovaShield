import { Router, type IRouter } from "express";
import { z } from "zod";
import {
  createUser,
  findUserByEmail,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  createSession,
  verifyRefreshToken,
  hashToken,
  findSessionByTokenHash,
  revokeSession,
  type TokenPayload,
  type UserRole,
} from "../lib/auth";
import { authenticate } from "../middlewares/auth";

const router: IRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  display_name: z.string().min(1).max(100).optional(),
  role: z.enum(["reporter", "auditor", "admin"]).default("reporter"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

router.post("/register", async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    }

    const { email, password, display_name, role } = parsed.data;

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const user = await createUser(email, password, role as UserRole, display_name);

    const payload: TokenPayload = { userId: user.id, email: user.email, role: user.role as UserRole };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await createSession(user.id, refreshToken);

    res.status(201).json({
      user: { id: user.id, email: user.email, role: user.role, display_name: user.display_name },
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    }

    const { email, password } = parsed.data;
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const payload: TokenPayload = { userId: user.id, email: user.email, role: user.role as UserRole };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await createSession(user.id, refreshToken);

    res.json({
      user: { id: user.id, email: user.email, role: user.role, display_name: user.display_name },
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "refresh_token is required" });
    }

    const { refresh_token } = parsed.data;
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(refresh_token);
    } catch {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    const tokenHash = hashToken(refresh_token);
    const session = await findSessionByTokenHash(tokenHash);
    if (!session) {
      return res.status(401).json({ error: "Session not found or revoked" });
    }

    if (new Date() > session.expires_at) {
      await revokeSession(tokenHash);
      return res.status(401).json({ error: "Session expired" });
    }

    await revokeSession(tokenHash);

    const newPayload: TokenPayload = { userId: payload.userId, email: payload.email, role: payload.role };
    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    await createSession(payload.userId, newRefreshToken);

    res.json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

router.post("/logout", authenticate, async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (refresh_token) {
      const tokenHash = hashToken(refresh_token);
      await revokeSession(tokenHash);
    }
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Logout failed" });
  }
});

router.get("/me", authenticate, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
