import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/queryClient";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Shield,
  AlertTriangle,
  Users,
  Bell,
  FileText,
  MessageSquare,
  Scale,
  EyeOff,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Activity,
} from "lucide-react";

// ---------- Types ----------
interface OverviewData {
  totalIncidents: number;
  activeComplaints: number;
  officersTracked: number;
  alertCount: number;
}

// ---------- Mock data ----------
const MOCK_OVERVIEW: OverviewData = {
  totalIncidents: 247,
  activeComplaints: 38,
  officersTracked: 156,
  alertCount: 12,
};

const complaintTrendData = [
  { month: "Jul", complaints: 28, resolved: 22 },
  { month: "Aug", complaints: 35, resolved: 27 },
  { month: "Sep", complaints: 42, resolved: 31 },
  { month: "Oct", complaints: 31, resolved: 29 },
  { month: "Nov", complaints: 44, resolved: 34 },
  { month: "Dec", complaints: 38, resolved: 30 },
  { month: "Jan", complaints: 52, resolved: 40 },
  { month: "Feb", complaints: 47, resolved: 38 },
  { month: "Mar", complaints: 39, resolved: 35 },
];

const forceBreakdownData = [
  { name: "Physical", value: 35, color: "#0EA5E9" },
  { name: "Taser", value: 22, color: "#06B6D4" },
  { name: "Firearm", value: 8, color: "#EF4444" },
  { name: "OC Spray", value: 18, color: "#F59E0B" },
  { name: "Baton", value: 12, color: "#10B981" },
  { name: "Restraint", value: 28, color: "#8B5CF6" },
];

const recentActivity = [
  {
    id: 1,
    type: "incident",
    title: "Use of Force Report Filed",
    department: "Metro PD - District 4",
    time: "12 minutes ago",
    severity: "high",
  },
  {
    id: 2,
    type: "complaint",
    title: "Citizen Complaint #2024-0892",
    department: "Metro PD - District 7",
    time: "34 minutes ago",
    severity: "medium",
  },
  {
    id: 3,
    type: "alert",
    title: "Pattern Alert: Repeat Officer Flagged",
    department: "County Sheriff",
    time: "1 hour ago",
    severity: "critical",
  },
  {
    id: 4,
    type: "resolution",
    title: "Complaint #2024-0845 Resolved",
    department: "Metro PD - District 2",
    time: "2 hours ago",
    severity: "low",
  },
  {
    id: 5,
    type: "incident",
    title: "Traffic Stop Escalation Reported",
    department: "State Highway Patrol",
    time: "3 hours ago",
    severity: "medium",
  },
  {
    id: 6,
    type: "alert",
    title: "Disparity Index Threshold Exceeded",
    department: "Metro PD - District 12",
    time: "4 hours ago",
    severity: "high",
  },
];

// ---------- Helpers ----------
const severityColor: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-green-500/20 text-green-400 border-green-500/30",
};

const typeIcon: Record<string, typeof Shield> = {
  incident: AlertTriangle,
  complaint: FileText,
  alert: Bell,
  resolution: Scale,
};

// ---------- Custom Tooltip ----------
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] px-4 py-3 shadow-xl">
      <p className="mb-1 text-sm font-medium text-white">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

// ---------- Component ----------
export default function Dashboard() {
  const { data } = useQuery<OverviewData>({
    queryKey: ["analytics", "overview"],
    queryFn: () => apiFetch<OverviewData>("/analytics/overview"),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const stats = data ?? MOCK_OVERVIEW;

  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const statCards = [
    {
      label: "Total Incidents",
      value: stats.totalIncidents,
      icon: AlertTriangle,
      change: "+12%",
      up: true,
      accent: "#0EA5E9",
    },
    {
      label: "Active Complaints",
      value: stats.activeComplaints,
      icon: FileText,
      change: "-8%",
      up: false,
      accent: "#06B6D4",
    },
    {
      label: "Officers Tracked",
      value: stats.officersTracked,
      icon: Users,
      change: "+3%",
      up: true,
      accent: "#10B981",
    },
    {
      label: "Alert Count",
      value: stats.alertCount,
      icon: Bell,
      change: "+24%",
      up: true,
      accent: "#F59E0B",
    },
  ];

  const quickActions = [
    { label: "Report Incident", icon: AlertTriangle, color: "#EF4444" },
    { label: "File Complaint", icon: FileText, color: "#0EA5E9" },
    { label: "Know Your Rights", icon: Scale, color: "#10B981" },
    { label: "Anonymous Tip", icon: EyeOff, color: "#8B5CF6" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ---- Header ---- */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text sm:text-4xl">
              NovaShield Dashboard
            </h1>
          </div>
          <p className="text-[#a3a3a3] ml-[52px]">
            Police Audit &amp; Accountability Platform &mdash; Real-time oversight analytics
          </p>
        </div>

        {/* ---- Stat Cards ---- */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="group relative rounded-xl border border-[#1e1e1e] bg-[#111111] p-5 transition-all duration-300 hover:border-[#2a2a2a] hover:shadow-lg hover:shadow-black/20"
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* glow */}
                <div
                  className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(ellipse at 50% 0%, ${card.accent}10, transparent 70%)`,
                  }}
                />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${card.accent}15` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: card.accent }} />
                    </div>
                    <span
                      className={`flex items-center gap-1 text-xs font-medium ${
                        card.up ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {card.up ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {card.change}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {hoveredCard === i
                      ? card.value.toLocaleString()
                      : card.value.toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-[#a3a3a3]">{card.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ---- Charts Row ---- */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Complaint Trends */}
          <div className="rounded-xl border border-[#1e1e1e] bg-[#111111] p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Complaint Trends</h2>
                <p className="text-sm text-[#a3a3a3]">Monthly complaint volume vs resolved</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#a3a3a3]">
                <Activity className="h-4 w-4 text-[#0EA5E9]" />
                Last 9 months
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={complaintTrendData}>
                  <defs>
                    <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                  <XAxis dataKey="month" stroke="#a3a3a3" fontSize={12} tickLine={false} />
                  <YAxis stroke="#a3a3a3" fontSize={12} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="complaints"
                    stroke="#0EA5E9"
                    fill="url(#blueGrad)"
                    strokeWidth={2}
                    name="Complaints"
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    stroke="#06B6D4"
                    fill="url(#cyanGrad)"
                    strokeWidth={2}
                    name="Resolved"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Use of Force Breakdown */}
          <div className="rounded-xl border border-[#1e1e1e] bg-[#111111] p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Use of Force Breakdown</h2>
                <p className="text-sm text-[#a3a3a3]">Force type distribution across reports</p>
              </div>
              <span className="rounded-full bg-[#1e1e1e] px-3 py-1 text-xs text-[#a3a3a3]">
                {forceBreakdownData.reduce((s, d) => s + d.value, 0)} total events
              </span>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={forceBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {forceBreakdownData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span className="text-xs text-[#a3a3a3]">{value}</span>
                    )}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111111",
                      border: "1px solid #1e1e1e",
                      borderRadius: "8px",
                      color: "#e5e5e5",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ---- Bottom Row: Activity + Quick Actions ---- */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Activity */}
          <div className="lg:col-span-2 rounded-xl border border-[#1e1e1e] bg-[#111111] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
              <button className="flex items-center gap-1 text-sm text-[#0EA5E9] hover:text-[#06B6D4] transition-colors">
                View All <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {recentActivity.map((item) => {
                const Icon = typeIcon[item.type] ?? Bell;
                return (
                  <div
                    key={item.id}
                    className="group flex items-start gap-4 rounded-lg border border-transparent p-3 transition-all hover:border-[#1e1e1e] hover:bg-[#0d0d0d]"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#1e1e1e]">
                      <Icon className="h-4 w-4 text-[#a3a3a3]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.title}</p>
                      <p className="text-xs text-[#a3a3a3]">{item.department}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${
                          severityColor[item.severity]
                        }`}
                      >
                        {item.severity}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-[#666]">
                        <Clock className="h-3 w-3" />
                        {item.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-[#1e1e1e] bg-[#111111] p-6">
            <h2 className="mb-5 text-lg font-semibold text-white">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    className="group flex w-full items-center gap-3 rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-4 text-left transition-all hover:border-[#2a2a2a] hover:bg-[#0f0f0f]"
                  >
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${action.color}15` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: action.color }} />
                    </div>
                    <span className="text-sm font-medium text-white">{action.label}</span>
                    <ArrowRight className="ml-auto h-4 w-4 text-[#666] transition-transform group-hover:translate-x-1 group-hover:text-[#a3a3a3]" />
                  </button>
                );
              })}
            </div>

            {/* Stats footer */}
            <div className="mt-6 rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-4">
              <p className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider mb-3">
                System Status
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#666]">API Status</span>
                  <span className="flex items-center gap-1.5 text-xs text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#666]">Data Freshness</span>
                  <span className="text-xs text-[#a3a3a3]">2 min ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#666]">Active Users</span>
                  <span className="text-xs text-[#a3a3a3]">24 online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
