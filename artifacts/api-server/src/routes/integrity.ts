import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { evidenceIntegrityTable, auditLogTable, evidencePhotosTable } from "@workspace/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import {
  verifyEvidenceChain,
  verifyEvidenceImage,
  computeAuditEntryHash,
  writeAuditLog,
  sha256,
} from "../lib/integrity";

const router: IRouter = Router();

router.get("/:incidentId/integrity", async (req, res) => {
  try {
    const { incidentId } = req.params;

    const integrityRecords = await db
      .select()
      .from(evidenceIntegrityTable)
      .where(eq(evidenceIntegrityTable.incident_id, incidentId))
      .orderBy(asc(evidenceIntegrityTable.sequence_number));

    const auditEntries = await db
      .select()
      .from(auditLogTable)
      .where(eq(auditLogTable.incident_id, incidentId))
      .orderBy(asc(auditLogTable.created_at));

    const chainVerification = await verifyEvidenceChain(incidentId);

    let auditIntact = true;
    let prevHash: string | null = null;
    const auditFailures: string[] = [];

    for (const entry of auditEntries) {
      const expectedHash = computeAuditEntryHash({
        incident_id: entry.incident_id,
        evidence_photo_id: entry.evidence_photo_id,
        action: entry.action,
        actor: entry.actor,
        details: entry.details,
        previous_entry_hash: entry.previous_entry_hash,
        timestamp: entry.created_at.toISOString(),
      });
      if (expectedHash !== entry.entry_hash) {
        auditIntact = false;
        auditFailures.push(`Audit entry ${entry.id} has been altered`);
      }
      prevHash = entry.entry_hash;
    }

    const manipulationFlags = integrityRecords.filter(
      (r) => r.manipulation_risk_score != null && r.manipulation_risk_score > 0.5
    );
    const timestampAnomalies = integrityRecords.filter((r) => r.timestamp_plausible === false);
    const duplicates = integrityRecords.filter((r) => r.duplicate_risk === true);

    const overallStatus = !chainVerification.intact || !auditIntact
      ? "COMPROMISED"
      : manipulationFlags.length > 0
        ? "WARNING"
        : "VERIFIED";

    res.json({
      incident_id: incidentId,
      overall_status: overallStatus,
      chain: {
        intact: chainVerification.intact,
        total_evidence: chainVerification.total_evidence,
        verified_count: chainVerification.verified_count,
        failed_count: chainVerification.failed_count,
        failures: chainVerification.failures,
      },
      audit_log: {
        intact: auditIntact,
        total_entries: auditEntries.length,
        failures: auditFailures,
      },
      fraud_indicators: {
        manipulation_flagged_count: manipulationFlags.length,
        timestamp_anomalies: timestampAnomalies.length,
        duplicate_submissions: duplicates.length,
        manipulation_details: manipulationFlags.map((r) => ({
          evidence_photo_id: r.evidence_photo_id,
          risk_score: r.manipulation_risk_score,
          flags: r.manipulation_flags,
          assessment: r.ai_manipulation_assessment,
        })),
      },
      evidence_records: integrityRecords.map((r) => ({
        evidence_photo_id: r.evidence_photo_id,
        sequence_number: r.sequence_number,
        image_hash: r.image_hash,
        chain_hash: r.chain_hash,
        previous_chain_hash: r.previous_chain_hash,
        capture_timestamp: r.capture_timestamp,
        verification_status: r.verification_status,
        verification_note: r.verification_note,
        manipulation_risk_score: r.manipulation_risk_score,
        manipulation_flags: r.manipulation_flags,
        ai_manipulation_assessment: r.ai_manipulation_assessment,
        gps_plausible: r.gps_plausible,
        timestamp_plausible: r.timestamp_plausible,
        duplicate_risk: r.duplicate_risk,
        last_verified_at: r.last_verified_at,
      })),
      audit_entries: auditEntries.map((e) => ({
        id: e.id,
        action: e.action,
        actor: e.actor,
        details: e.details,
        entry_hash: e.entry_hash,
        created_at: e.created_at,
      })),
      verified_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Integrity check error:", err);
    res.status(500).json({ error: "Integrity check failed", message: String(err) });
  }
});

router.post("/:incidentId/integrity/verify-image", async (req, res) => {
  try {
    const { incidentId } = req.params;
    const { image_base64, evidence_photo_id } = req.body;

    if (!image_base64 || !evidence_photo_id) {
      return res.status(400).json({ error: "image_base64 and evidence_photo_id are required" });
    }

    const result = await verifyEvidenceImage(image_base64, evidence_photo_id);

    await writeAuditLog({
      incident_id: incidentId,
      evidence_photo_id,
      action: "integrity_verification",
      actor: "user",
      details: {
        match: result.match,
        computed_hash: result.computed_hash,
      },
    });

    res.json({
      verified: result.match,
      evidence_photo_id,
      stored_hash: result.stored_hash,
      computed_hash: result.computed_hash,
      result: result.match ? "HASH_MATCH — image is unaltered" : "HASH_MISMATCH — image has been modified",
    });
  } catch (err) {
    res.status(500).json({ error: "Verification failed", message: String(err) });
  }
});

router.get("/:incidentId/integrity/certificate", async (req, res) => {
  try {
    const { incidentId } = req.params;
    const chainResult = await verifyEvidenceChain(incidentId);
    const auditEntries = await db
      .select()
      .from(auditLogTable)
      .where(eq(auditLogTable.incident_id, incidentId))
      .orderBy(asc(auditLogTable.created_at));

    const lastAuditHash = auditEntries[auditEntries.length - 1]?.entry_hash ?? "NO_AUDIT";
    const allIntegrityRecords = await db
      .select({
        ph: evidenceIntegrityTable.evidence_photo_id,
        ch: evidenceIntegrityTable.chain_hash,
        seq: evidenceIntegrityTable.sequence_number,
      })
      .from(evidenceIntegrityTable)
      .where(eq(evidenceIntegrityTable.incident_id, incidentId))
      .orderBy(asc(evidenceIntegrityTable.sequence_number));

    const evidenceHashes = allIntegrityRecords.map((r) => ({
      seq: r.seq,
      evidence_photo_id: r.ph,
      chain_hash: r.ch,
    }));

    const finalChainHash = evidenceHashes[evidenceHashes.length - 1]?.chain_hash ?? "NO_EVIDENCE";
    const issuedAt = new Date().toISOString();

    const certificate = {
      certificate_type: "EVIDENCE_INTEGRITY_CERTIFICATE",
      version: "1.0",
      incident_id: incidentId,
      issued_at: issuedAt,
      chain_integrity: chainResult.intact ? "INTACT" : "COMPROMISED",
      total_evidence_items: chainResult.total_evidence,
      final_evidence_chain_hash: finalChainHash,
      final_audit_log_hash: lastAuditHash,
      certificate_hash: `sha256:${sha256(incidentId + finalChainHash + lastAuditHash + issuedAt.split("T")[0])}`,
      attestation: chainResult.intact
        ? "All evidence in this incident has been cryptographically verified. The evidence chain is intact and no tampering has been detected."
        : `INTEGRITY FAILURE: ${chainResult.failures.length} evidence item(s) failed verification. This evidence chain may have been tampered with.`,
      evidence_hashes: evidenceHashes,
    };

    res.json(certificate);
  } catch (err) {
    res.status(500).json({ error: "Certificate generation failed", message: String(err) });
  }
});

export default router;
