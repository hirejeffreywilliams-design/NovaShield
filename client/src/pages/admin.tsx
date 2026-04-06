import { useState } from "react";
import { Settings, Users, Building2, Activity, Shield, Bell, Server, Database, Cpu, ToggleLeft, Info } from "lucide-react";

const tabs = ["Overview", "Users", "Departments", "System Health", "Settings"] as const;
type Tab = (typeof tabs)[number];

const mockUsers = [
  { id: "1", full_name: "Sarah Chen", email: "sarah.chen@example.com", role: "oversight_board", status: "active", joined: "2024-08-15" },
  { id: "2", full_name: "Marcus Johnson", email: "marcus.j@pd.gov", role: "department_admin", status: "active", joined: "2024-09-01" },
  { id: "3", full_name: "Emily Rodriguez", email: "e.rodriguez@city.gov", role: "officer", status: "active", joined: "2024-10-12" },
  { id: "4", full_name: "James Wilson", email: "jwilson@community.org", role: "citizen", status: "active", joined: "2024-11-03" },
  { id: "5", full_name: "Priya Patel", email: "priya@aclu.org", role: "oversight_board", status: "active", joined: "2024-12-01" },
  { id: "6", full_name: "David Kim", email: "dkim@pd.gov", role: "officer", status: "inactive", joined: "2025-01-15" },
  { id: "7", full_name: "Lisa Thompson", email: "l.thompson@ia.gov", role: "department_admin", status: "active", joined: "2025-02-20" },
  { id: "8", full_name: "Robert Martinez", email: "rob.martinez@mail.com", role: "citizen", status: "active", joined: "2025-03-10" },
];

const mockDepts = [
  { name: "NYPD Internal Affairs", officers: 312, complaints: 156, score: 71 },
  { name: "LAPD Oversight Division", officers: 287, complaints: 134, score: 78 },
  { name: "Chicago COPA", officers: 198, complaints: 167, score: 62 },
  { name: "Houston PD Accountability", officers: 156, complaints: 89, score: 84 },
];

const recentActivity = [
  { action: "New complaint filed", detail: "#C-2847 - Excessive force during arrest", time: "2 min ago", type: "complaint" },
  { action: "Alert triggered", detail: "Pattern detected: 3+ complaints against Officer #4521", time: "15 min ago", type: "alert" },
  { action: "User registered", detail: "Community member: Maria Santos", time: "1 hr ago", type: "user" },
  { action: "Report generated", detail: "Incident #I-1892 audit report completed", time: "2 hr ago", type: "report" },
  { action: "Whistleblower tip", detail: "New anonymous submission: NS-A8F2B1C3", time: "3 hr ago", type: "tip" },
];

const roleColors: Record<string, string> = {
  citizen: "bg-[#0EA5E9]/20 text-[#0EA5E9]",
  officer: "bg-[#10B981]/20 text-[#10B981]",
  department_admin: "bg-[#F59E0B]/20 text-[#F59E0B]",
  oversight_board: "bg-[#8B5CF6]/20 text-[#8B5CF6]",
};

const roleLabels: Record<string, string> = {
  citizen: "Citizen",
  officer: "Officer",
  department_admin: "Dept Admin",
  oversight_board: "Oversight Board",
};

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [settings, setSettings] = useState({
    anonymousReporting: true,
    publicOfficerRecords: true,
    autoAlertPatterns: true,
    emailNotifications: false,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-7 w-7 text-[#0EA5E9]" />
        <div>
          <h1 className="text-2xl font-bold text-[#e5e5e5]">Admin Panel</h1>
          <p className="text-sm text-[#a3a3a3]">System administration and configuration</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              tab === t ? "bg-[#0EA5E9] text-white" : "bg-[#111111] text-[#a3a3a3] hover:bg-[#1e1e1e] hover:text-[#e5e5e5]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Total Users", value: "2,847", icon: Users, color: "#0EA5E9" },
              { label: "Active Incidents", value: "89", icon: Shield, color: "#F59E0B" },
              { label: "Open Complaints", value: "142", icon: Activity, color: "#EF4444" },
              { label: "Officers Tracked", value: "3,891", icon: Users, color: "#10B981" },
              { label: "Active Alerts", value: "23", icon: Bell, color: "#8B5CF6" },
              { label: "System Uptime", value: "99.97%", icon: Server, color: "#06B6D4" },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${s.color}15` }}>
                    <s.icon className="h-5 w-5" style={{ color: s.color }} />
                  </div>
                  <p className="text-sm text-[#a3a3a3]">{s.label}</p>
                </div>
                <p className="text-2xl font-bold text-[#e5e5e5]">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#e5e5e5] mb-4">Recent System Activity</h3>
            <div className="space-y-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#0a0a0a]/50">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                    a.type === "complaint" ? "bg-[#EF4444]" : a.type === "alert" ? "bg-[#F59E0B]" : a.type === "user" ? "bg-[#10B981]" : a.type === "tip" ? "bg-[#8B5CF6]" : "bg-[#0EA5E9]"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#e5e5e5]">{a.action}</p>
                    <p className="text-xs text-[#a3a3a3] truncate">{a.detail}</p>
                  </div>
                  <span className="text-xs text-[#a3a3a3] whitespace-nowrap">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "Users" && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#e5e5e5] mb-4">User Management</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e1e1e]">
                  <th className="text-left py-3 px-4 text-[#a3a3a3] font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-[#a3a3a3] font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-[#a3a3a3] font-medium">Role</th>
                  <th className="text-left py-3 px-4 text-[#a3a3a3] font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-[#a3a3a3] font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map((u) => (
                  <tr key={u.id} className="border-b border-[#1e1e1e]/50 hover:bg-[#1e1e1e]/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#0EA5E9]/20 flex items-center justify-center text-[#0EA5E9] text-xs font-bold">
                          {u.full_name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className="text-[#e5e5e5] font-medium">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#a3a3a3]">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${roleColors[u.role]}`}>
                        {roleLabels[u.role]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`flex items-center gap-1.5 text-xs ${u.status === "active" ? "text-[#10B981]" : "text-[#a3a3a3]"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-[#10B981]" : "bg-[#a3a3a3]"}`} />
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#a3a3a3]">{new Date(u.joined).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Departments" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockDepts.map((d) => (
            <div key={d.name} className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="h-5 w-5 text-[#0EA5E9]" />
                <h3 className="text-lg font-semibold text-[#e5e5e5]">{d.name}</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-[#a3a3a3]">Officers</p>
                  <p className="text-lg font-bold text-[#e5e5e5]">{d.officers}</p>
                </div>
                <div>
                  <p className="text-xs text-[#a3a3a3]">Complaints</p>
                  <p className="text-lg font-bold text-[#e5e5e5]">{d.complaints}</p>
                </div>
                <div>
                  <p className="text-xs text-[#a3a3a3]">Score</p>
                  <p className={`text-lg font-bold ${d.score >= 80 ? "text-[#10B981]" : d.score >= 60 ? "text-[#F59E0B]" : "text-[#EF4444]"}`}>{d.score}</p>
                </div>
              </div>
              <div className="h-2 bg-[#1e1e1e] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${d.score}%`,
                    backgroundColor: d.score >= 80 ? "#10B981" : d.score >= 60 ? "#F59E0B" : "#EF4444",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "System Health" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Database", status: "operational", icon: Database },
              { name: "API Server", status: "operational", icon: Server },
              { name: "Analysis Pipeline", status: "degraded", icon: Cpu },
              { name: "Monitoring", status: "operational", icon: Activity },
            ].map((s) => (
              <div key={s.name} className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <s.icon className="h-5 w-5 text-[#0EA5E9]" />
                  <span className="text-sm font-medium text-[#e5e5e5]">{s.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${s.status === "operational" ? "bg-[#10B981]" : "bg-[#F59E0B]"}`} />
                  <span className={`text-sm capitalize ${s.status === "operational" ? "text-[#10B981]" : "text-[#F59E0B]"}`}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#e5e5e5] mb-4">System Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-[#a3a3a3]">Policies Loaded</p>
                <p className="text-xl font-bold text-[#e5e5e5]">137</p>
              </div>
              <div>
                <p className="text-xs text-[#a3a3a3]">Analyses (24h)</p>
                <p className="text-xl font-bold text-[#e5e5e5]">48</p>
              </div>
              <div>
                <p className="text-xs text-[#a3a3a3]">Avg Confidence</p>
                <p className="text-xl font-bold text-[#10B981]">78.3%</p>
              </div>
              <div>
                <p className="text-xs text-[#a3a3a3]">Feedback Accuracy</p>
                <p className="text-xl font-bold text-[#10B981]">91.2%</p>
              </div>
            </div>
            <p className="text-xs text-[#a3a3a3] mt-4">Last health check: {new Date().toLocaleString()}</p>
          </div>
        </div>
      )}

      {tab === "Settings" && (
        <div className="space-y-6">
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#e5e5e5] mb-4">Platform Settings</h3>
            <div className="space-y-4">
              {[
                { key: "anonymousReporting" as const, label: "Anonymous Reporting", desc: "Allow users to submit complaints and tips anonymously" },
                { key: "publicOfficerRecords" as const, label: "Public Officer Records", desc: "Make officer disciplinary records publicly searchable" },
                { key: "autoAlertPatterns" as const, label: "Auto-Alert Patterns", desc: "Automatically generate alerts when patterns are detected" },
                { key: "emailNotifications" as const, label: "Email Notifications", desc: "Send email notifications for critical alerts and updates" },
              ].map((s) => (
                <div key={s.key} className="flex items-center justify-between p-4 rounded-lg bg-[#0a0a0a]/50">
                  <div className="flex items-center gap-3">
                    <ToggleLeft className="h-5 w-5 text-[#0EA5E9]" />
                    <div>
                      <p className="text-sm font-medium text-[#e5e5e5]">{s.label}</p>
                      <p className="text-xs text-[#a3a3a3]">{s.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings((prev) => ({ ...prev, [s.key]: !prev[s.key] }))}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      settings[s.key] ? "bg-[#0EA5E9]" : "bg-[#1e1e1e]"
                    }`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      settings[s.key] ? "translate-x-5.5" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#e5e5e5] mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-[#0EA5E9]" />
              System Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between p-2">
                <span className="text-[#a3a3a3]">Platform</span>
                <span className="text-[#e5e5e5]">NovaShield v2.0.0</span>
              </div>
              <div className="flex justify-between p-2">
                <span className="text-[#a3a3a3]">Environment</span>
                <span className="text-[#10B981]">Production</span>
              </div>
              <div className="flex justify-between p-2">
                <span className="text-[#a3a3a3]">Database</span>
                <span className="text-[#e5e5e5]">PostgreSQL 16</span>
              </div>
              <div className="flex justify-between p-2">
                <span className="text-[#a3a3a3]">Runtime</span>
                <span className="text-[#e5e5e5]">Node.js 24</span>
              </div>
            </div>
          </div>
          <div className="text-center py-4">
            <p className="text-xs text-[#a3a3a3]">&copy; 2024&ndash;2026 Jeffrey W Williams LLC. All Rights Reserved.</p>
            <p className="text-xs text-[#a3a3a3] mt-1">NovaShield &mdash; Police Audit &amp; Accountability Platform | OmniDLOS Ecosystem (D4)</p>
          </div>
        </div>
      )}
    </div>
  );
}
