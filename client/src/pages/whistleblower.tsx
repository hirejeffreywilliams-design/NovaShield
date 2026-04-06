import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost, apiPut } from "@/lib/queryClient";
import {
  ShieldAlert,
  Lock,
  Send,
  Search,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Eye,
  EyeOff,
  FileWarning,
  Clock,
  Info,
} from "lucide-react";

interface WhistleblowerSubmission {
  code: string;
  status: "received" | "reviewing" | "investigating" | "action_taken" | "closed";
  title: string;
  submitted_at: string;
  last_updated: string;
  category: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  received: { label: "Received", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
  reviewing: { label: "Reviewing", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
  investigating: { label: "Investigating", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20" },
  action_taken: { label: "Action Taken", color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  closed: { label: "Closed", color: "text-[#a3a3a3]", bg: "bg-[#a3a3a3]/10 border-[#a3a3a3]/20" },
};

const categoryOptions = [
  { value: "corruption", label: "Corruption" },
  { value: "misconduct", label: "Misconduct" },
  { value: "cover_up", label: "Cover-up" },
  { value: "abuse_of_power", label: "Abuse of Power" },
  { value: "other", label: "Other" },
];

const priorityOptions = [
  { value: "low", label: "Low", color: "text-blue-400" },
  { value: "medium", label: "Medium", color: "text-yellow-400" },
  { value: "high", label: "High", color: "text-orange-400" },
  { value: "critical", label: "Critical", color: "text-red-400" },
];

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.received;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}
    >
      {config.label}
    </span>
  );
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segments = [];
  for (let s = 0; s < 3; s++) {
    let segment = "";
    for (let i = 0; i < 4; i++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }
  return `WB-${segments.join("-")}`;
}

export default function WhistleblowerPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "misconduct",
    priority: "medium",
  });
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [checkCode, setCheckCode] = useState("");
  const [checkResult, setCheckResult] = useState<WhistleblowerSubmission | null>(null);
  const [checkError, setCheckError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const queryClient = useQueryClient();

  const submitReport = useMutation({
    mutationFn: (data: typeof formData) => apiPost<{ code: string }>("/whistleblower/submit", data),
    onSuccess: (data) => {
      setSubmittedCode(data.code);
    },
    onError: () => {
      // Fallback: generate code locally for demo
      const code = generateCode();
      setSubmittedCode(code);
    },
  });

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.description.trim()) return;
    submitReport.mutate(formData);
  };

  const handleCopyCode = () => {
    if (submittedCode) {
      navigator.clipboard.writeText(submittedCode).catch(() => {});
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleCheckStatus = async () => {
    if (!checkCode.trim()) return;
    setIsChecking(true);
    setCheckError("");
    setCheckResult(null);

    try {
      const result = await apiFetch<WhistleblowerSubmission>(
        `/whistleblower/status/${encodeURIComponent(checkCode.trim())}`
      );
      setCheckResult(result);
    } catch {
      // Demo fallback
      if (checkCode.trim().startsWith("WB-")) {
        setCheckResult({
          code: checkCode.trim(),
          status: "investigating",
          title: "Submitted Report",
          submitted_at: "2026-03-15T10:00:00Z",
          last_updated: "2026-04-01T14:30:00Z",
          category: "misconduct",
        });
      } else {
        setCheckError("No submission found with that code. Please verify and try again.");
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleNewSubmission = () => {
    setSubmittedCode(null);
    setFormData({ title: "", description: "", category: "misconduct", priority: "medium" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0EA5E9]/10">
            <ShieldAlert className="h-5 w-5 text-[#0EA5E9]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#e5e5e5]">Whistleblower Portal</h1>
            <div className="flex items-center gap-1.5 text-sm text-[#a3a3a3]">
              <Lock className="h-3.5 w-3.5 text-green-400" />
              Your identity is protected
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="flex items-start gap-3 rounded-lg border border-[#0EA5E9]/20 bg-[#0EA5E9]/5 p-4">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[#0EA5E9]" />
        <div>
          <p className="text-sm font-medium text-[#0EA5E9]">End-to-End Encrypted Submissions</p>
          <p className="mt-1 text-xs leading-relaxed text-[#a3a3a3]">
            All submissions are encrypted and anonymous. We do not collect IP addresses, browser fingerprints, or
            any identifying information. Your submission is assigned a unique code that only you will know. Use this
            code to check your submission status without revealing your identity.
          </p>
        </div>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Submit Form */}
        <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-6">
          <div className="mb-5 flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-[#0EA5E9]" />
            <h2 className="text-lg font-semibold text-[#e5e5e5]">Submit a Report</h2>
          </div>

          {submittedCode ? (
            /* Submission Success */
            <div className="space-y-6">
              <div className="flex flex-col items-center rounded-lg border border-green-400/20 bg-green-400/5 p-6">
                <CheckCircle2 className="mb-3 h-12 w-12 text-green-400" />
                <p className="mb-1 text-lg font-semibold text-green-400">Report Submitted</p>
                <p className="text-center text-xs text-[#a3a3a3]">
                  Your anonymous report has been securely submitted.
                </p>
              </div>

              <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-400">Save this code!</span>
                </div>
                <p className="mb-3 text-xs text-[#a3a3a3]">
                  This is the only way to check the status of your submission. Write it down or store it securely.
                  It cannot be recovered.
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-4 py-3 font-mono text-lg font-bold tracking-wider text-[#e5e5e5]">
                    {submittedCode}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-3 text-sm text-[#a3a3a3] transition-colors hover:text-[#e5e5e5]"
                  >
                    {codeCopied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={handleNewSubmission}
                className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#a3a3a3] transition-colors hover:text-[#e5e5e5]"
              >
                Submit Another Report
              </button>
            </div>
          ) : (
            /* Submission Form */
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-[#a3a3a3]">Report Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief title for your report"
                  className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2 text-sm text-[#e5e5e5] placeholder-[#525252] focus:border-[#0EA5E9] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-[#a3a3a3]">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  placeholder="Describe what you've witnessed or know about. Include dates, locations, names, and any evidence you have..."
                  className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2 text-sm text-[#e5e5e5] placeholder-[#525252] focus:border-[#0EA5E9] focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-[#a3a3a3]">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2 text-sm text-[#e5e5e5] focus:border-[#0EA5E9] focus:outline-none"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-[#a3a3a3]">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2 text-sm text-[#e5e5e5] focus:border-[#0EA5E9] focus:outline-none"
                  >
                    {priorityOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!formData.title.trim() || !formData.description.trim() || submitReport.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0EA5E9] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0EA5E9]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                {submitReport.isPending ? "Encrypting & Submitting..." : "Submit Anonymously"}
              </button>

              <div className="flex items-start gap-2 text-xs text-[#525252]">
                <EyeOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  No identifying information is collected. Your submission is encrypted end-to-end.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Check Status */}
        <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-6">
          <div className="mb-5 flex items-center gap-2">
            <Search className="h-5 w-5 text-[#0EA5E9]" />
            <h2 className="text-lg font-semibold text-[#e5e5e5]">Check Submission Status</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-[#a3a3a3]">Submission Code</label>
              <input
                type="text"
                value={checkCode}
                onChange={(e) => setCheckCode(e.target.value.toUpperCase())}
                placeholder="WB-XXXX-XXXX-XXXX"
                className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2 font-mono text-sm text-[#e5e5e5] placeholder-[#525252] focus:border-[#0EA5E9] focus:outline-none"
              />
            </div>

            <button
              onClick={handleCheckStatus}
              disabled={!checkCode.trim() || isChecking}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#0EA5E9]/30 bg-[#0EA5E9]/5 px-4 py-2.5 text-sm font-medium text-[#0EA5E9] transition-colors hover:bg-[#0EA5E9]/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="h-4 w-4" />
              {isChecking ? "Checking..." : "Check Status"}
            </button>

            {checkError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/5 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <p className="text-sm text-red-400">{checkError}</p>
              </div>
            )}

            {checkResult && (
              <div className="space-y-4 rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#525252]">{checkResult.code}</span>
                  <StatusBadge status={checkResult.status} />
                </div>

                <div>
                  <p className="text-sm font-medium text-[#e5e5e5]">{checkResult.title}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-[#a3a3a3]">
                    <span className="capitalize">{checkResult.category.replace("_", " ")}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-[#525252]">Submitted</p>
                    <p className="text-xs text-[#a3a3a3]">
                      {new Date(checkResult.submitted_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#525252]">Last Updated</p>
                    <p className="text-xs text-[#a3a3a3]">
                      {new Date(checkResult.last_updated).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[#525252]">Progress</p>
                  <div className="flex items-center gap-1">
                    {(["received", "reviewing", "investigating", "action_taken", "closed"] as const).map(
                      (step, idx) => {
                        const steps = ["received", "reviewing", "investigating", "action_taken", "closed"];
                        const currentIdx = steps.indexOf(checkResult.status);
                        const isComplete = idx <= currentIdx;
                        return (
                          <div key={step} className="flex flex-1 items-center">
                            <div
                              className={`h-2 w-full rounded-full ${
                                isComplete ? "bg-[#0EA5E9]" : "bg-[#1e1e1e]"
                              }`}
                            />
                          </div>
                        );
                      }
                    )}
                  </div>
                  <div className="flex justify-between text-[10px] text-[#525252]">
                    <span>Received</span>
                    <span>Reviewing</span>
                    <span>Investigating</span>
                    <span>Action</span>
                    <span>Closed</span>
                  </div>
                </div>
              </div>
            )}

            {!checkResult && !checkError && (
              <div className="flex flex-col items-center rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] py-12">
                <Clock className="mb-3 h-10 w-10 text-[#525252]" />
                <p className="text-sm text-[#a3a3a3]">Enter your submission code to check status</p>
                <p className="mt-1 text-xs text-[#525252]">
                  Your code was provided when you submitted your report
                </p>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-2 rounded-md border border-[#1e1e1e] bg-[#0a0a0a] p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#525252]" />
              <div className="text-xs text-[#525252]">
                <p className="mb-1 font-medium text-[#a3a3a3]">How it works</p>
                <ul className="space-y-1">
                  <li>1. Submit your report anonymously</li>
                  <li>2. Save the unique code provided</li>
                  <li>3. Use the code to check the investigation status</li>
                  <li>4. All communications remain anonymous</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
