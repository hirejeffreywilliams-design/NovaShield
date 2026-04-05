import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "novashield-dev-secret-change-in-production";

interface TokenPayload {
  userId: string;
  role: string;
  email: string;
}

export function generateToken(payload: TokenPayload): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 86400000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const [header, body, signature] = token.split(".");
    const expectedSig = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) { (req as any).user = null; next(); return; }
  const payload = verifyToken(token);
  (req as any).user = payload;
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!(req as any).user) { res.status(401).json({ error: "Authentication required" }); return; }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user) { res.status(401).json({ error: "Authentication required" }); return; }
    if (!roles.includes(user.role)) { res.status(403).json({ error: "Insufficient permissions" }); return; }
    next();
  };
}
