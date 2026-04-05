import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost } from "../lib/api";
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  Clock,
  FileText,
  MapPin,
  Plus,
  Search,
  Shield,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Incident {
  id: string;
  title: string;
  description: string;
  status: "recording" | "pending" | "analyzed" | "reported";
  location: string;
  latitude: number | null;
  longitude: number | null;
  officer_badge: string;
  officer_name: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface NewIncidentPayload {
  title: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  officer_badge: string;
  officer_name: string;
  notes: string;
}

type StatusFilter = "all" | Incident["status"];
type SortField = "created_at" | "title" | "status";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  Incident["status"],
  { label: string; bg: string; text: string; dot: string }
> = {
  recording: {
    label: "Recording",
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    dot: "bg-yellow-400",
  },
  pending: {
    label: "Pending",
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    dot: "bg-orange-400",
  },
  analyzed: {
    label: "Analyzed",
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    dot: "bg-sky-400",
  },
  reported: {
    label: "Reported",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
};

const EMPTY_FORM: NewIncidentPayload = {
  title: "",
  description: "",
  location: "",
  latitude: null,
  longitude: null,
  officer_badge: "",
  officer_name: "",
  notes: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: Incident["status"] }) {
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IncidentsPage() {
  const queryClient = useQueryClient();

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<NewIncidentPayload>({ ...EMPTY_FORM });

  // Detail expand
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Data fetching
  const {
    data: incidents = [],
    isLoading,
    isError,
  } = useQuery<Incident[]>({
    queryKey: ["incidents"],
    queryFn: () => apiFetch<Incident[]>("/incidents"),
  });

  const createMutation = useMutation({
    mutationFn: (payload: NewIncidentPayload) =>
      apiPost<Incident>("/incidents", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      setDialogOpen(false);
      setForm({ ...EMPTY_FORM });
    },
  });

  // Filter & sort
  const filtered = incidents
    .filter((i) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          i.title.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q) ||
          i.officer_name.toLowerCase().includes(q) ||
          i.officer_badge.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortField === "created_at")
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortField === "title") return a.title.localeCompare(b.title);
      return a.status.localeCompare(b.status);
    });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(form);
  }

  function updateField<K extends keyof NewIncidentPayload>(
    key: K,
    value: NewIncidentPayload[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Incident Reports
            </h1>
            <p className="mt-1 text-sm text-[#a3a3a3]">
              Track and manage law enforcement incident reports
            </p>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0EA5E9] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0EA5E9]/90"
          >
            <Plus className="h-4 w-4" />
            Report New Incident
          </button>
        </div>

        {/* Filter bar */}
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[#1e1e1e] bg-[#111111] p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a3a3a3]" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-md border border-[#1e1e1e] bg-[#0a0a0a] pl-9 pr-3 text-sm text-[#e5e5e5] placeholder-[#a3a3a3] outline-none ring-[#0EA5E9] focus:ring-1"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-9 appearance-none rounded-md border border-[#1e1e1e] bg-[#0a0a0a] pl-3 pr-8 text-sm text-[#e5e5e5] outline-none ring-[#0EA5E9] focus:ring-1"
            >
              <option value="all">All Statuses</option>
              <option value="recording">Recording</option>
              <option value="pending">Pending</option>
              <option value="analyzed">Analyzed</option>
              <option value="reported">Reported</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a3a3a3]" />
          </div>

          <div className="relative">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="h-9 appearance-none rounded-md border border-[#1e1e1e] bg-[#0a0a0a] pl-3 pr-8 text-sm text-[#e5e5e5] outline-none ring-[#0EA5E9] focus:ring-1"
            >
              <option value="created_at">Newest First</option>
              <option value="title">Title A-Z</option>
              <option value="status">Status</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a3a3a3]" />
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1e1e1e] border-t-[#0EA5E9]" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-400" />
            <p className="text-sm text-red-400">
              Failed to load incidents. Please try again later.
            </p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="rounded-xl border border-[#1e1e1e] bg-[#111111] p-12 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-[#a3a3a3]" />
            <h3 className="mb-1 text-lg font-medium">No incidents found</h3>
            <p className="text-sm text-[#a3a3a3]">
              {search || statusFilter !== "all"
                ? "Try adjusting your filters."
                : "Click \"Report New Incident\" to create your first report."}
            </p>
          </div>
        )}

        {/* Incident cards */}
        <div className="space-y-3">
          {filtered.map((incident) => {
            const isExpanded = expandedId === incident.id;
            return (
              <div
                key={incident.id}
                className="group rounded-xl border border-[#1e1e1e] bg-[#111111] transition-colors hover:border-[#0EA5E9]/30"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : incident.id)}
                  className="w-full px-5 py-4 text-left"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-semibold">
                          {incident.title}
                        </h3>
                        <StatusBadge status={incident.status} />
                      </div>
                      <p className="mb-3 line-clamp-2 text-sm text-[#a3a3a3]">
                        {incident.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#a3a3a3]">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {incident.location}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Shield className="h-3.5 w-3.5" />
                          {incident.officer_name} (#{incident.officer_badge})
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(incident.created_at)}
                        </span>
                      </div>
                    </div>
                    <ChevronDown
                      className={`mt-1 h-5 w-5 shrink-0 text-[#a3a3a3] transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-[#1e1e1e] px-5 py-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-[#a3a3a3]">
                          Description
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {incident.description}
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-[#a3a3a3]">
                            Coordinates
                          </h4>
                          <p className="text-sm">
                            {incident.latitude != null && incident.longitude != null
                              ? `${incident.latitude}, ${incident.longitude}`
                              : "Not provided"}
                          </p>
                        </div>
                        <div>
                          <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-[#a3a3a3]">
                            Notes
                          </h4>
                          <p className="text-sm">
                            {incident.notes || "No additional notes."}
                          </p>
                        </div>
                        <div>
                          <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-[#a3a3a3]">
                            Last Updated
                          </h4>
                          <p className="text-sm">
                            {formatDate(incident.updated_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* New Incident Dialog                                                */}
      {/* ----------------------------------------------------------------- */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDialogOpen(false)}
          />
          <div className="relative z-10 mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#1e1e1e] bg-[#111111] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Report New Incident</h2>
              <button
                onClick={() => setDialogOpen(false)}
                className="rounded-md p-1 text-[#a3a3a3] hover:bg-[#1e1e1e] hover:text-[#e5e5e5]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="h-9 w-full rounded-md border border-[#1e1e1e] bg-[#0a0a0a] px-3 text-sm outline-none ring-[#0EA5E9] focus:ring-1"
                  placeholder="Brief incident title"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  className="w-full rounded-md border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2 text-sm outline-none ring-[#0EA5E9] focus:ring-1"
                  placeholder="Detailed description of the incident"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Location</label>
                <input
                  required
                  value={form.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  className="h-9 w-full rounded-md border border-[#1e1e1e] bg-[#0a0a0a] px-3 text-sm outline-none ring-[#0EA5E9] focus:ring-1"
                  placeholder="Street address or intersection"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={form.latitude ?? ""}
                    onChange={(e) =>
                      updateField("latitude", e.target.value ? Number(e.target.value) : null)
                    }
                    className="h-9 w-full rounded-md border border-[#1e1e1e] bg-[#0a0a0a] px-3 text-sm outline-none ring-[#0EA5E9] focus:ring-1"
                    placeholder="e.g. 34.0522"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={form.longitude ?? ""}
                    onChange={(e) =>
                      updateField("longitude", e.target.value ? Number(e.target.value) : null)
                    }
                    className="h-9 w-full rounded-md border border-[#1e1e1e] bg-[#0a0a0a] px-3 text-sm outline-none ring-[#0EA5E9] focus:ring-1"
                    placeholder="e.g. -118.2437"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Officer Badge #</label>
                  <input
                    required
                    value={form.officer_badge}
                    onChange={(e) => updateField("officer_badge", e.target.value)}
                    className="h-9 w-full rounded-md border border-[#1e1e1e] bg-[#0a0a0a] px-3 text-sm outline-none ring-[#0EA5E9] focus:ring-1"
                    placeholder="Badge number"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Officer Name</label>
                  <input
                    required
                    value={form.officer_name}
                    onChange={(e) => updateField("officer_name", e.target.value)}
                    className="h-9 w-full rounded-md border border-[#1e1e1e] bg-[#0a0a0a] px-3 text-sm outline-none ring-[#0EA5E9] focus:ring-1"
                    placeholder="Full name"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  className="w-full rounded-md border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2 text-sm outline-none ring-[#0EA5E9] focus:ring-1"
                  placeholder="Additional notes (optional)"
                />
              </div>

              {createMutation.isError && (
                <p className="text-sm text-red-400">
                  {(createMutation.error as Error).message || "Failed to create incident."}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="rounded-lg border border-[#1e1e1e] px-4 py-2 text-sm font-medium text-[#a3a3a3] hover:bg-[#1e1e1e]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0EA5E9]/90 disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Report"
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
