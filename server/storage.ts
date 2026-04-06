import session from "express-session";
import createMemoryStore from "memorystore";
import crypto from "crypto";

const MemoryStore = createMemoryStore(session);

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "novashield-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({ checkPeriod: 86400000 }),
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  },
});

function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString("hex"));
    });
  });
}

class MemStorage {
  private users: any[] = [];
  private incidents: any[] = [];
  private officers: any[] = [];
  private reports: any[] = [];
  private complaints: any[] = [];
  private departments: any[] = [];
  private alerts: any[] = [];
  private bodyCamera: any[] = [];
  private forums: any[] = [];
  private forumPosts: any[] = [];
  private petitions: any[] = [];
  private whistleblower: any[] = [];
  private trustedContacts: any[] = [];
  private sosEvents: any[] = [];
  private nid = { u: 1, i: 1, o: 1, r: 1, c: 1, d: 1, a: 1, bc: 1, f: 1, fp: 1, p: 1, w: 1, tc: 1, s: 1 };

  constructor() {
    this.seedData();
  }

  private async seedData() {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = await hashPassword("admin123", salt);
    this.users.push(
      { id: String(this.nid.u++), username: "admin", email: "admin@novashield.io", password_hash: `${salt}:${hash}`, full_name: "System Administrator", role: "admin", avatar_url: null, department_id: null, is_active: true, last_login: null, created_at: new Date("2024-01-01"), updated_at: new Date("2024-01-01") },
      { id: String(this.nid.u++), username: "officer_jones", email: "jones@pd.gov", password_hash: `${salt}:${hash}`, full_name: "Officer Jones", role: "officer", avatar_url: null, department_id: "1", is_active: true, last_login: null, created_at: new Date("2024-02-15"), updated_at: new Date("2024-02-15") },
      { id: String(this.nid.u++), username: "citizen_doe", email: "doe@email.com", password_hash: `${salt}:${hash}`, full_name: "Jane Doe", role: "citizen", avatar_url: null, department_id: null, is_active: true, last_login: null, created_at: new Date("2024-03-01"), updated_at: new Date("2024-03-01") },
    );

    this.departments.push(
      { id: String(this.nid.d++), name: "Metro Police Department", jurisdiction: "Metro City", state: "CA", address: "100 Main St", phone: "555-0100", website: "https://metropd.gov", chief_name: "Chief Williams", officer_count: 450, complaint_count: 127, use_of_force_count: 34, accountability_score: 72.5, created_at: new Date(), updated_at: new Date() },
      { id: String(this.nid.d++), name: "County Sheriff's Office", jurisdiction: "County", state: "CA", address: "200 Sheriff Blvd", phone: "555-0200", website: "https://countysheriff.gov", chief_name: "Sheriff Brown", officer_count: 280, complaint_count: 89, use_of_force_count: 21, accountability_score: 68.0, created_at: new Date(), updated_at: new Date() },
      { id: String(this.nid.d++), name: "University Police", jurisdiction: "State University", state: "CA", address: "300 Campus Dr", phone: "555-0300", website: "https://unipd.edu", chief_name: "Chief Garcia", officer_count: 45, complaint_count: 12, use_of_force_count: 2, accountability_score: 88.5, created_at: new Date(), updated_at: new Date() },
    );

    this.officers.push(
      { id: String(this.nid.o++), name: "Officer Smith", badge_no: "B-1234", agency: "Metro PD", rank: "Sergeant", department: "Patrol", notes: null, incident_count: 3, created_at: new Date() },
      { id: String(this.nid.o++), name: "Officer Johnson", badge_no: "B-5678", agency: "Metro PD", rank: "Officer", department: "Patrol", notes: "Multiple complaints on record", incident_count: 7, created_at: new Date() },
      { id: String(this.nid.o++), name: "Detective Williams", badge_no: "D-9012", agency: "County Sheriff", rank: "Detective", department: "Investigations", notes: null, incident_count: 1, created_at: new Date() },
    );

    this.incidents.push(
      { id: String(this.nid.i++), title: "Traffic stop escalation", description: "Routine traffic stop that escalated to use of force", location: "123 Main St", latitude: 34.0522, longitude: -118.2437, status: "under_review", officer_badge: "B-1234", officer_name: "Officer Smith", duration_seconds: 900, notes: "Body camera footage requested", created_at: new Date("2025-03-15"), updated_at: new Date("2025-03-15") },
      { id: String(this.nid.i++), title: "Protest response incident", description: "Excessive force during peaceful protest", location: "City Hall Plaza", latitude: 34.0536, longitude: -118.2427, status: "pending", officer_badge: "B-5678", officer_name: "Officer Johnson", duration_seconds: 3600, notes: "Multiple witnesses", created_at: new Date("2025-03-20"), updated_at: new Date("2025-03-20") },
      { id: String(this.nid.i++), title: "Unlawful search", description: "Search conducted without warrant or probable cause", location: "456 Oak Ave", latitude: 34.0505, longitude: -118.2505, status: "resolved", officer_badge: "D-9012", officer_name: "Detective Williams", duration_seconds: 1800, notes: "Resolved with department acknowledgment", created_at: new Date("2025-02-10"), updated_at: new Date("2025-03-01") },
    );

    this.complaints.push(
      { id: String(this.nid.c++), incident_id: "1", reporter_id: "3", officer_id: "1", department_id: "1", title: "Excessive force during traffic stop", description: "Officer used unnecessary force during a routine stop", category: "excessive_force", status: "under_investigation", priority: "high", resolution: null, resolution_date: null, assigned_to: null, is_anonymous: false, created_at: new Date("2025-03-16"), updated_at: new Date("2025-03-16") },
      { id: String(this.nid.c++), incident_id: "2", reporter_id: null, officer_id: "2", department_id: "1", title: "Inappropriate conduct at protest", description: "Officer used pepper spray on non-violent protestors", category: "misconduct", status: "submitted", priority: "critical", resolution: null, resolution_date: null, assigned_to: null, is_anonymous: true, created_at: new Date("2025-03-21"), updated_at: new Date("2025-03-21") },
    );

    this.alerts.push(
      { id: String(this.nid.a++), type: "pattern", title: "Complaint spike detected", description: "Officer B-5678 has received 3 complaints in 30 days", severity: "high", department_id: "1", officer_id: "2", related_incident_ids: ["1", "2"], is_read: false, is_dismissed: false, metadata: null, created_at: new Date() },
      { id: String(this.nid.a++), type: "anomaly", title: "Use of force increase", description: "Metro PD use of force incidents up 40% this quarter", severity: "critical", department_id: "1", officer_id: null, related_incident_ids: null, is_read: false, is_dismissed: false, metadata: null, created_at: new Date() },
    );

    this.forums.push(
      { id: String(this.nid.f++), title: "How to file a complaint effectively", description: "Tips and guidance for filing formal complaints", category: "guidance", is_pinned: true, author_id: "1", created_at: new Date(), updated_at: new Date() },
    );

    this.petitions.push(
      { id: String(this.nid.p++), title: "Mandate body cameras for all officers", description: "All officers should be required to wear body cameras during duty", target_department_id: "1", target_policy: "Body Camera Policy", author_id: "3", signature_count: 847, signature_goal: 1000, status: "active", category: "policy_reform", created_at: new Date(), updated_at: new Date() },
    );
  }

  // ─── Users ───
  async getUserByEmail(email: string) { return this.users.find(u => u.email === email) || null; }
  async getUser(id: string) { return this.users.find(u => u.id === id) || null; }
  async getAllUsers() { return this.users; }
  async createUser(data: any) {
    const user = { id: String(this.nid.u++), ...data, is_active: true, last_login: null, created_at: new Date(), updated_at: new Date() };
    this.users.push(user);
    return user;
  }
  async updateUser(id: string, data: any) {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.users[idx] = { ...this.users[idx], ...data, updated_at: new Date() };
    return this.users[idx];
  }

  // ─── Incidents ───
  async getIncidents() { return this.incidents; }
  async getIncident(id: string) { return this.incidents.find(i => i.id === id) || null; }
  async createIncident(data: any) {
    const incident = { id: String(this.nid.i++), ...data, status: data.status || "pending", created_at: new Date(), updated_at: new Date() };
    this.incidents.push(incident);
    return incident;
  }
  async updateIncident(id: string, data: any) {
    const idx = this.incidents.findIndex(i => i.id === id);
    if (idx === -1) return null;
    this.incidents[idx] = { ...this.incidents[idx], ...data, updated_at: new Date() };
    return this.incidents[idx];
  }
  async deleteIncident(id: string) {
    this.incidents = this.incidents.filter(i => i.id !== id);
  }

  // ─── Officers ───
  async getOfficers() { return this.officers; }
  async getOfficer(id: string) { return this.officers.find(o => o.id === id) || null; }
  async createOfficer(data: any) {
    const officer = { id: String(this.nid.o++), ...data, incident_count: 0, created_at: new Date() };
    this.officers.push(officer);
    return officer;
  }

  // ─── Reports ───
  async getReports() { return this.reports; }
  async getReport(id: string) { return this.reports.find(r => r.id === id) || null; }
  async getReportByIncident(incidentId: string) { return this.reports.find(r => r.incident_id === incidentId) || null; }
  async createReport(data: any) {
    const report = { id: String(this.nid.r++), ...data, created_at: new Date() };
    this.reports.push(report);
    return report;
  }

  // ─── Complaints ───
  async getComplaints(filters?: { status?: string; department_id?: string; officer_id?: string }) {
    let result = this.complaints;
    if (filters?.status) result = result.filter(c => c.status === filters.status);
    if (filters?.department_id) result = result.filter(c => c.department_id === filters.department_id);
    if (filters?.officer_id) result = result.filter(c => c.officer_id === filters.officer_id);
    return result;
  }
  async getComplaint(id: string) { return this.complaints.find(c => c.id === id) || null; }
  async createComplaint(data: any) {
    const complaint = { id: String(this.nid.c++), ...data, status: data.status || "submitted", created_at: new Date(), updated_at: new Date() };
    this.complaints.push(complaint);
    return complaint;
  }
  async updateComplaint(id: string, data: any) {
    const idx = this.complaints.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.complaints[idx] = { ...this.complaints[idx], ...data, updated_at: new Date() };
    return this.complaints[idx];
  }

  // ─── Departments ───
  async getDepartments() { return this.departments; }
  async getDepartment(id: string) { return this.departments.find(d => d.id === id) || null; }
  async createDepartment(data: any) {
    const dept = { id: String(this.nid.d++), ...data, created_at: new Date(), updated_at: new Date() };
    this.departments.push(dept);
    return dept;
  }

  // ─── Alerts ───
  async getAlerts(filters?: { type?: string; severity?: string }) {
    let result = this.alerts;
    if (filters?.type) result = result.filter(a => a.type === filters.type);
    if (filters?.severity) result = result.filter(a => a.severity === filters.severity);
    return result;
  }
  async markAlertRead(id: string) {
    const idx = this.alerts.findIndex(a => a.id === id);
    if (idx !== -1) this.alerts[idx].is_read = true;
    return this.alerts[idx] || null;
  }
  async markAlertDismissed(id: string) {
    const idx = this.alerts.findIndex(a => a.id === id);
    if (idx !== -1) this.alerts[idx].is_dismissed = true;
    return this.alerts[idx] || null;
  }

  // ─── Body Camera ───
  async getBodyCameraRecords() { return this.bodyCamera; }
  async createBodyCameraRecord(data: any) {
    const record = { id: String(this.nid.bc++), ...data, status: "pending_review", request_count: 0, created_at: new Date(), updated_at: new Date() };
    this.bodyCamera.push(record);
    return record;
  }

  // ─── Forums ───
  async getForums() { return this.forums; }
  async createForum(data: any) {
    const forum = { id: String(this.nid.f++), ...data, is_pinned: false, created_at: new Date(), updated_at: new Date() };
    this.forums.push(forum);
    return forum;
  }
  async getForumPosts(forumId: string) { return this.forumPosts.filter(p => p.forum_id === forumId); }
  async createForumPost(data: any) {
    const post = { id: String(this.nid.fp++), ...data, is_solution: false, upvotes: 0, created_at: new Date(), updated_at: new Date() };
    this.forumPosts.push(post);
    return post;
  }

  // ─── Petitions ───
  async getPetitions() { return this.petitions; }
  async getPetition(id: string) { return this.petitions.find(p => p.id === id) || null; }
  async createPetition(data: any) {
    const petition = { id: String(this.nid.p++), ...data, signature_count: 0, status: "active", created_at: new Date(), updated_at: new Date() };
    this.petitions.push(petition);
    return petition;
  }
  async signPetition(id: string) {
    const idx = this.petitions.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.petitions[idx].signature_count++;
    if (this.petitions[idx].signature_count >= this.petitions[idx].signature_goal) {
      this.petitions[idx].status = "completed";
    }
    return this.petitions[idx];
  }

  // ─── Whistleblower ───
  async getWhistleblowerTips() { return this.whistleblower; }
  async createWhistleblowerTip(data: any) {
    const tip = { id: String(this.nid.w++), ...data, status: "received", created_at: new Date(), updated_at: new Date() };
    this.whistleblower.push(tip);
    return tip;
  }
  async getWhistleblowerByCode(code: string) { return this.whistleblower.find(w => w.submission_code === code) || null; }

  // ─── Trusted Contacts ───
  async getTrustedContacts() { return this.trustedContacts; }
  async createTrustedContact(data: any) {
    const contact = { id: String(this.nid.tc++), ...data, notify_on_sos: true, created_at: new Date() };
    this.trustedContacts.push(contact);
    return contact;
  }

  // ─── SOS Events ───
  async getSosEvents() { return this.sosEvents; }
  async getActiveSos() { return this.sosEvents.find(s => s.status === "active") || null; }
  async createSosEvent(data: any) {
    const sos = { id: String(this.nid.s++), ...data, status: "active", contacts_notified: 0, started_at: new Date(), ended_at: null };
    this.sosEvents.push(sos);
    return sos;
  }

  // ─── Stats ───
  async getStats() {
    return {
      totalIncidents: this.incidents.length,
      totalComplaints: this.complaints.length,
      totalOfficers: this.officers.length,
      totalDepartments: this.departments.length,
      pendingComplaints: this.complaints.filter(c => c.status === "submitted").length,
      activeAlerts: this.alerts.filter(a => !a.is_dismissed && !a.is_read).length,
    };
  }
}

export const storage = new MemStorage();
