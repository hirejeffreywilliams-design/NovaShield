import { db } from "@workspace/db";
import { vaultItemsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { encrypt, decrypt } from "../lib/encryption";

export interface VaultStoreParams {
  userId: string;
  data: string;
  dataType: string;
  title?: string;
  releaseConditions?: {
    type: "timed" | "manual" | "dead_man_switch";
    release_at?: string;
    check_interval_hours?: number;
  };
  trustedContacts?: string[];
}

export async function storeVaultItem(params: VaultStoreParams): Promise<{
  id: string;
  status: string;
}> {
  const { encrypted, iv } = encrypt(params.data);

  const [item] = await db
    .insert(vaultItemsTable)
    .values({
      user_id: params.userId,
      encrypted_data: encrypted,
      encryption_iv: iv,
      data_type: params.dataType,
      title: params.title || null,
      release_conditions: params.releaseConditions || null,
      trusted_contacts: params.trustedContacts || [],
      status: "sealed",
    })
    .returning();

  return { id: item.id, status: item.status };
}

export async function getVaultItem(
  itemId: string,
  userId: string
): Promise<{
  id: string;
  data_type: string;
  title: string | null;
  status: string;
  release_conditions: unknown;
  trusted_contacts: string[];
  created_at: Date;
  decrypted_data?: string;
} | null> {
  const [item] = await db
    .select()
    .from(vaultItemsTable)
    .where(and(eq(vaultItemsTable.id, itemId), eq(vaultItemsTable.user_id, userId)));

  if (!item) return null;

  let decryptedData: string | undefined;
  if (item.status === "released") {
    try {
      decryptedData = decrypt(item.encrypted_data, item.encryption_iv);
    } catch {
      decryptedData = undefined;
    }
  }

  return {
    id: item.id,
    data_type: item.data_type,
    title: item.title,
    status: item.status,
    release_conditions: item.release_conditions,
    trusted_contacts: item.trusted_contacts || [],
    created_at: item.created_at,
    decrypted_data: decryptedData,
  };
}

export async function listVaultItems(userId: string): Promise<Array<{
  id: string;
  data_type: string;
  title: string | null;
  status: string;
  created_at: Date;
}>> {
  const items = await db
    .select({
      id: vaultItemsTable.id,
      data_type: vaultItemsTable.data_type,
      title: vaultItemsTable.title,
      status: vaultItemsTable.status,
      created_at: vaultItemsTable.created_at,
    })
    .from(vaultItemsTable)
    .where(eq(vaultItemsTable.user_id, userId))
    .orderBy(vaultItemsTable.created_at);

  return items;
}

export async function releaseVaultItem(itemId: string, userId: string): Promise<{
  success: boolean;
  data?: string;
  error?: string;
}> {
  const [item] = await db
    .select()
    .from(vaultItemsTable)
    .where(and(eq(vaultItemsTable.id, itemId), eq(vaultItemsTable.user_id, userId)));

  if (!item) return { success: false, error: "Item not found" };
  if (item.status === "released") return { success: false, error: "Item already released" };

  let decryptedData: string;
  try {
    decryptedData = decrypt(item.encrypted_data, item.encryption_iv);
  } catch {
    return { success: false, error: "Decryption failed" };
  }

  await db
    .update(vaultItemsTable)
    .set({ status: "released", released_at: new Date(), updated_at: new Date() })
    .where(eq(vaultItemsTable.id, itemId));

  return { success: true, data: decryptedData };
}

export async function checkTimedReleases(): Promise<number> {
  const now = new Date();
  const items = await db
    .select()
    .from(vaultItemsTable)
    .where(eq(vaultItemsTable.status, "sealed"));

  let releasedCount = 0;
  for (const item of items) {
    const conditions = item.release_conditions as { type: string; release_at?: string } | null;
    if (conditions?.type === "timed" && conditions.release_at) {
      const releaseDate = new Date(conditions.release_at);
      if (now >= releaseDate) {
        await db
          .update(vaultItemsTable)
          .set({ status: "released", released_at: now, updated_at: now })
          .where(eq(vaultItemsTable.id, item.id));
        releasedCount++;
      }
    }
  }

  return releasedCount;
}
