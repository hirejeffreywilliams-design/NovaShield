import { Router, type IRouter } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth";
import {
  storeVaultItem,
  getVaultItem,
  listVaultItems,
  releaseVaultItem,
} from "../services/whistleblower-vault";
import { logRouteAccess } from "../lib/audit-trail";

const router: IRouter = Router();

const storeSchema = z.object({
  data: z.string().min(1),
  data_type: z.string().min(1).max(50).default("evidence"),
  title: z.string().max(200).optional(),
  release_conditions: z.object({
    type: z.enum(["timed", "manual", "dead_man_switch"]),
    release_at: z.string().optional(),
    check_interval_hours: z.number().optional(),
  }).optional(),
  trusted_contacts: z.array(z.string()).optional(),
});

router.post("/store", authenticate, async (req, res) => {
  try {
    const parsed = storeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    }

    const userId = req.user!.userId;
    await logRouteAccess(req, "vault_store", "whistleblower_vault", null, {
      data_type: parsed.data.data_type,
    });

    const result = await storeVaultItem({
      userId,
      data: parsed.data.data,
      dataType: parsed.data.data_type,
      title: parsed.data.title,
      releaseConditions: parsed.data.release_conditions,
      trustedContacts: parsed.data.trusted_contacts,
    });

    res.status(201).json({
      message: "Evidence stored securely in vault",
      item_id: result.id,
      status: result.status,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to store vault item", message: String(err) });
  }
});

router.get("/items", authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    await logRouteAccess(req, "vault_list", "whistleblower_vault");

    const items = await listVaultItems(userId);
    res.json({ items, total: items.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to list vault items", message: String(err) });
  }
});

router.get("/items/:id", authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    await logRouteAccess(req, "vault_read", "whistleblower_vault", req.params.id);

    const item = await getVaultItem(req.params.id, userId);
    if (!item) {
      return res.status(404).json({ error: "Vault item not found" });
    }

    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: "Failed to get vault item", message: String(err) });
  }
});

router.post("/items/:id/release", authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    await logRouteAccess(req, "vault_release", "whistleblower_vault", req.params.id);

    const result = await releaseVaultItem(req.params.id, userId);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      message: "Vault item released",
      data: result.data,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to release vault item", message: String(err) });
  }
});

export default router;
