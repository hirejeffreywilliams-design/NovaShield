import { useState, useEffect, useCallback, type ReactNode } from "react";
import { AuthContext, type User } from "../lib/auth";
import { apiPost, apiFetch } from "../lib/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("novashield_token"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      apiFetch<User>("/auth/me")
        .then(setUser)
        .catch(() => { localStorage.removeItem("novashield_token"); setToken(null); })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiPost<{ user: User; token: string }>("/auth/login", { email, password });
    localStorage.setItem("novashield_token", res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (data: { email: string; username: string; password: string; full_name: string; role?: string }) => {
    const res = await apiPost<{ user: User; token: string }>("/auth/register", data);
    localStorage.setItem("novashield_token", res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("novashield_token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext>
  );
}
