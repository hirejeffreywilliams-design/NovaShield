import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { evidencePhotosTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.post("/:id/analyze-image", async (req, res) => {
  try {
    const { image_base64, source = "camera" } = req.body;
    if (!image_base64) {
      return res.status(400).json({ error: "image_base64 is required" });
    }

    const prompt = `You are an expert forensic analyst helping document police encounters for civil rights accountability. Analyze this image carefully and extract ALL identifying information.

Look for and report:
1. VEHICLE INFORMATION: Squad car unit number (usually on the door, roof, or trunk), license plate number, vehicle make/model/year, department name/logo visible on the car, any district/division markings
2. OFFICER INFORMATION: Any visible badge numbers, name tags, uniform markings, rank insignia, physical description (height, build, hair color, skin tone, any distinguishing features)
3. DEPARTMENT/AGENCY: Full department name if visible, jurisdiction, any agency logos or seals
4. OTHER EVIDENCE: Bystanders, weapons, equipment, location details visible in background, street signs, building numbers, timestamps on any visible displays

Be precise and factual. If something is not clearly visible, say "Not clearly visible" rather than guessing.
Format your response as a structured report with clear sections.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
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

    const analysis = response.choices[0]?.message?.content || "Analysis unavailable";

    const vehicleUnitMatch = analysis.match(/unit\s*#?\s*(\w+)/i) ||
      analysis.match(/car\s*#?\s*(\w+)/i) ||
      analysis.match(/unit number[:\s]+([A-Z0-9-]+)/i);
    const licensePlateMatch = analysis.match(/license plate[:\s]+([A-Z0-9-\s]+)/i) ||
      analysis.match(/plate[:\s#]+([A-Z0-9-\s]+)/i);
    const departmentMatch = analysis.match(/department[:\s]+([^\n]+)/i) ||
      analysis.match(/agency[:\s]+([^\n]+)/i);
    const officerMatch = analysis.match(/officer[:\s]+([^\n]+)/i) ||
      analysis.match(/badge[:\s#]+([^\n]+)/i);

    const [photo] = await db
      .insert(evidencePhotosTable)
      .values({
        incident_id: req.params.id,
        image_base64,
        source,
        ai_analysis: analysis,
        vehicle_unit: vehicleUnitMatch?.[1]?.trim() || null,
        license_plate: licensePlateMatch?.[1]?.trim().substring(0, 20) || null,
        officer_description: officerMatch?.[1]?.trim() || null,
        department_markings: departmentMatch?.[1]?.trim() || null,
        additional_findings: null,
      })
      .returning();

    res.json({
      photo_id: photo.id,
      analysis,
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
