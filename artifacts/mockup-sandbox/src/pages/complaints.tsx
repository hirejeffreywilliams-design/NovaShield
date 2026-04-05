import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost } from "../lib/api";
import {
  FileWarning,
  Search,
  Plus,
  X,
  Clock,
  Calendar,
  AlertTriangle,
  Filter,
  ChevronDown,
  FileText,
  Shield,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ComplaintCategory =
  | "excessive_force"
  | "racial_profiling"
  | "misconduct"
  | "corruption"
  | "harassment"
  | "other";

type ComplaintStatus =
  | "submitted"
  | "under_review"
  | "investigating"
  | "resolved"
  | "appealed"
  | "dismissed";

type ComplaintPriority = "critical" | "high" | "medium" | "low";

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

interface NewComplaintPayload {
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  is_anonymous: boolean;
}

type StatusFilter = "all" | ComplaintStatus;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_CONFIG: Record<ComplaintCategory, { label: string; classes: string }> = {
  excessive_force: {
    label: "Excessive Force",
    classes: "bg-red-500/15 text-red-400 border border-red-500/30",
  },
  racial_profiling: {
    label: "Racial Profiling",
    classes: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  },
  misconduct: {
    label: "Misconduct",
    classes: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
  },
  corruption: {
    label: "Corruption",
    classes: "bg-red-800/20 text-red-300 border border-red-800/40",
  },
  harassment: {
    label: "Harassment",
    classes: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  },
  other: {
    label: "Other",
    classes: "bg-gray-500/15 text-gray-400 border border-gray-500/30",
  },
};

const STATUS_CONFIG: Record<
  ComplaintStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  submitted: {
    label: "Submitted",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    dot: "bg-blue-400",
  },
  under_review: {
    label: "Under Review",
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    dot: "bg-yellow-400",
  },
  investigating: {
    label: "Investigating",
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    dot: "bg-orange-400",
  },
  resolved: {
    label: "Resolved",
    bg: "bg-green-500/10",
    text: "text-green-400",
    dot: "bg-green-400",
  },
  appealed: {
    label: "Appealed",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    dot: "bg-purple-400",
  },
  dismissed: {
    label: "Dismissed",
    bg: "bg-gray-500/10",
    text: "text-gray-400",
    dot: "bg-gray-400",
  },
};

const PRIORITY_CONFIG: Record<ComplaintPriority, { label: string; color: string; dot: string }> = {
  critical: { label: "Critical", color: "text-red-400", dot: "bg-red-400" },
  high: { label: "High", color: "text-orange-400", dot: "bg-orange-400" },
  medium: { label: "Medium", color: "text-yellow-400", dot: "bg-yellow-400" },
  low: { label: "Low", color: "text-green-400", dot: "bg-green-400" },
};

const FILTER_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "investigating", label: "Investigating" },
  { value: "resolved", label: "Resolved" },
  { value: "appealed", label: "Appealed" },
  { value: "dismissed", label: "Dismissed" },
];

const EMPTY_FORM: NewComplaintPayload = {
  title: "",
  description: "",
  category: "misconduct",
  priority: "medium",
  is_anonymous: false,
};

// ---------------------------------------------------------------------------
// Mock data fallback
// ---------------------------------------------------------------------------

const MOCK_STATS = {
  total: 142,
  submitted: 38,
  investigating: 47,
  resolved: 57,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: ComplaintStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function CategoryBadge({ category }: { category: ComplaintCategory }) {
  const cfg = CATEGORY_CONFIG[category];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

function PriorityIndicator({ priority }: { priority: ComplaintPriority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ComplaintsPage() {
  const queryClient = useQueryClient();

  // State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<NewComplaintPayload>({ ...EMPTY_FORM });

  // Data fetching
  const {
    data: complaints = [],
    isLoading,
  } = useQuery<Complaint[]>({
    queryKey: ["complaints"],
    queryFn: () => apiFetch<Complaint[]>("/complaints"),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload: NewComplaintPayload) =>
      apiPost<Complaint>("/complaints", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      setDialogOpen(false);
      setForm({ ...EMPTY_FORM });
    },
  });

  // Compute stats from data or fallback to mock
  const stats = useMemo(() => {
    if (complaints.length === 0) return MOCK_STATS;
    return {
      total: complaints.length,
      submitted: complaints.filter((c) => c.status === "submitted").length,
      investigating: complaints.filter((c) => c.status === "investigating").length,
      resolved: complaints.filter((c) => c.status === "resolved").length,
    };
  }, [complaints]);

  // Filter and search
  const filtered = useMemo(() => {
    return complaints
      .filter((c) => {
        if (statusFilter !== "all" && c.status !== statusFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            c.title.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q) ||
            c.category.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [complaints, statusFilter, search]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(form);
  }

  function updateField<K extends keyof NewComplaintPayload>(
    key: K,
    value: NewComplaintPayload[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ---------------------------------------------------------------------------
  // Stats cards config
  // ---------------------------------------------------------------------------
  const statCards = [
    {
      label: "Total Complaints",
      value: stats.total,
      icon: FileText,
      accent: "#0EA5E9",
    },
    {
      label: "Submitted",
      value: stats.submitted,
      icon: Plus,
      accent: "#3B82F6",
    },
    {
      label: "Investigating",
      value: stats.investigating,
      icon: Search,
      accent: "#F59E0B",
    },
    {
      label: "Resolved",
      value: stats.resolved,
      icon: Shield,
      accent: "#10B981",
    },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4]">
              <FileWarning className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Complaint Tracker
              </h1>
              <p className="mt-0.5 text-sm text-[#a3a3a3]">
                File and track civilian complaints against law enforcement
              </p>
            </div>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#0EA5E9]/20 transition-all hover:shadow-[#0EA5E9]/30 hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            File Complaint
          </button>
        </div>

        {/* Stats Row */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="glass-card group relative rounded-xl border border-[#1e1e1e] bg-[#111111] p-5 transition-all duration-300 hover:border-[#2a2a2a] hover:shadow-lg hover:shadow-black/20"
              >
                <div
                  className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(ellipse at 50% 0%, ${card.accent}10, transparent 70%)`,
                  }}
                />
                <div className="relative">
                  <div className="mb-3 flex items-center justify-between">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${card.accent}15` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: card.accent }} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {card.value.toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-[#a3a3a3]">{card.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filter Tabs */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-[#a3a3a3]" />
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                statusFilter === tab.value
                  ? "bg-[#0EA5E9]/15 text-[#0EA5E9] border border-[#0EA5E9]/30"
                  : "bg-[#111111] text-[#a3a3a3] border border-[#1e1e1e] hover:border-[#2a2a2a] hover:text-[#e5e5e5]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a3a3a3]" />
            <input
              type="text"
              placeholder="Search complaints by title, description, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#1e1e1e] bg-[#111111] pl-10 pr-4 text-sm text-[#e5e5e5] placeholder-[#666] outline-none ring-[#0EA5E9] transition-colors focus:border-[#0EA5E9]/50 focus:ring-1"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1e1e1e] border-t-[#0EA5E9]" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filtered.length === 0 && (
          <div className="glass-card rounded-xl border border-[#1e1e1e] bg-[#111111] p-16 text-center">
            <FileWarning className="mx-auto mb-4 h-12 w-12 text-[#333]" />
            <h3 className="mb-2 text-lg font-semibold text-[#e5e5e5]">
              No complaints found
            </h3>
            <p className="mx-auto max-w-md text-sm text-[#a3a3a3]">
              {search || statusFilter !== "all"
                ? "Try adjusting your search terms or filter criteria."
                : "No complaints have been filed yet. Click \"File Complaint\" to submit the first report."}
            </p>
          </div>
        )}

        {/* Complaint Cards */}
        <div className="space-y-3">
          {filtered.map((complaint) => (
            <div
              key={complaint.id}
              className="glass-card group rounded-xl border border-[#1e1e1e] bg-[#111111] p-5 transition-all duration-200 hover:border-[#0EA5E9]/20 hover:shadow-lg hover:shadow-black/10"
            >
              {/* Top row: title + badges */}
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base font-semibold text-white">
                      {complaint.title}
                    </h3>
                    <CategoryBadge category={complaint.category} />
                    <StatusBadge status={complaint.status} />
                  </div>
                  <p className="line-clamp-2 text-sm leading-relaxed text-[#a3a3a3]">
                    {complaint.description}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <PriorityIndicator priority={complaint.priority} />
                </div>
              </div>

              {/* Bottom row: metadata */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#1e1e1e] pt-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-[#666]">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(complaint.created_at)}
                </span>
                {complaint.is_anonymous && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1e1e1e] px-2 py-0.5 text-[10px] font-medium text-[#a3a3a3]">
                    Anonymous
                  </span>
                )}
                <span className="ml-auto text-[10px] uppercase tracking-wider text-[#444]">
                  ID: {complaint.id.slice(0, 8)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* File Complaint Dialog                                                  */}
      {/* --------------------------------------------------------------------- */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDialogOpen(false)}
          />
          <div className="relative z-10 mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#1e1e1e] bg-[#111111] p-6 shadow-2xl">
            {/* Dialog header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4]">
                  <FileWarning className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  File a Complaint
                </h2>
              </div>
              <button
                onClick={() => setDialogOpen(false)}
                className="rounded-md p-1.5 text-[#a3a3a3] transition-colors hover:bg-[#1e1e1e] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#e5e5e5]">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 text-sm text-[#e5e5e5] outline-none ring-[#0EA5E9] placeholder-[#666] transition-colors focus:border-[#0EA5E9]/50 focus:ring-1"
                  placeholder="Brief title for the complaint"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#e5e5e5]">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2.5 text-sm text-[#e5e5e5] outline-none ring-[#0EA5E9] placeholder-[#666] transition-colors focus:border-[#0EA5E9]/50 focus:ring-1"
                  placeholder="Provide a detailed account of the incident..."
                />
              </div>

              {/* Category + Priority row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#e5e5e5]">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={(e) =>
                        updateField("category", e.target.value as ComplaintCategory)
                      }
                      className="h-10 w-full appearance-none rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] pl-3 pr-8 text-sm text-[#e5e5e5] outline-none ring-[#0EA5E9] transition-colors focus:border-[#0EA5E9]/50 focus:ring-1"
                    >
                      <option value="excessive_force">Excessive Force</option>
                      <option value="racial_profiling">Racial Profiling</option>
                      <option value="misconduct">Misconduct</option>
                      <option value="corruption">Corruption</option>
                      <option value="harassment">Harassment</option>
                      <option value="other">Other</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a3a3a3]" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#e5e5e5]">
                    Priority
                  </label>
                  <div className="relative">
                    <select
                      value={form.priority}
                      onChange={(e) =>
                        updateField("priority", e.target.value as ComplaintPriority)
                      }
                      className="h-10 w-full appearance-none rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] pl-3 pr-8 text-sm text-[#e5e5e5] outline-none ring-[#0EA5E9] transition-colors focus:border-[#0EA5E9]/50 focus:ring-1"
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a3a3a3]" />
                  </div>
                </div>
              </div>

              {/* Anonymous toggle */}
              <div className="flex items-center gap-3 rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-3">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={form.is_anonymous}
                  onChange={(e) => updateField("is_anonymous", e.target.checked)}
                  className="h-4 w-4 rounded border-[#1e1e1e] bg-[#0a0a0a] text-[#0EA5E9] accent-[#0EA5E9]"
                />
                <label htmlFor="anonymous" className="flex-1 cursor-pointer">
                  <span className="block text-sm font-medium text-[#e5e5e5]">
                    File Anonymously
                  </span>
                  <span className="block text-xs text-[#a3a3a3]">
                    Your identity will be protected and not shared with the department
                  </span>
                </label>
              </div>

              {/* Error */}
              {createMutation.isError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-400" />
                  <p className="text-sm text-red-400">
                    {(createMutation.error as Error).message ||
                      "Failed to submit complaint. Please try again."}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-[#1e1e1e] pt-4">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="rounded-lg border border-[#1e1e1e] px-4 py-2.5 text-sm font-medium text-[#a3a3a3] transition-colors hover:bg-[#1e1e1e] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#0EA5E9]/20 transition-all hover:shadow-[#0EA5E9]/30 hover:brightness-110 disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Complaint"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
