import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost } from "../lib/api";
import {
  UserCheck,
  Search,
  Plus,
  X,
  Clock,
  Calendar,
  Shield,
  AlertTriangle,
  Hash,
  Users,
  Building,
  ChevronDown,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Officer {
  id: string;
  name: string;
  badge_no: string;
  agency: string;
  rank: string;
  department: string;
  notes: string;
  incident_count: number;
  created_at: string;
  updated_at: string;
}

interface NewOfficerPayload {
  name: string;
  badge_no: string;
  agency: string;
  rank: string;
  department: string;
  notes: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RANK_COLORS: Record<string, string> = {
  Chief: "bg-red-500/15 text-red-400 border-red-500/30",
  Captain: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  Lieutenant: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Sergeant: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Detective: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Corporal: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  Officer: "bg-green-500/15 text-green-400 border-green-500/30",
  Deputy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const DEFAULT_RANK_STYLE = "bg-gray-500/15 text-gray-400 border-gray-500/30";

const EMPTY_FORM: NewOfficerPayload = {
  name: "",
  badge_no: "",
  agency: "",
  rank: "Officer",
  department: "",
  notes: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function RankBadge({ rank }: { rank: string }) {
  const classes = RANK_COLORS[rank] ?? DEFAULT_RANK_STYLE;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      {rank}
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

export default function OfficersPage() {
  const queryClient = useQueryClient();

  // State
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<NewOfficerPayload>({ ...EMPTY_FORM });

  // Data fetching
  const {
    data: officers = [],
    isLoading,
  } = useQuery<Officer[]>({
    queryKey: ["officers"],
    queryFn: () => apiFetch<Officer[]>("/officers"),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload: NewOfficerPayload) =>
      apiPost<Officer>("/officers", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["officers"] });
      setDialogOpen(false);
      setForm({ ...EMPTY_FORM });
    },
  });

  // Filter by search
  const filtered = useMemo(() => {
    if (!search) return officers;
    const q = search.toLowerCase();
    return officers.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.badge_no.toLowerCase().includes(q) ||
        o.agency.toLowerCase().includes(q) ||
        o.department.toLowerCase().includes(q) ||
        o.rank.toLowerCase().includes(q)
    );
  }, [officers, search]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(form);
  }

  function updateField<K extends keyof NewOfficerPayload>(
    key: K,
    value: NewOfficerPayload[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

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
              <UserCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Officer Database
              </h1>
              <p className="mt-0.5 text-sm text-[#a3a3a3]">
                Track and manage law enforcement officer accountability records
              </p>
            </div>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#0EA5E9]/20 transition-all hover:shadow-[#0EA5E9]/30 hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Add Officer Record
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a3a3a3]" />
            <input
              type="text"
              placeholder="Search by name, badge number, agency, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-lg border border-[#1e1e1e] bg-[#111111] pl-10 pr-4 text-sm text-[#e5e5e5] placeholder-[#666] outline-none ring-[#0EA5E9] transition-colors focus:border-[#0EA5E9]/50 focus:ring-1"
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
            <Shield className="mx-auto mb-4 h-14 w-14 text-[#333]" />
            <h3 className="mb-2 text-lg font-semibold text-[#e5e5e5]">
              No officers found
            </h3>
            <p className="mx-auto max-w-md text-sm text-[#a3a3a3]">
              {search
                ? "No officers match your search criteria. Try a different name or badge number."
                : "No officer records have been added yet. Click \"Add Officer Record\" to begin tracking."}
            </p>
          </div>
        )}

        {/* Officer Cards Grid */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((officer) => (
              <div
                key={officer.id}
                className="glass-card group relative rounded-xl border border-[#1e1e1e] bg-[#111111] p-5 transition-all duration-300 hover:border-[#0EA5E9]/30 hover:shadow-lg hover:shadow-[#0EA5E9]/5"
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 0%, rgba(14,165,233,0.06), transparent 70%)",
                  }}
                />

                <div className="relative">
                  {/* Name and Rank */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-semibold text-white">
                        {officer.name}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-2 text-sm text-[#a3a3a3]">
                        <Hash className="h-3.5 w-3.5 flex-shrink-0 text-[#0EA5E9]" />
                        <span className="font-mono">{officer.badge_no}</span>
                      </div>
                    </div>
                    <RankBadge rank={officer.rank} />
                  </div>

                  {/* Agency + Department */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-3.5 w-3.5 flex-shrink-0 text-[#666]" />
                      <span className="truncate text-[#a3a3a3]">
                        {officer.agency}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-3.5 w-3.5 flex-shrink-0 text-[#666]" />
                      <span className="truncate text-[#a3a3a3]">
                        {officer.department}
                      </span>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="mb-4 flex items-center gap-4 rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        className={`h-4 w-4 ${
                          officer.incident_count > 5
                            ? "text-red-400"
                            : officer.incident_count > 2
                            ? "text-orange-400"
                            : "text-green-400"
                        }`}
                      />
                      <div>
                        <p className="text-lg font-bold text-white">
                          {officer.incident_count}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-[#666]">
                          Incidents
                        </p>
                      </div>
                    </div>
                    {officer.incident_count > 5 && (
                      <span className="ml-auto rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400 border border-red-500/20">
                        High Risk
                      </span>
                    )}
                    {officer.incident_count >= 3 && officer.incident_count <= 5 && (
                      <span className="ml-auto rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-400 border border-orange-500/20">
                        Monitor
                      </span>
                    )}
                    {officer.incident_count < 3 && (
                      <span className="ml-auto rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400 border border-green-500/20">
                        Low Risk
                      </span>
                    )}
                  </div>

                  {/* Footer: date */}
                  <div className="flex items-center gap-1.5 text-xs text-[#555]">
                    <Calendar className="h-3 w-3" />
                    Added {formatDate(officer.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* Add Officer Dialog                                                     */}
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
                  <UserCheck className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Add Officer Record
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
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#e5e5e5]">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 text-sm text-[#e5e5e5] outline-none ring-[#0EA5E9] placeholder-[#666] transition-colors focus:border-[#0EA5E9]/50 focus:ring-1"
                  placeholder="Officer full name"
                />
              </div>

              {/* Badge + Agency row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#e5e5e5]">
                    Badge Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    value={form.badge_no}
                    onChange={(e) => updateField("badge_no", e.target.value)}
                    className="h-10 w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 text-sm text-[#e5e5e5] outline-none ring-[#0EA5E9] placeholder-[#666] transition-colors focus:border-[#0EA5E9]/50 focus:ring-1"
                    placeholder="e.g. 4521"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#e5e5e5]">
                    Agency <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    value={form.agency}
                    onChange={(e) => updateField("agency", e.target.value)}
                    className="h-10 w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 text-sm text-[#e5e5e5] outline-none ring-[#0EA5E9] placeholder-[#666] transition-colors focus:border-[#0EA5E9]/50 focus:ring-1"
                    placeholder="e.g. NYPD"
                  />
                </div>
              </div>

              {/* Rank + Department row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#e5e5e5]">
                    Rank
                  </label>
                  <div className="relative">
                    <select
                      value={form.rank}
                      onChange={(e) => updateField("rank", e.target.value)}
                      className="h-10 w-full appearance-none rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] pl-3 pr-8 text-sm text-[#e5e5e5] outline-none ring-[#0EA5E9] transition-colors focus:border-[#0EA5E9]/50 focus:ring-1"
                    >
                      <option value="Chief">Chief</option>
                      <option value="Captain">Captain</option>
                      <option value="Lieutenant">Lieutenant</option>
                      <option value="Sergeant">Sergeant</option>
                      <option value="Detective">Detective</option>
                      <option value="Corporal">Corporal</option>
                      <option value="Officer">Officer</option>
                      <option value="Deputy">Deputy</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a3a3a3]" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#e5e5e5]">
                    Department <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    value={form.department}
                    onChange={(e) => updateField("department", e.target.value)}
                    className="h-10 w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 text-sm text-[#e5e5e5] outline-none ring-[#0EA5E9] placeholder-[#666] transition-colors focus:border-[#0EA5E9]/50 focus:ring-1"
                    placeholder="e.g. Patrol Division"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#e5e5e5]">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2.5 text-sm text-[#e5e5e5] outline-none ring-[#0EA5E9] placeholder-[#666] transition-colors focus:border-[#0EA5E9]/50 focus:ring-1"
                  placeholder="Additional notes about this officer (optional)"
                />
              </div>

              {/* Error */}
              {createMutation.isError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-400" />
                  <p className="text-sm text-red-400">
                    {(createMutation.error as Error).message ||
                      "Failed to add officer. Please try again."}
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
                      Saving...
                    </>
                  ) : (
                    "Add Officer"
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
