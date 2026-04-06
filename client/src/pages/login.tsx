import { useState } from "react";
import { useLocation } from "wouter";
import { Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      setLocation("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold gradient-text">NovaShield</h1>
            <p className="text-sm text-[#a3a3a3]">Police Audit & Accountability</p>
          </div>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#e5e5e5] text-center">Sign In</h2>

          {error && (
            <div className="rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20 px-3 py-2 text-sm text-[#ef4444]">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-[#a3a3a3]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2
                         text-sm text-[#e5e5e5] placeholder-[#a3a3a3]
                         focus:border-[#0EA5E9] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-[#a3a3a3]">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2
                         text-sm text-[#e5e5e5] placeholder-[#a3a3a3]
                         focus:border-[#0EA5E9] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg gradient-primary px-4 py-2.5
                       text-sm font-semibold text-white
                       transition-opacity hover:opacity-90
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
