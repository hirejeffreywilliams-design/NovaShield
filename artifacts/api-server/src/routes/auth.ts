import { Router, type IRouter } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { generateToken } from "../middlewares/auth";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString("hex"));
    });
  });
}

router.post("/register", async (req, res): Promise<void> => {
  try {
    const { email, username, password, full_name, role, department_id } = req.body;
    if (!email || !password || !full_name || !username) {
      res.status(400).json({ error: "email, username, password, and full_name are required" });
      return;
    }

    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const hash = await hashPassword(password, salt);
    const password_hash = `${salt}:${hash}`;

    const [user] = await db
      .insert(usersTable)
      .values({
        email,
        username,
        password_hash,
        full_name,
        role: role || "citizen",
        department_id: department_id || null,
      })
      .returning();

    const token = generateToken({ userId: user.id, role: user.role, email: user.email });

    res.status(201).json({
      user: { id: user.id, email: user.email, username: user.username, full_name: user.full_name, role: user.role, department_id: user.department_id },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to register user", message: String(err) });
  }
});

router.post("/login", async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const [salt, storedHash] = user.password_hash.split(":");
    const hash = await hashPassword(password, salt);
    if (hash !== storedHash) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = generateToken({ userId: user.id, role: user.role, email: user.email });

    res.json({
      user: { id: user.id, email: user.email, username: user.username, full_name: user.full_name, role: user.role, department_id: user.department_id },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to login", message: String(err) });
  }
});

router.get("/me", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      department_id: user.department_id,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get profile", message: String(err) });
  }
});

router.put("/me", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { full_name, department_id, avatar_url } = req.body;

    const [updated] = await db
      .update(usersTable)
      .set({ full_name, department_id, avatar_url, updated_at: new Date() })
      .where(eq(usersTable.id, userId))
      .returning();
    if (!updated) { res.status(404).json({ error: "User not found" }); return; }

    res.json({
      id: updated.id,
      email: updated.email,
      username: updated.username,
      full_name: updated.full_name,
      role: updated.role,
      department_id: updated.department_id,
      avatar_url: updated.avatar_url,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile", message: String(err) });
  }
});

export default router;
