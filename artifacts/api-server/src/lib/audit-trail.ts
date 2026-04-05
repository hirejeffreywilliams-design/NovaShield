import { db } from "@workspace/db";
import { accessAuditLogTable } from "@workspace/db/schema";
import type { Request } from "express";

export interface AuditEntry {
  user_id: string | null;
  action: string;
  resource: string;
  resource_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  details?: Record<string, unknown> | null;
}

export async function logAccess(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(accessAuditLogTable).values({
      user_id: entry.user_id,
      action: entry.action,
      resource: entry.resource,
      resource_id: entry.resource_id || null,
      ip_address: entry.ip_address || null,
      user_agent: entry.user_agent || null,
      details: entry.details || null,
    });
  } catch (err) {
    console.error("[AuditTrail] Failed to log access:", err);
  }
}

export function extractRequestMeta(req: Request): { ip_address: string | null; user_agent: string | null } {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket?.remoteAddress || null;
  const ua = (req.headers["user-agent"] as string) || null;
  return { ip_address: ip, user_agent: ua };
}

export async function logRouteAccess(
  req: Request,
  action: string,
  resource: string,
  resourceId?: string | null,
  details?: Record<string, unknown> | null
): Promise<void> {
  const userId = (req as any).user?.userId || null;
  const { ip_address, user_agent } = extractRequestMeta(req);
  await logAccess({
    user_id: userId,
    action,
    resource,
    resource_id: resourceId,
    ip_address,
    user_agent,
    details,
  });
}
