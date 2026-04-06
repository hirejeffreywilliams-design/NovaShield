import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost, apiPut } from "@/lib/queryClient";
import {
  Bell,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  AlertOctagon,
  TrendingUp,
  Users,
  MapPin,
  Clock,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  BarChart3,
  Shield,
} from "lucide-react";

interface Alert {
  id: number;
  type: "pattern" | "threshold" | "anomaly" | "geographic" | "officer" | "complaint_surge";
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  related_incident_ids: number[];
  metadata: Record<string, string>;
}

interface AlertStats {
  total: number;
  unread: number;
  critical: number;
  dismissed: number;
}

const severityConfig: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  info: { label: "Info", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20", icon: Info },
  warning: { label: "Warning", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20", icon: AlertTriangle },
  critical: { label: "Critical", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", icon: AlertOctagon },
};

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pattern: TrendingUp,
  threshold: BarChart3,
  anomaly: AlertTriangle,
  geographic: MapPin,
  officer: Users,
  complaint_surge: Shield,
};

const mockAlerts: Alert[] = [
  {
    id: 1,
    type: "pattern",
    title: "Recurring excessive force pattern detected",
    description:
      "Analysis detected 5 excessive force incidents in the Central District within the past 30 days, significantly above the 6-month average of 1.2 per month. Three incidents involve the same unit.",
    severity: "critical",
    is_read: false,
    is_dismissed: false,
    created_at: "2026-04-05T08:15:00Z",
    related_incident_ids: [1015, 1024, 1028, 1031, 1033],
    metadata: { district: "Central District", unit: "Patrol Unit 7" },
  },
  {
    id: 2,
    type: "complaint_surge",
    title: "Complaint surge: West Precinct",
    description:
      "Complaints against the West Precinct have increased 340% over the past 2 weeks compared to the same period last quarter. Most complaints cite unprofessional conduct.",
    severity: "critical",
    is_read: false,
    is_dismissed: false,
    created_at: "2026-04-04T14:30:00Z",
    related_incident_ids: [1020, 1022, 1025],
    metadata: { precinct: "West Precinct", increase: "340%" },
  },
  {
    id: 3,
    type: "officer",
    title: "Officer flagged: multiple complaints in 60 days",
    description:
      "Officer BDG-5590 has received 4 separate complaints within 60 days, triggering the early intervention threshold. Complaints include excessive force (2), discourtesy (1), and improper search (1).",
    severity: "warning",
    is_read: false,
    is_dismissed: false,
    created_at: "2026-04-03T11:00:00Z",
    related_incident_ids: [1010, 1015, 1018, 1023],
    metadata: { officer_badge: "BDG-5590", complaints: "4" },
  },
  {
    id: 4,
    type: "geographic",
    title: "Geographic hotspot: Downtown corridor",
    description:
      "The downtown corridor (Main St to 5th Ave) has seen a 200% increase in reported incidents this month. Concentrated between 10 PM and 2 AM on weekends.",
    severity: "warning",
    is_read: true,
    is_dismissed: false,
    created_at: "2026-04-02T09:45:00Z",
    related_incident_ids: [1012, 1016, 1021],
    metadata: { area: "Downtown Corridor", time_window: "10PM-2AM weekends" },
  },
  {
    id: 5,
    type: "threshold",
    title: "Body camera non-compliance above threshold",
    description:
      "Body camera activation rate has dropped below the 95% compliance threshold to 87% this week. Most non-compliance incidents occur during evening shifts.",
    severity: "warning",
    is_read: true,
    is_dismissed: false,
    created_at: "2026-04-01T16:20:00Z",
    related_incident_ids: [],
    metadata: { compliance_rate: "87%", threshold: "95%", shift: "Evening" },
  },
  {
    id: 6,
    type: "anomaly",
    title: "Unusual arrest rate anomaly detected",
    description:
      "Statistical anomaly detected: arrest rates for minor offenses in District 3 are 3.2 standard deviations above the citywide mean for the current quarter.",
    severity: "info",
    is_read: true,
    is_dismissed: false,
    created_at: "2026-03-31T10:00:00Z",
    related_incident_ids: [],
    metadata: { district: "District 3", deviation: "3.2 SD" },
  },
  {
    id: 7,
    type: "pattern",
    title: "Positive trend: de-escalation success rate improving",
    description:
      "De-escalation techniques were successfully employed in 82% of potentially violent encounters this month, up from 71% last quarter. Training program showing results.",
    severity: "info",
    is_read: true,
    is_dismissed: false,
    created_at: "2026-03-30T13:00:00Z",
    related_incident_ids: [],
    metadata: { current_rate: "82%", previous_rate: "71%" },
  },
  {
    id: 8,
    type: "complaint_surge",
    title: "Racial profiling complaints trending upward",
    description:
      "Racial profiling complaints have increased 25% over the past 3 months. Most reports originate from traffic stops in the North District.",
    severity: "critical",
    is_read: false,
    is_dismissed: false,
    created_at: "2026-04-05T06:00:00Z",
    related_incident_ids: [1027, 1029, 1032],
    metadata: { district: "North District", increase: "25%" },
  },
];

const mockStats: AlertStats = {
  total: 156,
  unread: 24,
  critical: 8,
  dismissed: 43,
};

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AlertsPage() {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [localReadState, setLocalReadState] = useState<Record<number, boolean>>({});
  const [localDismissed, setLocalDismissed] = useState<Record<number, boolean>>({});
  const queryClient = useQueryClient();

  const { data: alerts } = useQuery<Alert[]>({
    queryKey: ["alerts"],
    queryFn: () => apiFetch<Alert[]>("/alerts"),
    placeholderData: mockAlerts,
  });

  const { data: stats } = useQuery<AlertStats>({
    queryKey: ["alert-stats"],
    queryFn: () => apiFetch<AlertStats>("/alerts/stats"),
    placeholderData: mockStats,
  });

  const markRead = useMutation({
    mutationFn: (id: number) => apiPut(`/alerts/${id}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const dismissAlert = useMutation({
    mutationFn: (id: number) => apiPut(`/alerts/${id}/dismiss`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const handleMarkRead = (id: number) => {
    setLocalReadState((prev) => ({ ...prev, [id]: true }));
    markRead.mutate(id);
  };

  const handleDismiss = (id: number) => {
    setLocalDismissed((prev) => ({ ...prev, [id]: true }));
    dismissAlert.mutate(id);
  };

  const allAlerts = alerts ?? mockAlerts;
  const currentStats = stats ?? mockStats;

  const filteredAlerts = allAlerts.filter((alert) => {
    if (localDismissed[alert.id]) return false;
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    const matchesType = typeFilter === "all" || alert.type === typeFilter;
    const isRead = localReadState[alert.id] ?? alert.is_read;
    const matchesRead =
      readFilter === "all" ||
      (readFilter === "unread" && !isRead) ||
      (readFilter === "read" && isRead);
    const matchesSearch =
      searchQuery === "" ||
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesType && matchesRead && matchesSearch;
  });

  const unreadCount = allAlerts.filter((a) => !(localReadState[a.id] ?? a.is_read) && !localDismissed[a.id]).length;

  const statCards = [
    { label: "Total Alerts", value: currentStats.total.toString(), icon: Bell, color: "text-[#0EA5E9]" },
    { label: "Unread", value: unreadCount.toString(), icon: EyeOff, color: "text-yellow-400" },
    { label: "Critical", value: currentStats.critical.toString(), icon: AlertOctagon, color: "text-red-400" },
    { label: "Dismissed", value: currentStats.dismissed.toString(), icon: XCircle, color: "text-[#a3a3a3]" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0EA5E9]/10">
          <Bell className="h-5 w-5 text-[#0EA5E9]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#e5e5e5]">Pattern Alerts</h1>
            {unreadCount > 0 && (
              <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-sm text-[#a3a3a3]">Automated pattern detection and anomaly alerts</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
            <div className="flex items-center gap-2 text-xs text-[#a3a3a3]">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              {stat.label}
            </div>
            <p className={`mt-2 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525252]" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#1e1e1e] bg-[#111111] py-2.5 pl-10 pr-4 text-sm text-[#e5e5e5] placeholder-[#525252] focus:border-[#0EA5E9] focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-[#a3a3a3]" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-[#1e1e1e] bg-[#111111] px-3 py-2.5 text-sm text-[#e5e5e5] focus:border-[#0EA5E9] focus:outline-none"
          >
            <option value="all">All Severity</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-[#1e1e1e] bg-[#111111] px-3 py-2.5 text-sm text-[#e5e5e5] focus:border-[#0EA5E9] focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="pattern">Pattern</option>
            <option value="threshold">Threshold</option>
            <option value="anomaly">Anomaly</option>
            <option value="geographic">Geographic</option>
            <option value="officer">Officer</option>
            <option value="complaint_surge">Complaint Surge</option>
          </select>
          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
            className="rounded-lg border border-[#1e1e1e] bg-[#111111] px-3 py-2.5 text-sm text-[#e5e5e5] focus:border-[#0EA5E9] focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
      </div>

      {/* Alert Cards */}
      {filteredAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-[#1e1e1e] bg-[#111111] py-16">
          <Bell className="mb-4 h-12 w-12 text-[#525252]" />
          <p className="text-lg font-medium text-[#a3a3a3]">No alerts match your filters</p>
          <p className="mt-1 text-sm text-[#525252]">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const sevConfig = severityConfig[alert.severity];
            const SeverityIcon = sevConfig.icon;
            const TypeIcon = typeIcons[alert.type] || Bell;
            const isRead = localReadState[alert.id] ?? alert.is_read;

            return (
              <div
                key={alert.id}
                className={`rounded-lg border bg-[#111111] p-5 transition-colors ${
                  !isRead
                    ? "border-l-2 border-l-[#0EA5E9] border-t-[#1e1e1e] border-r-[#1e1e1e] border-b-[#1e1e1e]"
                    : "border-[#1e1e1e]"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${sevConfig.bg.split(" ")[0]}`}>
                    <TypeIcon className={`h-5 w-5 ${sevConfig.color}`} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className={`text-sm font-semibold ${!isRead ? "text-[#e5e5e5]" : "text-[#a3a3a3]"}`}>
                        {alert.title}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${sevConfig.bg} ${sevConfig.color}`}
                      >
                        <SeverityIcon className="h-3 w-3" />
                        {sevConfig.label}
                      </span>
                      {!isRead && (
                        <span className="h-2 w-2 rounded-full bg-[#0EA5E9]" />
                      )}
                    </div>

                    <p className="mb-3 text-xs leading-relaxed text-[#a3a3a3]">{alert.description}</p>

                    <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-[#525252]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatRelativeTime(alert.created_at)}
                      </span>
                      <span className="capitalize">{alert.type.replace("_", " ")}</span>
                    </div>

                    {/* Related Incidents */}
                    {alert.related_incident_ids.length > 0 && (
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-[#525252]">Related:</span>
                        {alert.related_incident_ids.map((incId) => (
                          <span
                            key={incId}
                            className="inline-flex items-center gap-1 rounded border border-[#1e1e1e] bg-[#0a0a0a] px-2 py-0.5 text-xs text-[#0EA5E9] hover:border-[#0EA5E9]/30 cursor-pointer"
                          >
                            <ExternalLink className="h-3 w-3" />
                            #{incId}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!isRead && (
                        <button
                          onClick={() => handleMarkRead(alert.id)}
                          className="flex items-center gap-1.5 rounded-md border border-[#1e1e1e] px-3 py-1.5 text-xs text-[#a3a3a3] transition-colors hover:border-[#0EA5E9]/30 hover:text-[#0EA5E9]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Mark as Read
                        </button>
                      )}
                      <button
                        onClick={() => handleDismiss(alert.id)}
                        className="flex items-center gap-1.5 rounded-md border border-[#1e1e1e] px-3 py-1.5 text-xs text-[#a3a3a3] transition-colors hover:border-red-400/30 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
