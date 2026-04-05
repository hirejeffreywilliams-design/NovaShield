import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost, apiPut } from "../lib/api";
import {
  FileSignature,
  Plus,
  Search,
  TrendingUp,
  Users,
  Target,
  X,
  CheckCircle2,
  Award,
  XCircle,
  Pen,
} from "lucide-react";

interface Petition {
  id: number;
  title: string;
  description: string;
  category: string;
  target_policy: string;
  signature_count: number;
  signature_goal: number;
  status: "active" | "achieved" | "closed" | "rejected";
  created_at: string;
  author: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  achieved: { label: "Achieved", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
  closed: { label: "Closed", color: "text-[#a3a3a3]", bg: "bg-[#a3a3a3]/10 border-[#a3a3a3]/20" },
  rejected: { label: "Rejected", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
};

const petitionCategories = [
  "Use of Force Policy",
  "Body Camera Requirements",
  "Community Oversight",
  "Training Standards",
  "Accountability Measures",
  "Transparency",
  "De-escalation",
  "Other",
];

const mockPetitions: Petition[] = [
  {
    id: 1,
    title: "Mandate De-escalation Training for All Officers",
    description:
      "Require all patrol officers to complete 40 hours of annual de-escalation training, including scenario-based exercises and mental health crisis response protocols.",
    category: "Training Standards",
    target_policy: "Department Training Policy Section 4.2",
    signature_count: 4250,
    signature_goal: 5000,
    status: "active",
    created_at: "2026-02-15T10:00:00Z",
    author: "CommunityFirst",
  },
  {
    id: 2,
    title: "Independent Civilian Review Board with Subpoena Power",
    description:
      "Establish a fully independent civilian review board with the power to subpoena documents, compel testimony, and recommend disciplinary action for officer misconduct.",
    category: "Community Oversight",
    target_policy: "City Charter Amendment 12-B",
    signature_count: 10000,
    signature_goal: 10000,
    status: "achieved",
    created_at: "2026-01-10T08:00:00Z",
    author: "AccountabilityNow",
  },
  {
    id: 3,
    title: "Ban No-Knock Warrants in Residential Areas",
    description:
      "Prohibit the use of no-knock warrants for all residential searches, requiring officers to announce their presence and wait a minimum of 30 seconds before entry.",
    category: "Use of Force Policy",
    target_policy: "Search & Seizure Policy 7.1",
    signature_count: 7800,
    signature_goal: 10000,
    status: "active",
    created_at: "2026-03-01T12:00:00Z",
    author: "SafeHomesInitiative",
  },
  {
    id: 4,
    title: "Publish All Use-of-Force Reports Within 72 Hours",
    description:
      "Require the department to publicly release all use-of-force incident reports within 72 hours of the event, with appropriate redactions for ongoing investigations.",
    category: "Transparency",
    target_policy: "Public Records Policy 3.5",
    signature_count: 2100,
    signature_goal: 7500,
    status: "active",
    created_at: "2026-03-20T09:00:00Z",
    author: "TransparencyProject",
  },
  {
    id: 5,
    title: "Require Mental Health Professionals on Crisis Calls",
    description:
      "Co-dispatch licensed mental health professionals alongside officers for all calls involving mental health crises, substance abuse, or homelessness.",
    category: "De-escalation",
    target_policy: "Dispatch Policy 2.8",
    signature_count: 6200,
    signature_goal: 8000,
    status: "active",
    created_at: "2026-02-28T14:00:00Z",
    author: "MentalHealthMatters",
  },
  {
    id: 6,
    title: "Early Intervention System for Repeat Complaints",
    description:
      "Implement an automated early intervention system that flags officers with 3+ complaints within 12 months for mandatory counseling and retraining.",
    category: "Accountability Measures",
    target_policy: "Internal Affairs SOP 5.3",
    signature_count: 890,
    signature_goal: 5000,
    status: "closed",
    created_at: "2025-12-01T10:00:00Z",
    author: "OfficerAccountability",
  },
  {
    id: 7,
    title: "Eliminate Qualified Immunity at City Level",
    description:
      "Pass a city ordinance removing qualified immunity protections for officers found to have violated citizens' constitutional rights.",
    category: "Accountability Measures",
    target_policy: "City Ordinance 44-C",
    signature_count: 3200,
    signature_goal: 15000,
    status: "rejected",
    created_at: "2026-01-20T11:00:00Z",
    author: "JusticeReform",
  },
];

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.active;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}
    >
      {status === "achieved" && <Award className="h-3 w-3" />}
      {status === "rejected" && <XCircle className="h-3 w-3" />}
      {config.label}
    </span>
  );
}

function ProgressBar({ current, goal }: { current: number; goal: number }) {
  const percentage = Math.min((current / goal) * 100, 100);
  // Gradient from blue to green as it approaches goal
  const getColor = () => {
    if (percentage >= 90) return "from-[#0EA5E9] to-green-400";
    if (percentage >= 60) return "from-[#0EA5E9] to-[#06B6D4]";
    return "from-[#0EA5E9] to-[#0EA5E9]";
  };

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-[#a3a3a3]">
          {current.toLocaleString()} / {goal.toLocaleString()} signatures
        </span>
        <span className="font-medium text-[#e5e5e5]">{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#1e1e1e]">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getColor()} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function PetitionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [localSignatures, setLocalSignatures] = useState<Record<number, number>>({});
  const [newPetition, setNewPetition] = useState({
    title: "",
    description: "",
    category: "Other",
    target_policy: "",
    signature_goal: 5000,
  });
  const queryClient = useQueryClient();

  const { data: petitions } = useQuery<Petition[]>({
    queryKey: ["petitions"],
    queryFn: () => apiFetch<Petition[]>("/petitions"),
    placeholderData: mockPetitions,
  });

  const signPetition = useMutation({
    mutationFn: (id: number) => apiPost(`/petitions/${id}/sign`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["petitions"] }),
  });

  const createPetition = useMutation({
    mutationFn: (data: typeof newPetition) => apiPost("/petitions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["petitions"] });
      setShowCreateForm(false);
      setNewPetition({ title: "", description: "", category: "Other", target_policy: "", signature_goal: 5000 });
    },
  });

  const handleSign = (id: number) => {
    setLocalSignatures((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
    signPetition.mutate(id);
  };

  const allPetitions = petitions ?? mockPetitions;
  const filteredPetitions = allPetitions.filter(
    (p) =>
      searchQuery === "" ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activePetitions = allPetitions.filter((p) => p.status === "active");
  const totalSignatures = allPetitions.reduce((sum, p) => sum + p.signature_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0EA5E9]/10">
            <FileSignature className="h-5 w-5 text-[#0EA5E9]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#e5e5e5]">Petitions for Change</h1>
            <p className="text-sm text-[#a3a3a3]">Sign and create petitions for policy reform</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 rounded-lg bg-[#0EA5E9] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0EA5E9]/90"
        >
          <Plus className="h-4 w-4" />
          Start Petition
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
          <div className="flex items-center gap-2 text-xs text-[#a3a3a3]">
            <FileSignature className="h-4 w-4 text-[#0EA5E9]" />
            Total Petitions
          </div>
          <p className="mt-2 text-2xl font-bold text-[#0EA5E9]">{allPetitions.length}</p>
        </div>
        <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
          <div className="flex items-center gap-2 text-xs text-[#a3a3a3]">
            <TrendingUp className="h-4 w-4 text-green-400" />
            Active
          </div>
          <p className="mt-2 text-2xl font-bold text-green-400">{activePetitions.length}</p>
        </div>
        <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
          <div className="flex items-center gap-2 text-xs text-[#a3a3a3]">
            <Users className="h-4 w-4 text-[#06B6D4]" />
            Total Signatures
          </div>
          <p className="mt-2 text-2xl font-bold text-[#06B6D4]">{totalSignatures.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
          <div className="flex items-center gap-2 text-xs text-[#a3a3a3]">
            <Award className="h-4 w-4 text-yellow-400" />
            Goals Achieved
          </div>
          <p className="mt-2 text-2xl font-bold text-yellow-400">
            {allPetitions.filter((p) => p.status === "achieved").length}
          </p>
        </div>
      </div>

      {/* Create Petition Form */}
      {showCreateForm && (
        <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#e5e5e5]">Start a New Petition</h2>
            <button onClick={() => setShowCreateForm(false)} className="text-[#a3a3a3] hover:text-[#e5e5e5]">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-[#a3a3a3]">Petition Title</label>
              <input
                type="text"
                value={newPetition.title}
                onChange={(e) => setNewPetition({ ...newPetition, title: e.target.value })}
                placeholder="What change do you want to see?"
                className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2 text-sm text-[#e5e5e5] placeholder-[#525252] focus:border-[#0EA5E9] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-[#a3a3a3]">Description</label>
              <textarea
                value={newPetition.description}
                onChange={(e) => setNewPetition({ ...newPetition, description: e.target.value })}
                rows={4}
                placeholder="Describe the change you're advocating for and why it matters..."
                className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2 text-sm text-[#e5e5e5] placeholder-[#525252] focus:border-[#0EA5E9] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[#a3a3a3]">Category</label>
              <select
                value={newPetition.category}
                onChange={(e) => setNewPetition({ ...newPetition, category: e.target.value })}
                className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2 text-sm text-[#e5e5e5] focus:border-[#0EA5E9] focus:outline-none"
              >
                {petitionCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[#a3a3a3]">Target Policy</label>
              <input
                type="text"
                value={newPetition.target_policy}
                onChange={(e) => setNewPetition({ ...newPetition, target_policy: e.target.value })}
                placeholder="e.g., Department Policy Section 4.2"
                className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2 text-sm text-[#e5e5e5] placeholder-[#525252] focus:border-[#0EA5E9] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[#a3a3a3]">Signature Goal</label>
              <input
                type="number"
                value={newPetition.signature_goal}
                onChange={(e) =>
                  setNewPetition({ ...newPetition, signature_goal: parseInt(e.target.value) || 0 })
                }
                min={100}
                className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2 text-sm text-[#e5e5e5] focus:border-[#0EA5E9] focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => createPetition.mutate(newPetition)}
              disabled={!newPetition.title.trim() || !newPetition.description.trim()}
              className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-medium text-white hover:bg-[#0EA5E9]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Petition
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525252]" />
        <input
          type="text"
          placeholder="Search petitions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-[#1e1e1e] bg-[#111111] py-2.5 pl-10 pr-4 text-sm text-[#e5e5e5] placeholder-[#525252] focus:border-[#0EA5E9] focus:outline-none"
        />
      </div>

      {/* Petition Cards */}
      {filteredPetitions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-[#1e1e1e] bg-[#111111] py-16">
          <FileSignature className="mb-4 h-12 w-12 text-[#525252]" />
          <p className="text-lg font-medium text-[#a3a3a3]">No petitions found</p>
          <p className="mt-1 text-sm text-[#525252]">Start the first petition for change</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredPetitions.map((petition) => {
            const effectiveSignatures = petition.signature_count + (localSignatures[petition.id] || 0);
            return (
              <div
                key={petition.id}
                className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-5 transition-colors hover:border-[#2a2a2a]"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-[#e5e5e5] leading-snug">{petition.title}</h3>
                  <StatusBadge status={petition.status} />
                </div>

                <p className="mb-3 text-xs leading-relaxed text-[#a3a3a3]">
                  {petition.description.length > 150
                    ? `${petition.description.slice(0, 150)}...`
                    : petition.description}
                </p>

                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#1e1e1e] bg-[#0a0a0a] px-2 py-0.5 text-xs text-[#a3a3a3]">
                    <Target className="h-3 w-3" />
                    {petition.category}
                  </span>
                  {petition.target_policy && (
                    <span className="text-xs text-[#525252]">{petition.target_policy}</span>
                  )}
                </div>

                <div className="mb-4">
                  <ProgressBar current={effectiveSignatures} goal={petition.signature_goal} />
                </div>

                {petition.status === "active" && (
                  <button
                    onClick={() => handleSign(petition.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    <Pen className="h-4 w-4" />
                    Sign Petition
                  </button>
                )}
                {petition.status === "achieved" && (
                  <div className="flex items-center justify-center gap-2 rounded-lg border border-yellow-400/20 bg-yellow-400/5 px-4 py-2.5 text-sm font-medium text-yellow-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Goal Achieved
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
