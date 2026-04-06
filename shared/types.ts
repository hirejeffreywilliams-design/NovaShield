export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string | null;
  department_id?: string | null;
  is_active: boolean;
  last_login?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Incident {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  officer_badge?: string | null;
  officer_name?: string | null;
  duration_seconds?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Officer {
  id: string;
  name?: string | null;
  badge_no?: string | null;
  agency?: string | null;
  rank?: string | null;
  department?: string | null;
  notes?: string | null;
  incident_count: number;
  created_at: string;
}

export interface Report {
  id: string;
  incident_id: string;
  title: string;
  summary?: string | null;
  findings: string[];
  recommendations: string[];
  created_at: string;
}

export interface IncidentEvent {
  id: string;
  incident_id: string;
  type: string;
  description?: string | null;
  timestamp_seconds?: number | null;
  wall_clock_time?: string | null;
  rights_violated?: string | null;
  confidence?: number | null;
  created_at: string;
}

export interface Complaint {
  id: string;
  incident_id?: string | null;
  reporter_id?: string | null;
  officer_id?: string | null;
  department_id?: string | null;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  resolution?: string | null;
  resolution_date?: string | null;
  assigned_to?: string | null;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  jurisdiction: string;
  state: string;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  chief_name?: string | null;
  officer_count: number;
  complaint_count: number;
  use_of_force_count: number;
  accountability_score?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  department_id?: string | null;
  officer_id?: string | null;
  related_incident_ids?: string[] | null;
  is_read: boolean;
  is_dismissed: boolean;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface BodyCameraRecord {
  id: string;
  incident_id?: string | null;
  officer_id?: string | null;
  department_id?: string | null;
  footage_url: string;
  duration_seconds?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  status: string;
  reviewer_id?: string | null;
  review_notes?: string | null;
  is_public: boolean;
  request_count: number;
  created_at: string;
  updated_at: string;
}

export interface Forum {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  is_pinned: boolean;
  author_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ForumPost {
  id: string;
  forum_id: string;
  author_id?: string | null;
  content: string;
  is_solution: boolean;
  upvotes: number;
  created_at: string;
  updated_at: string;
}

export interface Petition {
  id: string;
  title: string;
  description: string;
  target_department_id?: string | null;
  target_policy?: string | null;
  author_id?: string | null;
  signature_count: number;
  signature_goal: number;
  status: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface WhistleblowerSubmission {
  id: string;
  submission_code: string;
  title: string;
  description: string;
  category: string;
  department_id?: string | null;
  evidence_urls?: string[] | null;
  is_anonymous: boolean;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  relationship?: string | null;
  notify_on_sos: boolean;
  created_at: string;
}

export interface SosEvent {
  id: string;
  status: string;
  situation_type?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location_text?: string | null;
  contacts_notified: number;
  notes?: string | null;
  started_at: string;
  ended_at?: string | null;
}

export interface DashboardStats {
  totalIncidents: number;
  totalComplaints: number;
  totalOfficers: number;
  totalDepartments: number;
  pendingComplaints: number;
  activeAlerts: number;
}
