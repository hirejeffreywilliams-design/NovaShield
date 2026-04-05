import { Router, type IRouter } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth";
import {
  registerWithBridge,
  getEcosystemContext,
  syncAchievements,
  contributeMomentum,
} from "../services/omnidlos-client";
import { logRouteAccess } from "../lib/audit-trail";

const router: IRouter = Router();

router.post("/link-account", authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    await logRouteAccess(req, "ecosystem_link", "ecosystem", userId);

    const result = await registerWithBridge(userId);
    if (!result.success) {
      return res.status(502).json({ error: "Failed to link account", details: result.error });
    }

    res.json({ message: "Account linked to 4everacy ecosystem", data: result.data });
  } catch (err) {
    res.status(500).json({ error: "Failed to link account", message: String(err) });
  }
});

router.get("/context", authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    await logRouteAccess(req, "ecosystem_context_read", "ecosystem", userId);

    const result = await getEcosystemContext(userId);
    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json({ context: result.data });
  } catch (err) {
    res.status(500).json({ error: "Failed to get ecosystem context", message: String(err) });
  }
});

router.post("/sync", authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    await logRouteAccess(req, "ecosystem_sync", "ecosystem", userId);

    const result = await syncAchievements(userId);
    if (!result.success) {
      return res.status(502).json({ error: result.error });
    }

    res.json({ message: "Achievements synced", synced_count: result.synced_count });
  } catch (err) {
    res.status(500).json({ error: "Failed to sync achievements", message: String(err) });
  }
});

const momentumSchema = z.object({
  type: z.string().min(1),
  value: z.number().positive(),
  context: z.string().optional(),
});

router.post("/momentum-boost", authenticate, async (req, res) => {
  try {
    const parsed = momentumSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    }

    const userId = req.user!.userId;
    await logRouteAccess(req, "ecosystem_momentum", "ecosystem", userId);

    const result = await contributeMomentum(userId, parsed.data);
    if (!result.success) {
      return res.status(502).json({ error: result.error });
    }

    res.json({ message: "Momentum contribution recorded", data: result.data });
  } catch (err) {
    res.status(500).json({ error: "Failed to contribute momentum", message: String(err) });
  }
});

export default router;
