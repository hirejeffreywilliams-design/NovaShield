import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost, apiPut } from "../lib/api";
import {
  Video,
  Plus,
  Search,
  Filter,
  Clock,
  Eye,
  Flag,
  Globe,
  User,
  Calendar,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface FootageItem {
  id: number;
  officer_name: string;
  officer_badge: string;
  department: string;
  duration_minutes: number;
  status: "pending_review" | "under_review" | "reviewed" | "flagged" | "released";
  date_recorded: string;
  date_end: string;
  incident_id: number | null;
  review_notes: string;
  public_release_requested: boolean;
}

interface FootageStats {
  total: number;
  pending_review: number;
  reviewed: number;
  flagged: number;
  public_requests: number;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending_review: { label: "Pending Review", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
  under_review: { label: "Under Review", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
  reviewed: { label: "Reviewed", color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  flagged: { label: "Flagged", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
  released: { label: "Released", color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/20" },
};

const mockFootage: FootageItem[] = [
  {
    id: 1,
    officer_name: "Officer James Rodriguez",
    officer_badge: "BDG-4421",
    department: "Metro PD",
    duration_minutes: 47,
    status: "pending_review",
    date_recorded: "2026-03-28T14:30:00Z",
    date_end: "2026-03-28T15:17:00Z",
    incident_id: 1024,
    review_notes: "",
    public_release_requested: false,
  },
  {
    id: 2,
    officer_name: "Officer Sarah Chen",
    officer_badge: "BDG-3387",
    department: "Metro PD",
    duration_minutes: 23,
    status: "reviewed",
    date_recorded: "2026-03-27T09:15:00Z",
    date_end: "2026-03-27T09:38:00Z",
    incident_id: 1019,
    review_notes: "Routine traffic stop. No issues found. Officer followed all protocols.",
    public_release_requested: false,
  },
  {
    id: 3,
    officer_name: "Officer Michael Torres",
    officer_badge: "BDG-5590",
    department: "Central District",
    duration_minutes: 112,
    status: "flagged",
    date_recorded: "2026-03-25T22:10:00Z",
    date_end: "2026-03-26T00:02:00Z",
    incident_id: 1015,
    review_notes: "Excessive force concern during arrest. Escalation review needed.",
    public_release_requested: true,
  },
  {
    id: 4,
    officer_name: "Officer Emily Park",
    officer_badge: "BDG-2218",
    department: "Metro PD",
    duration_minutes: 35,
    status: "under_review",
    date_recorded: "2026-03-29T16:45:00Z",
    date_end: "2026-03-29T17:20:00Z",
    incident_id: null,
    review_notes: "Community engagement event footage. Reviewing for training material.",
    public_release_requested: false,
  },
  {
    id: 5,
    officer_name: "Officer David Kim",
    officer_badge: "BDG-6673",
    department: "West Precinct",
    duration_minutes: 58,
    status: "released",
    date_recorded: "2026-03-20T11:00:00Z",
    date_end: "2026-03-20T11:58:00Z",
    incident_id: 998,
    review_notes: "Released per FOIA request #FR-2026-0342.",
    public_release_requested: true,
  },
  {
    id: 6,
    officer_name: "Officer Angela Martinez",
    officer_badge: "BDG-1102",
    department: "Central District",
    duration_minutes: 19,
    status: "pending_review",
    date_recorded: "2026-04-01T08:30:00Z",
    date_end: "2026-04-01T08:49:00Z",
    incident_id: 1031,
    review_notes: "",
    public_release_requested: false,
  },
];

const mockStats: FootageStats = {
  total: 1243,
  pending_review: 87,
  reviewed: 1034,
  flagged: 42,
  public_requests: 18,
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.pending_review;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}
    >
      {config.label}
    </span>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function BodyCameraPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: footage } = useQuery<FootageItem[]>({
    queryKey: ["body-camera-footage"],
    queryFn: () => apiFetch<FootageItem[]>("/body-camera"),
    placeholderData: mockFootage,
  });

  const { data: stats } = useQuery<FootageStats>({
    queryKey: ["body-camera-stats"],
    queryFn: () => apiFetch<FootageStats>("/body-camera/stats"),
    placeholderData: mockStats,
  });

  const releaseRequest = useMutation({
    mutationFn: (id: number) => apiPost(`/body-camera/${id}/release-request`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["body-camera-footage"] }),
  });

  const items = (footage ?? mockFootage).filter((item) => {
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      item.officer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.officer_badge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const currentStats = stats ?? mockStats;

  const statCards = [
    { label: "Total Footage", value: currentStats.total.toLocaleString(), icon: Video, color: "text-[#0EA5E9]" },
    { label: "Pending Review", value: currentStats.pending_review.toString(), icon: Clock, color: "text-yellow-400" },
    { label: "Reviewed", value: currentStats.reviewed.toLocaleString(), icon: CheckCircle2, color: "text-green-400" },
    { label: "Flagged", value: currentStats.flagged.toString(), icon: Flag, color: "text-red-400" },
    { label: "Public Requests", value: currentStats.public_requests.toString(), icon: Globe, color: "text-cyan-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0EA5E9]/10">
            <Video className="h-5 w-5 text-[#0EA5E9]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#e5e5e5]">Body Camera Review</h1>
            <p className="text-sm text-[#a3a3a3]">Review and manage body camera footage</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 rounded-lg bg-[#0EA5E9] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0EA5E9]/90"
        >
          <Plus className="h-4 w-4" />
          Add Footage
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
            <div className="flex items-center gap-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-xs text-[#a3a3a3]">{stat.label}</span>
            </div>
            <p className={`mt-2 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Add Footage Form */}
      {showAddForm && (
        <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#e5e5e5]">Add New Footage</h2>
            <button onClick={() => setShowAddForm(false)} className="text-[#a3a3a3] hover:text-[#e5e5e5]">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm text-[#a3a3a3]">Officer Name</label>
              <input
                type="text"
                placeholder="Officer full name"
                className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2 text-sm text-[#e5e5e5] placeholder-[#525252] focus:border-[#0EA5E9] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[#a3a3a3]">Badge Number</label>
              <input
                type="text"
                placeholder="BDG-XXXX"
                className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2 text-sm text-[#e5e5e5] placeholder-[#525252] focus:border-[#0EA5E9] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[#a3a3a3]">Department</label>
              <input
                type="text"
                placeholder="Department name"
                className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2 text-sm text-[#e5e5e5] placeholder-[#525252] focus:border-[#0EA5E9] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[#a3a3a3]">Date Recorded</label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2 text-sm text-[#e5e5e5] focus:border-[#0EA5E9] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-[#a3a3a3]">Notes</label>
              <textarea
                rows={3}
                placeholder="Initial notes about the footage..."
                className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2 text-sm text-[#e5e5e5] placeholder-[#525252] focus:border-[#0EA5E9] focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-medium text-white hover:bg-[#0EA5E9]/90">
              Submit Footage
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525252]" />
          <input
            type="text"
            placeholder="Search by officer, badge, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#1e1e1e] bg-[#111111] py-2.5 pl-10 pr-4 text-sm text-[#e5e5e5] placeholder-[#525252] focus:border-[#0EA5E9] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#a3a3a3]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[#1e1e1e] bg-[#111111] px-3 py-2.5 text-sm text-[#e5e5e5] focus:border-[#0EA5E9] focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending_review">Pending Review</option>
            <option value="under_review">Under Review</option>
            <option value="reviewed">Reviewed</option>
            <option value="flagged">Flagged</option>
            <option value="released">Released</option>
          </select>
        </div>
      </div>

      {/* Footage Cards */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-[#1e1e1e] bg-[#111111] py-16">
          <Video className="mb-4 h-12 w-12 text-[#525252]" />
          <p className="text-lg font-medium text-[#a3a3a3]">No footage found</p>
          <p className="mt-1 text-sm text-[#525252]">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "No body camera footage has been added yet"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-5 transition-colors hover:border-[#2a2a2a]"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e1e1e]">
                    <User className="h-4 w-4 text-[#a3a3a3]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#e5e5e5]">{item.officer_name}</p>
                    <p className="text-xs text-[#a3a3a3]">
                      {item.officer_badge} &middot; {item.department}
                    </p>
                  </div>
                </div>
                <StatusBadge status={item.status} />
              </div>

              <div className="mb-3 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-xs text-[#a3a3a3]">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatDuration(item.duration_minutes)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#a3a3a3]">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(item.date_recorded).split(",")[0]}</span>
                </div>
              </div>

              <div className="mb-3 text-xs text-[#a3a3a3]">
                <span className="text-[#525252]">Range: </span>
                {formatDate(item.date_recorded)} &ndash; {formatDate(item.date_end)}
              </div>

              {item.incident_id && (
                <div className="mb-3 flex items-center gap-1.5 text-xs text-[#0EA5E9]">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Linked to Incident #{item.incident_id}
                </div>
              )}

              {item.review_notes && (
                <div className="mb-4 rounded-md border border-[#1e1e1e] bg-[#0a0a0a] p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-xs text-[#525252]">
                    <FileText className="h-3 w-3" />
                    Review Notes
                  </div>
                  <p className="text-xs leading-relaxed text-[#a3a3a3]">
                    {item.review_notes.length > 120
                      ? `${item.review_notes.slice(0, 120)}...`
                      : item.review_notes}
                  </p>
                </div>
              )}

              {!item.public_release_requested && item.status !== "released" && (
                <button
                  onClick={() => releaseRequest.mutate(item.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#06B6D4]/30 bg-[#06B6D4]/5 px-3 py-2 text-xs font-medium text-[#06B6D4] transition-colors hover:bg-[#06B6D4]/10"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Request Public Release
                </button>
              )}
              {item.public_release_requested && item.status !== "released" && (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-[#06B6D4]/20 bg-[#06B6D4]/5 px-3 py-2 text-xs text-[#06B6D4]/60">
                  <Eye className="h-3.5 w-3.5" />
                  Release Requested
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
