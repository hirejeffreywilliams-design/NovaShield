import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { evidencePhotosTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const STRUCTURED_ANALYSIS_PROMPT = `You are an expert forensic scene analyst specializing in law enforcement encounter documentation for civil rights accountability. Your task is to produce a highly accurate, structured JSON analysis of this image.

ACCURACY IS PARAMOUNT. You must:
- Count every visible human being individually and carefully
- Distinguish clearly between law enforcement and civilians based on visible evidence ONLY (uniform, badge, vehicle markings, equipment)
- Report confidence scores honestly — if visibility is poor, your confidence MUST be lower
- Never infer what you cannot see — mark uncertain items with lower confidence and explain why
- Actively flag potential false reading risks (e.g., partially visible people, blurry areas, obstructions)

Return ONLY valid JSON matching this exact schema. No markdown, no text outside the JSON:

{
  "persons": [
    {
      "person_id": 1,
      "role": "law_enforcement | civilian | unknown",
      "description": "detailed physical description",
      "clothing": "detailed clothing description",
      "visible_badge_number": "exact text if visible, or null",
      "visible_name_tag": "exact text if visible, or null",
      "apparent_rank": "if discernible from insignia, or null",
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
      "unit_number": "exact text visible on vehicle, or null",
      "license_plate": "exact plate text if readable, or null",
      "department_markings": "full text of any department name/logo visible, or null",
      "color": "color description",
      "make_model": "if identifiable, or null",
      "confidence": 0.90,
      "confidence_notes": "why this confidence level"
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
    "obstructions": ["list any obstructions affecting visibility"],
    "visible_landmarks": ["street signs, building numbers, or other identifying features"],
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
    "factors_reducing_confidence": ["list specific factors like blur, angle, distance, obstruction"],
    "factors_increasing_confidence": ["list specific factors like good lighting, clear markings, close range"]
  },
  "potential_concerns": [
    {
      "type": "excessive_force | unreasonable_search | disproportionate_response | constitutional_concern | use_of_force | other",
      "description": "specific observable description — only what is VISIBLE, no assumptions",
      "severity": "low | medium | high",
      "applicable_amendment": "1st | 4th | 5th | 8th | 14th | null"
    }
  ],
  "false_reading_risks": [
    "specific risks that could cause misidentification in this image"
  ],
  "evidence_summary": "2-3 sentence plain-language summary of what this image documents, suitable for an official report"
}`;

router.post("/:id/analyze-image", async (req, res) => {
  try {
    const { image_base64, source = "camera" } = req.body;
    if (!image_base64) {
      return res.status(400).json({ error: "image_base64 is required" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: STRUCTURED_ANALYSIS_PROMPT },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image_base64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
    });

    const rawContent = response.choices[0]?.message?.content || "{}";
    let sceneAnalysis: any = {};

    try {
      sceneAnalysis = JSON.parse(rawContent);
    } catch {
      sceneAnalysis = { parse_error: true, raw: rawContent };
    }

    const counts = sceneAnalysis.counts || {};
    const firstVehicle = sceneAnalysis.vehicles?.[0] || {};
    const lawEnforcementPersons = (sceneAnalysis.persons || []).filter((p: any) => p.role === "law_enforcement");
    const firstOfficer = lawEnforcementPersons[0] || {};
    const overallConfidence = sceneAnalysis.analysis_confidence?.overall_score ?? null;

    const legacySummary = sceneAnalysis.evidence_summary || "";

    const [photo] = await db
      .insert(evidencePhotosTable)
      .values({
        incident_id: req.params.id,
        image_base64,
        source,
        ai_analysis: legacySummary,
        vehicle_unit: firstVehicle.unit_number || null,
        license_plate: firstVehicle.license_plate || null,
        officer_description: firstOfficer.description || null,
        department_markings: firstVehicle.department_markings || firstOfficer.apparent_rank || null,
        additional_findings: (sceneAnalysis.false_reading_risks || []).join("; ") || null,
        scene_analysis: sceneAnalysis,
        person_count: counts.total_persons ?? null,
        officer_count: counts.total_law_enforcement ?? null,
        vehicle_count: counts.total_vehicles ?? null,
        confidence_score: overallConfidence,
      })
      .returning();

    res.json({
      photo_id: photo.id,
      scene_analysis: sceneAnalysis,
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
    res.json({ evidence: photos });
  } catch (err) {
    res.status(500).json({ error: "Failed to get evidence", message: String(err) });
  }
});

export default router;
