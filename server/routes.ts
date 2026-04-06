import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import crypto from "crypto";

function getUserId(req: Request): string | null {
  return (req.session as any)?.userId || null;
}

function requireAuth(req: Request, res: Response): string | null {
  const uid = getUserId(req);
  if (!uid) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return uid;
}

function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString("hex"));
    });
  });
}

export function registerRoutes(app: Express): Server {
  // ─── Auth ───
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, username, password, full_name, role } = req.body;
      if (!email || !password || !full_name || !username) {
        return res.status(400).json({ error: "email, username, password, and full_name are required" });
      }
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists" });
      }
      const salt = crypto.randomBytes(16).toString("hex");
      const hash = await hashPassword(password, salt);
      const user = await storage.createUser({
        email, username, password_hash: `${salt}:${hash}`, full_name, role: role || "citizen",
      });
      (req.session as any).userId = user.id;
      res.json({ user: { id: user.id, email: user.email, username: user.username, full_name: user.full_name, role: user.role } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const [salt, storedHash] = user.password_hash.split(":");
      const hash = await hashPassword(password, salt);
      if (hash !== storedHash) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      (req.session as any).userId = user.id;
      res.json({ user: { id: user.id, email: user.email, username: user.username, full_name: user.full_name, role: user.role } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const uid = getUserId(req);
      if (!uid) return res.status(401).json({ error: "Not authenticated" });
      const u = await storage.getUser(uid);
      if (!u) return res.status(404).json({ error: "User not found" });
      res.json({ user: { id: u.id, email: u.email, username: u.username, full_name: u.full_name, role: u.role, avatar_url: u.avatar_url, department_id: u.department_id } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => res.json({ success: true }));
  });

  // ─── Incidents ───
  app.get("/api/incidents", async (_req, res) => {
    try { res.json(await storage.getIncidents()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/incidents/:id", async (req, res) => {
    try {
      const incident = await storage.getIncident(req.params.id);
      if (!incident) return res.status(404).json({ error: "Incident not found" });
      res.json(incident);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/incidents", async (req, res) => {
    try {
      const incident = await storage.createIncident(req.body);
      res.json(incident);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put("/api/incidents/:id", async (req, res) => {
    try {
      const updated = await storage.updateIncident(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Incident not found" });
      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/incidents/:id", async (req, res) => {
    try {
      await storage.deleteIncident(req.params.id);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Officers ───
  app.get("/api/officers", async (_req, res) => {
    try { res.json(await storage.getOfficers()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/officers/:id", async (req, res) => {
    try {
      const officer = await storage.getOfficer(req.params.id);
      if (!officer) return res.status(404).json({ error: "Officer not found" });
      res.json(officer);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/officers", async (req, res) => {
    try { res.json(await storage.createOfficer(req.body)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Reports ───
  app.get("/api/reports", async (_req, res) => {
    try { res.json(await storage.getReports()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/reports/:id", async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report) return res.status(404).json({ error: "Report not found" });
      res.json(report);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/reports", async (req, res) => {
    try { res.json(await storage.createReport(req.body)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Complaints ───
  app.get("/api/complaints", async (req, res) => {
    try {
      const { status, department_id, officer_id } = req.query as any;
      res.json(await storage.getComplaints({ status, department_id, officer_id }));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/complaints/:id", async (req, res) => {
    try {
      const complaint = await storage.getComplaint(req.params.id);
      if (!complaint) return res.status(404).json({ error: "Complaint not found" });
      res.json(complaint);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/complaints", async (req, res) => {
    try { res.json(await storage.createComplaint(req.body)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put("/api/complaints/:id", async (req, res) => {
    try {
      const updated = await storage.updateComplaint(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Complaint not found" });
      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Departments ───
  app.get("/api/departments", async (_req, res) => {
    try { res.json(await storage.getDepartments()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/departments/:id", async (req, res) => {
    try {
      const dept = await storage.getDepartment(req.params.id);
      if (!dept) return res.status(404).json({ error: "Department not found" });
      res.json(dept);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/departments", async (req, res) => {
    try { res.json(await storage.createDepartment(req.body)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Alerts ───
  app.get("/api/alerts", async (req, res) => {
    try {
      const { type, severity } = req.query as any;
      res.json(await storage.getAlerts({ type, severity }));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put("/api/alerts/:id/read", async (req, res) => {
    try {
      const alert = await storage.markAlertRead(req.params.id);
      if (!alert) return res.status(404).json({ error: "Alert not found" });
      res.json(alert);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put("/api/alerts/:id/dismiss", async (req, res) => {
    try {
      const alert = await storage.markAlertDismissed(req.params.id);
      if (!alert) return res.status(404).json({ error: "Alert not found" });
      res.json(alert);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Body Camera ───
  app.get("/api/body-camera", async (_req, res) => {
    try { res.json(await storage.getBodyCameraRecords()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/body-camera", async (req, res) => {
    try { res.json(await storage.createBodyCameraRecord(req.body)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Analytics ───
  app.get("/api/analytics/overview", async (_req, res) => {
    try { res.json(await storage.getStats()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Forums ───
  app.get("/api/forums", async (_req, res) => {
    try { res.json(await storage.getForums()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/forums", async (req, res) => {
    try { res.json(await storage.createForum(req.body)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/forums/:id/posts", async (req, res) => {
    try { res.json(await storage.getForumPosts(req.params.id)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/forums/:id/posts", async (req, res) => {
    try { res.json(await storage.createForumPost({ ...req.body, forum_id: req.params.id })); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Petitions ───
  app.get("/api/petitions", async (_req, res) => {
    try { res.json(await storage.getPetitions()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/petitions", async (req, res) => {
    try { res.json(await storage.createPetition(req.body)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/petitions/:id/sign", async (req, res) => {
    try {
      const petition = await storage.signPetition(req.params.id);
      if (!petition) return res.status(404).json({ error: "Petition not found" });
      res.json(petition);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Whistleblower ───
  app.get("/api/whistleblower", async (_req, res) => {
    try { res.json(await storage.getWhistleblowerTips()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/whistleblower", async (req, res) => {
    try {
      const submissionCode = crypto.randomBytes(6).toString("hex").toUpperCase();
      const tip = await storage.createWhistleblowerTip({ ...req.body, submission_code: submissionCode });
      res.json(tip);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/whistleblower/track/:code", async (req, res) => {
    try {
      const tip = await storage.getWhistleblowerByCode(req.params.code);
      if (!tip) return res.status(404).json({ error: "Submission not found" });
      res.json({ status: tip.status, created_at: tip.created_at });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── SOS ───
  app.get("/api/sos/active", async (_req, res) => {
    try { res.json(await storage.getActiveSos()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/sos", async (req, res) => {
    try { res.json(await storage.createSosEvent(req.body)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/sos/contacts", async (_req, res) => {
    try { res.json(await storage.getTrustedContacts()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/sos/contacts", async (req, res) => {
    try { res.json(await storage.createTrustedContact(req.body)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Stats ───
  app.get("/api/stats", async (_req, res) => {
    try { res.json(await storage.getStats()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Team / Admin ───
  app.get("/api/team", async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map((u: any) => ({ id: u.id, username: u.username, full_name: u.full_name, email: u.email, role: u.role, avatar_url: u.avatar_url, department_id: u.department_id })));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/admin/users", async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map((u: any) => ({ id: u.id, username: u.username, full_name: u.full_name, email: u.email, role: u.role, avatar_url: u.avatar_url, is_active: u.is_active, created_at: u.created_at })));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── Health ───
  app.get("/api/healthz", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
