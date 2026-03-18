import crypto from "crypto";
import { db } from "@workspace/db";
import { auditLogTable, evidenceIntegrityTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

export function sha256(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

export function computeImageHash(image_base64: string): string {
  return sha256("image:" + image_base64);
}

export function computeMetadataHash(params: {
  incident_id: string;
  source: string;
  capture_timestamp: string;
  gps_lat?: number | null;
  gps_lon?: number | null;
}): string {
  const canonical = JSON.stringify({
    incident_id: params.incident_id,
    source: params.source,
    capture_timestamp: params.capture_timestamp,
    gps_lat: params.gps_lat ?? null,
    gps_lon: params.gps_lon ?? null,
  });
  return sha256("metadata:" + canonical);
}

export function computeChainHash(params: {
  image_hash: string;
  metadata_hash: string;
  previous_chain_hash: string | null;
  sequence_number: number;
}): string {
  const canonical = JSON.stringify({
    image_hash: params.image_hash,
    metadata_hash: params.metadata_hash,
    previous_chain_hash: params.previous_chain_hash ?? "GENESIS",
    sequence_number: params.sequence_number,
  });
  return sha256("chain:" + canonical);
}

export function computeAuditEntryHash(params: {
  incident_id: string | null | undefined;
  evidence_photo_id: string | null | undefined;
  action: string;
  actor: string;
  details: any;
  previous_entry_hash: string | null;
  timestamp: string;
}): string {
  const canonical = JSON.stringify({
    incident_id: params.incident_id ?? null,
    evidence_photo_id: params.evidence_photo_id ?? null,
    action: params.action,
    actor: params.actor,
    details: params.details ?? null,
    previous_entry_hash: params.previous_entry_hash ?? "GENESIS",
    timestamp: params.timestamp,
  });
  return sha256("audit:" + canonical);
}

export async function getLastChainHash(incident_id: string): Promise<{ hash: string | null; sequence: number }> {
  const rows = await db
    .select({ chain_hash: evidenceIntegrityTable.chain_hash, seq: evidenceIntegrityTable.sequence_number })
    .from(evidenceIntegrityTable)
    .where(eq(evidenceIntegrityTable.incident_id, incident_id))
    .orderBy(desc(evidenceIntegrityTable.sequence_number))
    .limit(1);
  if (rows.length === 0) return { hash: null, sequence: 0 };
  return { hash: rows[0].chain_hash, sequence: rows[0].seq + 1 };
}

export async function getLastAuditHash(incident_id: string): Promise<string | null> {
  const rows = await db
    .select({ entry_hash: auditLogTable.entry_hash })
    .from(auditLogTable)
    .where(eq(auditLogTable.incident_id, incident_id))
    .orderBy(desc(auditLogTable.created_at))
    .limit(1);
  return rows[0]?.entry_hash ?? null;
}

export async function writeAuditLog(params: {
  incident_id?: string | null;
  evidence_photo_id?: string | null;
  action: string;
  actor?: string;
  details?: any;
}): Promise<void> {
  const timestamp = new Date().toISOString();
  const prevHash = params.incident_id ? await getLastAuditHash(params.incident_id) : null;
  const entryHash = computeAuditEntryHash({
    incident_id: params.incident_id,
    evidence_photo_id: params.evidence_photo_id,
    action: params.action,
    actor: params.actor || "system",
    details: params.details,
    previous_entry_hash: prevHash,
    timestamp,
  });

  await db.insert(auditLogTable).values({
    incident_id: params.incident_id ?? null,
    evidence_photo_id: params.evidence_photo_id ?? null,
    action: params.action,
    actor: params.actor || "system",
    details: params.details ?? null,
    previous_entry_hash: prevHash,
    entry_hash: entryHash,
  });
}

export function checkTimestampPlausibility(captureTimestamp: Date): { plausible: boolean; note: string | null } {
  const now = new Date();
  const diffMs = now.getTime() - captureTimestamp.getTime();
  const diffMinutes = diffMs / 60000;

  if (diffMs < -5 * 60000) {
    return { plausible: false, note: `Timestamp is ${Math.abs(Math.round(diffMinutes))} minutes in the future — possible clock manipulation` };
  }
  if (diffMs > 7 * 24 * 60 * 60000) {
    return { plausible: false, note: `Timestamp is more than 7 days old — possible timestamp backdating` };
  }
  return { plausible: true, note: null };
}

export async function checkDuplicateRisk(incident_id: string, image_hash: string): Promise<boolean> {
  const existing = await db
    .select({ id: evidenceIntegrityTable.id })
    .from(evidenceIntegrityTable)
    .where(eq(evidenceIntegrityTable.incident_id, incident_id));

  return existing.some((r: any) => {
    if (r.image_hash === image_hash) return true;
    return false;
  });
}

export async function verifyEvidenceChain(incident_id: string): Promise<{
  intact: boolean;
  total_evidence: number;
  verified_count: number;
  failed_count: number;
  failures: Array<{ evidence_photo_id: string; reason: string }>;
}> {
  const records = await db
    .select()
    .from(evidenceIntegrityTable)
    .where(eq(evidenceIntegrityTable.incident_id, incident_id))
    .orderBy(evidenceIntegrityTable.sequence_number);

  const failures: Array<{ evidence_photo_id: string; reason: string }> = [];
  let prevChainHash: string | null = null;

  for (const rec of records) {
    const expectedChainHash = computeChainHash({
      image_hash: rec.image_hash,
      metadata_hash: rec.metadata_hash,
      previous_chain_hash: prevChainHash,
      sequence_number: rec.sequence_number,
    });

    if (expectedChainHash !== rec.chain_hash) {
      failures.push({
        evidence_photo_id: rec.evidence_photo_id,
        reason: "Chain hash mismatch — evidence record was modified after capture",
      });
    }

    if (rec.previous_chain_hash !== prevChainHash) {
      failures.push({
        evidence_photo_id: rec.evidence_photo_id,
        reason: "Previous chain link broken — evidence order may have been tampered with",
      });
    }

    prevChainHash = rec.chain_hash;
  }

  return {
    intact: failures.length === 0,
    total_evidence: records.length,
    verified_count: records.length - failures.length,
    failed_count: failures.length,
    failures,
  };
}

export async function verifyEvidenceImage(
  image_base64: string,
  evidence_photo_id: string
): Promise<{ match: boolean; stored_hash: string | null; computed_hash: string }> {
  const computedHash = computeImageHash(image_base64);
  const rows = await db
    .select({ image_hash: evidenceIntegrityTable.image_hash })
    .from(evidenceIntegrityTable)
    .where(eq(evidenceIntegrityTable.evidence_photo_id, evidence_photo_id))
    .limit(1);

  const storedHash = rows[0]?.image_hash ?? null;
  return {
    match: storedHash === computedHash,
    stored_hash: storedHash,
    computed_hash: computedHash,
  };
}
