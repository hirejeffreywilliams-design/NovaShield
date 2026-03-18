import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  evidencePhotosTable,
  evidenceIntegrityTable,
  policyKnowledgeTable,
  analysisResultsTable,
} from "@workspace/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  computeImageHash,
  computeMetadataHash,
  computeChainHash,
  getLastChainHash,
  getLastAuditHash,
  writeAuditLog,
  checkTimestampPlausibility,
  checkDuplicateRisk,
  computeAuditEntryHash,
  sha256,
} from "../lib/integrity";

const router: IRouter = Router();

async function fetchPolicyContext(stateCode?: string | null): Promise<{
  contextText: string;
  policyIds: string[];
}> {
  try {
    const federal = await db
      .select()
      .from(policyKnowledgeTable)
      .where(
        and(
          eq(policyKnowledgeTable.jurisdiction_type, "federal"),
          inArray(policyKnowledgeTable.policy_type, ["case_law", "statute", "visual_pattern"])
        )
      )
      .limit(10);

    let statePolicies: typeof federal = [];
    if (stateCode) {
      statePolicies = await db
        .select()
        .from(policyKnowledgeTable)
        .where(eq(policyKnowledgeTable.state_code, stateCode.toUpperCase()))
        .limit(5);
    }

    const patterns = await db
      .select()
      .from(policyKnowledgeTable)
      .where(eq(policyKnowledgeTable.policy_type, "visual_pattern"))
      .limit(4);

    const allPolicies = [...federal, ...statePolicies, ...patterns];
    const unique = Array.from(new Map(allPolicies.map((p) => [p.id, p])).values());

    if (unique.length === 0) return { contextText: "", policyIds: [] };

    const lines: string[] = [
      `=== SHIELD INTELLIGENCE ENGINE — POLICY CONTEXT ===`,
      `Jurisdiction: ${stateCode ? stateCode.toUpperCase() + " (State)" : "Federal only"}`,
      `Policies loaded: ${unique.length}`,
      ``,
      `Use the following legal standards and visual violation patterns when analyzing this image.`,
      `For each potential_concern you identify, cite the most applicable legal authority.`,
      ``,
    ];

    for (const p of unique) {
      lines.push(`--- [${p.category.toUpperCase()}] ${p.title} ---`);
      lines.push(p.content);
      if (p.legal_authority) lines.push(`Legal Authority: ${p.legal_authority}`);
      lines.push("");
    }

    lines.push(`=== END POLICY CONTEXT ===`);
    lines.push(`Now analyze the submitted image using the above standards.`);

    return {
      contextText: lines.join("\n"),
      policyIds: unique.map((p) => p.id),
    };
  } catch {
    return { contextText: "", policyIds: [] };
  }
}

const STRUCTURED_ANALYSIS_PROMPT = `You are an expert forensic scene analyst and digital forensics specialist for civil rights accountability documentation. Produce a highly accurate, structured JSON analysis of this image.

ACCURACY IS PARAMOUNT:
- Count every visible human individually and carefully
- Distinguish law enforcement from civilians based ONLY on visible evidence (uniform, badge, vehicle markings)
- Report confidence scores honestly — poor visibility means lower confidence
- Never infer what you cannot directly see
- Actively flag potential false reading risks

MANIPULATION DETECTION:
You must also analyze whether this image shows signs of digital manipulation or AI generation. Check for:
- Cloning/copy-paste artifacts, repeating texture patterns
- Inconsistent lighting or shadows between objects/people
- Unnatural edges, halos, or blending artifacts
- AI generation tells: unnaturally smooth skin, odd fingers/hands, impossible geometry
- JPEG/compression artifacts inconsistent with claimed quality
- Metadata inconsistencies visible within the image (e.g., watermarks from different dates)
- Missing natural camera noise or motion blur that should be present given the scene

Return ONLY valid JSON with this exact schema. No markdown, no text outside the JSON:

{
  "persons": [
    {
      "person_id": 1,
      "role": "law_enforcement | civilian | unknown",
      "description": "detailed physical description",
      "clothing": "detailed clothing description",
      "visible_badge_number": "exact text if visible, or null",
      "visible_name_tag": "exact text if visible, or null",
      "apparent_rank": "if discernible, or null",
      "position": "standing | seated | prone | moving | crouching | other",
      "action": "what this person is doing",
      "is_armed": true,
      "visible_weapons": ["list each visible weapon/tool"],
      "confidence": 0.95,
      "confidence_notes": "specific reason for this confidence level"
    }
  ],
  "vehicles": [
    {
      "vehicle_id": 1,
      "type": "police_cruiser | unmarked_police | suv | motorcycle | van | civilian | other",
      "unit_number": "exact text visible, or null",
      "license_plate": "exact plate text if readable, or null",
      "department_markings": "full text of department name/logo, or null",
      "color": "color description",
      "make_model": "if identifiable, or null",
      "confidence": 0.90,
      "confidence_notes": "reason for this confidence level"
    }
  ],
  "objects_of_interest": [
    {
      "type": "firearm | taser | baton | handcuffs | phone | camera | barrier | sign | other",
      "description": "specific object description",
      "location_in_scene": "where in the frame",
      "associated_person_id": 1,
      "confidence": 0.85
    }
  ],
  "scene": {
    "location_type": "street | parking_lot | highway | residential | commercial | indoor | other",
    "lighting_conditions": "daylight_bright | daylight_overcast | dusk_dawn | artificial_good | artificial_poor | nighttime_poor",
    "camera_angle": "description of angle and distance",
    "image_quality": "clear | partially_obstructed | blurry | low_resolution | multiple_issues",
    "obstructions": ["obstructions affecting visibility"],
    "visible_landmarks": ["street signs, building numbers, identifiers"],
    "time_of_day_estimate": "estimate based on lighting, or null"
  },
  "counts": {
    "total_persons": 0,
    "total_law_enforcement": 0,
    "total_civilians": 0,
    "total_unknown_role": 0,
    "total_vehicles": 0,
    "total_police_vehicles": 0,
    "total_objects_of_interest": 0
  },
  "analysis_confidence": {
    "overall_score": 0.85,
    "person_count_confidence": 0.95,
    "vehicle_count_confidence": 0.90,
    "id_extraction_confidence": 0.75,
    "factors_reducing_confidence": ["specific factors: blur, angle, distance, obstruction"],
    "factors_increasing_confidence": ["specific factors: lighting, clear markings, close range"]
  },
  "manipulation_assessment": {
    "risk_score": 0.05,
    "is_likely_manipulated": false,
    "is_likely_ai_generated": false,
    "indicators": ["list any detected manipulation artifacts — empty array if none"],
    "ai_generation_artifacts": ["list any AI generation tells — empty array if none"],
    "lighting_consistency": "consistent | minor_inconsistencies | major_inconsistencies",
    "compression_artifacts": "normal | suspicious | heavy_re_encoding",
    "confidence": 0.90,
    "assessment": "2-3 sentence plain language assessment of image authenticity"
  },
  "potential_concerns": [
    {
      "type": "excessive_force | unreasonable_search | disproportionate_response | constitutional_concern | use_of_force | other",
      "description": "specific observable description — only what is VISIBLE",
      "severity": "low | medium | high",
      "applicable_amendment": "1st | 4th | 5th | 8th | 14th | null"
    }
  ],
  "false_reading_risks": [
    "specific risks that could cause misidentification in this image"
  ],
  "evidence_summary": "2-3 sentence plain-language summary suitable for an official report"
}`;

router.post("/:id/analyze-image", async (req, res) => {
  try {
    const { image_base64, source = "camera", gps_lat, gps_lon, state_code } = req.body;
    if (!image_base64) {
      return res.status(400).json({ error: "image_base64 is required" });
    }

    const { contextText, policyIds } = await fetchPolicyContext(state_code || null);

    const captureTimestamp = new Date();

    const imageHash = computeImageHash(image_base64);
    const metadataHash = computeMetadataHash({
      incident_id: req.params.id,
      source,
      capture_timestamp: captureTimestamp.toISOString(),
      gps_lat: gps_lat ?? null,
      gps_lon: gps_lon ?? null,
    });

    const { hash: prevChainHash, sequence: seqNumber } = await getLastChainHash(req.params.id);
    const chainHash = computeChainHash({
      image_hash: imageHash,
      metadata_hash: metadataHash,
      previous_chain_hash: prevChainHash,
      sequence_number: seqNumber,
    });

    const timestampCheck = checkTimestampPlausibility(captureTimestamp);
    const isDuplicate = await checkDuplicateRisk(req.params.id, imageHash);

    const messageContent: any[] = [{ type: "text", text: STRUCTURED_ANALYSIS_PROMPT }];
    if (contextText) {
      messageContent.push({ type: "text", text: contextText });
    }
    messageContent.push({
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${image_base64}`,
        detail: "high",
      },
    });

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: messageContent }],
    });

    const rawContent = aiResponse.choices[0]?.message?.content || "{}";
    let sceneAnalysis: any = {};
    try {
      sceneAnalysis = JSON.parse(rawContent);
    } catch {
      sceneAnalysis = { parse_error: true, raw: rawContent };
    }

    const counts = sceneAnalysis.counts || {};
    const manipulation = sceneAnalysis.manipulation_assessment || {};
    const firstVehicle = sceneAnalysis.vehicles?.[0] || {};
    const lawEnforcementPersons = (sceneAnalysis.persons || []).filter((p: any) => p.role === "law_enforcement");
    const firstOfficer = lawEnforcementPersons[0] || {};
    const overallConfidence = sceneAnalysis.analysis_confidence?.overall_score ?? null;
    const manipulationRisk = manipulation.risk_score ?? 0;

    let verificationStatus = "verified";
    const verificationNotes: string[] = [];

    if (!timestampCheck.plausible && timestampCheck.note) {
      verificationStatus = "warning";
      verificationNotes.push(timestampCheck.note);
    }
    if (isDuplicate) {
      verificationStatus = "warning";
      verificationNotes.push("Duplicate image submitted — hash matches existing evidence");
    }
    if (manipulation.is_likely_manipulated) {
      verificationStatus = "manipulation_detected";
      verificationNotes.push(`AI detected manipulation (risk: ${Math.round(manipulationRisk * 100)}%): ${manipulation.assessment}`);
    }
    if (manipulation.is_likely_ai_generated) {
      verificationStatus = "manipulation_detected";
      verificationNotes.push("AI detected this image may be AI-generated or synthetic");
    }

    const [photo] = await db
      .insert(evidencePhotosTable)
      .values({
        incident_id: req.params.id,
        image_base64,
        source,
        ai_analysis: sceneAnalysis.evidence_summary || "",
        vehicle_unit: firstVehicle.unit_number || null,
        license_plate: firstVehicle.license_plate || null,
        officer_description: firstOfficer.description || null,
        department_markings: firstVehicle.department_markings || null,
        additional_findings: (sceneAnalysis.false_reading_risks || []).join("; ") || null,
        scene_analysis: sceneAnalysis,
        person_count: counts.total_persons ?? null,
        officer_count: counts.total_law_enforcement ?? null,
        vehicle_count: counts.total_vehicles ?? null,
        confidence_score: overallConfidence,
      })
      .returning();

    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket?.remoteAddress || null;
    const userAgent = (req.headers["user-agent"] as string) || null;

    await db.insert(evidenceIntegrityTable).values({
      evidence_photo_id: photo.id,
      incident_id: req.params.id,
      image_hash: imageHash,
      metadata_hash: metadataHash,
      chain_hash: chainHash,
      previous_chain_hash: prevChainHash,
      sequence_number: seqNumber,
      capture_timestamp: captureTimestamp,
      gps_lat: gps_lat ?? null,
      gps_lon: gps_lon ?? null,
      ip_address: ipAddress,
      user_agent: userAgent,
      manipulation_risk_score: manipulationRisk,
      manipulation_flags: manipulation.indicators?.length
        ? { indicators: manipulation.indicators, ai_artifacts: manipulation.ai_generation_artifacts || [] }
        : null,
      ai_manipulation_assessment: manipulation.assessment || null,
      gps_plausible: true,
      timestamp_plausible: timestampCheck.plausible,
      duplicate_risk: isDuplicate,
      verification_status: verificationStatus,
      verification_note: verificationNotes.length > 0 ? verificationNotes.join("; ") : null,
      last_verified_at: new Date(),
    });

    const [storedAnalysis] = await db
      .insert(analysisResultsTable)
      .values({
        incident_id: req.params.id as any,
        evidence_photo_id: photo.id as any,
        state_code: state_code || null,
        policy_ids_used: policyIds,
        policy_count_injected: policyIds.length,
        scene_analysis: sceneAnalysis,
        potential_concerns: sceneAnalysis.potential_concerns || [],
        overall_confidence: overallConfidence,
        manipulation_risk: manipulationRisk,
        model_version: "gpt-5.2",
      })
      .returning({ id: analysisResultsTable.id });

    await writeAuditLog({
      incident_id: req.params.id,
      evidence_photo_id: photo.id,
      action: "evidence_captured",
      actor: "user",
      details: {
        source,
        image_hash: imageHash,
        chain_hash: chainHash,
        sequence_number: seqNumber,
        manipulation_risk: manipulationRisk,
        verification_status: verificationStatus,
        person_count: counts.total_persons,
        officer_count: counts.total_law_enforcement,
        vehicle_count: counts.total_vehicles,
      },
    });

    res.json({
      photo_id: photo.id,
      analysis_result_id: storedAnalysis?.id || null,
      policy_context: {
        policies_loaded: policyIds.length,
        state_jurisdiction: state_code || null,
        engine_version: "SIE-1.0",
      },
      scene_analysis: sceneAnalysis,
      integrity: {
        image_hash: imageHash,
        chain_hash: chainHash,
        sequence_number: seqNumber,
        verification_status: verificationStatus,
        verification_notes: verificationNotes,
        manipulation_risk: manipulationRisk,
        manipulation_assessment: manipulation.assessment,
        manipulation_flags: manipulation.indicators || [],
        timestamp_plausible: timestampCheck.plausible,
        duplicate_risk: isDuplicate,
      },
      counts: {
        persons: counts.total_persons ?? 0,
        law_enforcement: counts.total_law_enforcement ?? 0,
        civilians: counts.total_civilians ?? 0,
        vehicles: counts.total_vehicles ?? 0,
        police_vehicles: counts.total_police_vehicles ?? 0,
        objects: counts.total_objects_of_interest ?? 0,
      },
      confidence: {
        overall: overallConfidence,
        persons: sceneAnalysis.analysis_confidence?.person_count_confidence ?? null,
        vehicles: sceneAnalysis.analysis_confidence?.vehicle_count_confidence ?? null,
        reducing_factors: sceneAnalysis.analysis_confidence?.factors_reducing_confidence || [],
      },
      concerns: sceneAnalysis.potential_concerns || [],
      false_reading_risks: sceneAnalysis.false_reading_risks || [],
      evidence_summary: sceneAnalysis.evidence_summary || "",
      extracted: {
        vehicle_unit: photo.vehicle_unit,
        license_plate: photo.license_plate,
        officer_description: photo.officer_description,
        department_markings: photo.department_markings,
      },
    });
  } catch (err) {
    console.error("Image analysis error:", err);
    res.status(500).json({ error: "Failed to analyze image", message: String(err) });
  }
});

router.get("/:id/evidence", async (req, res) => {
  try {
    const photos = await db
      .select({
        id: evidencePhotosTable.id,
        incident_id: evidencePhotosTable.incident_id,
        source: evidencePhotosTable.source,
        ai_analysis: evidencePhotosTable.ai_analysis,
        vehicle_unit: evidencePhotosTable.vehicle_unit,
        license_plate: evidencePhotosTable.license_plate,
        officer_description: evidencePhotosTable.officer_description,
        department_markings: evidencePhotosTable.department_markings,
        additional_findings: evidencePhotosTable.additional_findings,
        scene_analysis: evidencePhotosTable.scene_analysis,
        person_count: evidencePhotosTable.person_count,
        officer_count: evidencePhotosTable.officer_count,
        vehicle_count: evidencePhotosTable.vehicle_count,
        confidence_score: evidencePhotosTable.confidence_score,
        captured_at: evidencePhotosTable.captured_at,
      })
      .from(evidencePhotosTable)
      .where(eq(evidencePhotosTable.incident_id, req.params.id))
      .orderBy(evidencePhotosTable.captured_at);

    const integrityMap: Record<string, any> = {};
    if (photos.length > 0) {
      const intRows = await db
        .select({
          evidence_photo_id: evidenceIntegrityTable.evidence_photo_id,
          verification_status: evidenceIntegrityTable.verification_status,
          verification_note: evidenceIntegrityTable.verification_note,
          manipulation_risk_score: evidenceIntegrityTable.manipulation_risk_score,
          image_hash: evidenceIntegrityTable.image_hash,
          chain_hash: evidenceIntegrityTable.chain_hash,
          sequence_number: evidenceIntegrityTable.sequence_number,
          duplicate_risk: evidenceIntegrityTable.duplicate_risk,
          timestamp_plausible: evidenceIntegrityTable.timestamp_plausible,
        })
        .from(evidenceIntegrityTable)
        .where(eq(evidenceIntegrityTable.incident_id, req.params.id));

      for (const r of intRows) {
        integrityMap[r.evidence_photo_id] = r;
      }
    }

    const evidence = photos.map((p) => ({
      ...p,
      integrity: integrityMap[p.id] || null,
    }));

    res.json({ evidence });
  } catch (err) {
    res.status(500).json({ error: "Failed to get evidence", message: String(err) });
  }
});

export default router;
