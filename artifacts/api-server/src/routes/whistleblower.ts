import { Router, type IRouter } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import { whistleblowerTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function generateSubmissionCode(): string {
  return `NS-${crypto.randomBytes(4).toString("hex").toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

router.get("/", async (req, res): Promise<void> => {
  try {
    const { admin } = req.query;
    if (admin === "true") {
      const tips = await db
        .select()
        .from(whistleblowerTable)
        .orderBy(whistleblowerTable.created_at);
      res.json({ tips });
      return;
    }
    res.status(400).json({ error: "Use POST to submit a tip, or provide a submission code via GET /:code" });
  } catch (err) {
    res.status(500).json({ error: "Failed to list tips", message: String(err) });
  }
});

router.post("/", async (req, res): Promise<void> => {
  try {
    const { title, description, category, department_id, evidence_urls, priority } = req.body;
    if (!title || !description) {
      res.status(400).json({ error: "title and description are required" });
      return;
    }

    const submission_code = generateSubmissionCode();

    const [tip] = await db
      .insert(whistleblowerTable)
      .values({
        submission_code,
        title,
        description,
        category: category || "misconduct",
        department_id,
        evidence_urls,
        priority: priority || "medium",
        status: "received",
        is_anonymous: true,
      })
      .returning();

    res.status(201).json({
      message: "Tip submitted anonymously. Save your submission code to check status.",
      submission_code: tip.submission_code,
      created_at: tip.created_at,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit tip", message: String(err) });
  }
});

router.get("/:code", async (req, res): Promise<void> => {
  try {
    const [tip] = await db
      .select()
      .from(whistleblowerTable)
      .where(eq(whistleblowerTable.submission_code, req.params.code));
    if (!tip) { res.status(404).json({ error: "Submission not found" }); return; }

    res.json({
      submission_code: tip.submission_code,
      title: tip.title,
      category: tip.category,
      status: tip.status,
      priority: tip.priority,
      created_at: tip.created_at,
      updated_at: tip.updated_at,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get submission status", message: String(err) });
  }
});

router.put("/:code", async (req, res): Promise<void> => {
  try {
    const { status, priority } = req.body;

    const [updated] = await db
      .update(whistleblowerTable)
      .set({ status, priority, updated_at: new Date() })
      .where(eq(whistleblowerTable.submission_code, req.params.code))
      .returning();
    if (!updated) { res.status(404).json({ error: "Submission not found" }); return; }

    res.json({
      submission_code: updated.submission_code,
      status: updated.status,
      priority: updated.priority,
      updated_at: updated.updated_at,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update submission", message: String(err) });
  }
});

export default router;
