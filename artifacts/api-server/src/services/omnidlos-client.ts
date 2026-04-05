import { db } from "@workspace/db";
import { ecosystemLinksTable, syncedAchievementsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const BRIDGE_URL = process.env["OMNIDLOS_BRIDGE_URL"] || "https://bridge.4everacy.io";
const BRIDGE_API_KEY = process.env["OMNIDLOS_BRIDGE_API_KEY"] || "";

interface BridgeResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

async function bridgeRequest(path: string, method: string, body?: unknown): Promise<BridgeResponse> {
  try {
    const response = await fetch(`${BRIDGE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${BRIDGE_API_KEY}`,
        "X-Client-App": "novashield",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      return { success: false, error: `Bridge returned ${response.status}` };
    }

    const data = await response.json() as Record<string, unknown>;
    return { success: true, data };
  } catch (err) {
    return { success: false, error: `Bridge connection failed: ${String(err)}` };
  }
}

export async function registerWithBridge(userId: string): Promise<BridgeResponse> {
  const result = await bridgeRequest("/api/v1/register", "POST", {
    app_id: "novashield",
    user_id: userId,
    capabilities: ["accountability", "evidence_integrity", "pattern_detection"],
  });

  if (result.success && result.data) {
    await db.insert(ecosystemLinksTable).values({
      user_id: userId,
      bridge_id: String(result.data.bridge_id || ""),
      ecosystem_user_id: String(result.data.ecosystem_user_id || ""),
      status: "active",
      metadata: result.data,
      linked_at: new Date(),
    });
  }

  return result;
}

export async function getEcosystemContext(userId: string): Promise<BridgeResponse> {
  const [link] = await db
    .select()
    .from(ecosystemLinksTable)
    .where(and(eq(ecosystemLinksTable.user_id, userId), eq(ecosystemLinksTable.status, "active")));

  if (!link) {
    return { success: false, error: "No active ecosystem link found" };
  }

  return bridgeRequest(`/api/v1/context/${link.ecosystem_user_id}`, "GET");
}

export async function syncAchievements(userId: string): Promise<{
  success: boolean;
  synced_count: number;
  error?: string;
}> {
  const [link] = await db
    .select()
    .from(ecosystemLinksTable)
    .where(and(eq(ecosystemLinksTable.user_id, userId), eq(ecosystemLinksTable.status, "active")));

  if (!link) {
    return { success: false, synced_count: 0, error: "No active ecosystem link" };
  }

  const result = await bridgeRequest(`/api/v1/achievements/${link.ecosystem_user_id}`, "GET");
  if (!result.success || !result.data) {
    return { success: false, synced_count: 0, error: result.error };
  }

  const achievements = (result.data.achievements as Array<{
    id: string;
    type: string;
    title: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }>) || [];

  let syncedCount = 0;
  for (const achievement of achievements) {
    const existing = await db
      .select()
      .from(syncedAchievementsTable)
      .where(and(
        eq(syncedAchievementsTable.user_id, userId),
        eq(syncedAchievementsTable.achievement_id, achievement.id)
      ));

    if (existing.length === 0) {
      await db.insert(syncedAchievementsTable).values({
        user_id: userId,
        achievement_type: achievement.type,
        achievement_id: achievement.id,
        title: achievement.title,
        description: achievement.description || null,
        metadata: achievement.metadata || null,
      });
      syncedCount++;
    }
  }

  return { success: true, synced_count: syncedCount };
}

export async function contributeMomentum(userId: string, contribution: {
  type: string;
  value: number;
  context?: string;
}): Promise<BridgeResponse> {
  const [link] = await db
    .select()
    .from(ecosystemLinksTable)
    .where(and(eq(ecosystemLinksTable.user_id, userId), eq(ecosystemLinksTable.status, "active")));

  if (!link) {
    return { success: false, error: "No active ecosystem link" };
  }

  return bridgeRequest("/api/v1/momentum/contribute", "POST", {
    ecosystem_user_id: link.ecosystem_user_id,
    app_id: "novashield",
    contribution,
  });
}
