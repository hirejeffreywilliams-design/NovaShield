import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import {
  Building2,
  Users,
  FileWarning,
  Siren,
  MapPin,
  ChevronDown,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Shield,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Department {
  id: string;
  name: string;
  jurisdiction: string;
  state: string;
  officer_count: number;
  complaint_count: number;
  use_of_force_count: number;
  accountability_score: number;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_DEPARTMENTS: Department[] = [
  {
    id: "dept-1",
    name: "New York Police Department",
    jurisdiction: "New York City",
    state: "NY",
    officer_count: 36008,
    complaint_count: 4283,
    use_of_force_count: 1872,
    accountability_score: 62,
  },
  {
    id: "dept-2",
    name: "Los Angeles Police Department",
    jurisdiction: "City of Los Angeles",
    state: "CA",
    officer_count: 9974,
    complaint_count: 2104,
    use_of_force_count: 943,
    accountability_score: 71,
  },
  {
    id: "dept-3",
    name: "Chicago Police Department",
    jurisdiction: "City of Chicago",
    state: "IL",
    officer_count: 11944,
    complaint_count: 3621,
    use_of_force_count: 1547,
    accountability_score: 45,
  },
  {
    id: "dept-4",
    name: "Houston Police Department",
    jurisdiction: "City of Houston",
    state: "TX",
    officer_count: 5362,
    complaint_count: 987,
    use_of_force_count: 412,
    accountability_score: 78,
  },
  {
    id: "dept-5",
    name: "Phoenix Police Department",
    jurisdiction: "City of Phoenix",
    state: "AZ",
    officer_count: 2818,
    complaint_count: 643,
    use_of_force_count: 298,
    accountability_score: 83,
  },
  {
    id: "dept-6",
    name: "Philadelphia Police Department",
    jurisdiction: "City of Philadelphia",
    state: "PA",
    officer_count: 6336,
    complaint_count: 1892,
    use_of_force_count: 821,
    accountability_score: 38,
  },
];

const ALL_STATES = Array.from(
  new Set(MOCK_DEPARTMENTS.map((d) => d.state))
).sort();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getScoreColor(score: number): string {
  if (score >= 80) return "#10B981"; // green
  if (score >= 60) return "#F59E0B"; // yellow
  if (score >= 40) return "#F97316"; // orange
  return "#EF4444"; // red
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Improvement";
  return "Critical";
}

function getScoreBadgeClasses(score: number): string {
  if (score >= 80) return "bg-green-500/10 text-green-400 border-green-500/20";
  if (score >= 60) return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
  if (score >= 40) return "bg-orange-500/10 text-orange-400 border-orange-500/20";
  return "bg-red-500/10 text-red-400 border-red-500/20";
}

function formatNumber(n: number): string {
  if (n >= 1000) {
    return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return n.toLocaleString();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DepartmentsPage() {
  const [stateFilter, setStateFilter] = useState<string>("all");

  // Fetch from API with mock data fallback
  const { data: departments = MOCK_DEPARTMENTS, isLoading } = useQuery<Department[]>({
    queryKey: ["department-rankings"],
    queryFn: () => apiFetch<Department[]>("/analytics/department-rankings"),
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Use fetched data or fall back to mock
  const deptData = departments.length > 0 ? departments : MOCK_DEPARTMENTS;

  // Compute available states from the actual data
  const states = useMemo(() => {
    return Array.from(new Set(deptData.map((d) => d.state))).sort();
  }, [deptData]);

  // Filter
  const filtered = useMemo(() => {
    if (stateFilter === "all") return deptData;
    return deptData.filter((d) => d.state === stateFilter);
  }, [deptData, stateFilter]);

  // Summary stats
  const summary = useMemo(() => {
    const avg =
      filtered.length > 0
        ? Math.round(
            filtered.reduce((sum, d) => sum + d.accountability_score, 0) /
              filtered.length
          )
        : 0;
    const totalOfficers = filtered.reduce((sum, d) => sum + d.officer_count, 0);
    const totalComplaints = filtered.reduce(
      (sum, d) => sum + d.complaint_count,
      0
    );
    return { avg, totalOfficers, totalComplaints };
  }, [filtered]);

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
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Department Scorecards
              </h1>
              <p className="mt-0.5 text-sm text-[#a3a3a3]">
                Accountability ratings and performance metrics for law
                enforcement agencies
              </p>
            </div>
          </div>

          {/* State filter */}
          <div className="relative">
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="h-10 appearance-none rounded-lg border border-[#1e1e1e] bg-[#111111] pl-3 pr-9 text-sm text-[#e5e5e5] outline-none ring-[#0EA5E9] transition-colors focus:border-[#0EA5E9]/50 focus:ring-1"
            >
              <option value="all">All States</option>
              {states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a3a3a3]" />
          </div>
        </div>

        {/* Summary Bar */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="glass-card rounded-xl border border-[#1e1e1e] bg-[#111111] p-5">
            <div className="mb-2 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#0EA5E9]" />
              <span className="text-xs font-medium uppercase tracking-wider text-[#a3a3a3]">
                Avg. Score
              </span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white">
                {summary.avg}%
              </span>
              <span
                className={`mb-1 inline-flex items-center gap-1 text-xs font-medium ${
                  summary.avg >= 60 ? "text-green-400" : "text-red-400"
                }`}
              >
                {summary.avg >= 60 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {getScoreLabel(summary.avg)}
              </span>
            </div>
          </div>

          <div className="glass-card rounded-xl border border-[#1e1e1e] bg-[#111111] p-5">
            <div className="mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#06B6D4]" />
              <span className="text-xs font-medium uppercase tracking-wider text-[#a3a3a3]">
                Total Officers
              </span>
            </div>
            <span className="text-3xl font-bold text-white">
              {summary.totalOfficers.toLocaleString()}
            </span>
          </div>

          <div className="glass-card rounded-xl border border-[#1e1e1e] bg-[#111111] p-5">
            <div className="mb-2 flex items-center gap-2">
              <FileWarning className="h-4 w-4 text-[#F59E0B]" />
              <span className="text-xs font-medium uppercase tracking-wider text-[#a3a3a3]">
                Total Complaints
              </span>
            </div>
            <span className="text-3xl font-bold text-white">
              {summary.totalComplaints.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1e1e1e] border-t-[#0EA5E9]" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filtered.length === 0 && (
          <div className="glass-card rounded-xl border border-[#1e1e1e] bg-[#111111] p-16 text-center">
            <Building2 className="mx-auto mb-4 h-14 w-14 text-[#333]" />
            <h3 className="mb-2 text-lg font-semibold text-[#e5e5e5]">
              No departments found
            </h3>
            <p className="text-sm text-[#a3a3a3]">
              No departments match the selected state filter.
            </p>
          </div>
        )}

        {/* Department Scorecard Grid */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {filtered
              .sort((a, b) => b.accountability_score - a.accountability_score)
              .map((dept) => {
                const scoreColor = getScoreColor(dept.accountability_score);
                const scoreLabel = getScoreLabel(dept.accountability_score);
                const scoreBadge = getScoreBadgeClasses(
                  dept.accountability_score
                );

                return (
                  <div
                    key={dept.id}
                    className="glass-card group relative rounded-xl border border-[#1e1e1e] bg-[#111111] p-6 transition-all duration-300 hover:border-[#2a2a2a] hover:shadow-lg hover:shadow-black/20"
                  >
                    {/* Glow effect */}
                    <div
                      className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
                      style={{
                        background: `radial-gradient(ellipse at 50% 0%, ${scoreColor}08, transparent 70%)`,
                      }}
                    />

                    <div className="relative">
                      {/* Department Name & Location */}
                      <div className="mb-5 flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xl font-bold text-white">
                            {dept.name}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1e1e1e] bg-[#0a0a0a] px-2.5 py-0.5 text-xs text-[#a3a3a3]">
                              <MapPin className="h-3 w-3" />
                              {dept.jurisdiction}
                            </span>
                            <span className="inline-flex items-center rounded-full border border-[#1e1e1e] bg-[#0a0a0a] px-2.5 py-0.5 text-xs font-medium text-[#a3a3a3]">
                              {dept.state}
                            </span>
                          </div>
                        </div>

                        {/* Score prominent display */}
                        <div className="flex flex-col items-center ml-4">
                          <span
                            className="text-4xl font-black"
                            style={{ color: scoreColor }}
                          >
                            {dept.accountability_score}
                          </span>
                          <span
                            className={`mt-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${scoreBadge}`}
                          >
                            {scoreLabel}
                          </span>
                        </div>
                      </div>

                      {/* Metrics Row */}
                      <div className="mb-5 grid grid-cols-3 gap-3">
                        <div className="rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-3 text-center">
                          <Users className="mx-auto mb-1.5 h-4 w-4 text-[#0EA5E9]" />
                          <p className="text-lg font-bold text-white">
                            {formatNumber(dept.officer_count)}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-[#666]">
                            Officers
                          </p>
                        </div>
                        <div className="rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-3 text-center">
                          <FileWarning className="mx-auto mb-1.5 h-4 w-4 text-[#F59E0B]" />
                          <p className="text-lg font-bold text-white">
                            {formatNumber(dept.complaint_count)}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-[#666]">
                            Complaints
                          </p>
                        </div>
                        <div className="rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-3 text-center">
                          <Siren className="mx-auto mb-1.5 h-4 w-4 text-[#EF4444]" />
                          <p className="text-lg font-bold text-white">
                            {formatNumber(dept.use_of_force_count)}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-[#666]">
                            Use of Force
                          </p>
                        </div>
                      </div>

                      {/* Accountability Score Progress Bar */}
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-[#a3a3a3]">
                            <Shield className="h-3.5 w-3.5" />
                            Accountability Score
                          </span>
                          <span
                            className="text-sm font-bold"
                            style={{ color: scoreColor }}
                          >
                            {dept.accountability_score}%
                          </span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-[#1e1e1e]">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${dept.accountability_score}%`,
                              backgroundColor: scoreColor,
                              boxShadow: `0 0 8px ${scoreColor}40`,
                            }}
                          />
                        </div>
                        <div className="mt-1.5 flex justify-between text-[10px] text-[#444]">
                          <span>0</span>
                          <span>25</span>
                          <span>50</span>
                          <span>75</span>
                          <span>100</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
