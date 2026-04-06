import { useState, useEffect, useCallback } from "react";
import { apiFetch, apiPost } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: string;
  avatar_url?: string | null;
  department_id?: string | null;
}

let cachedUser: User | null = null;
let listeners: Array<() => void> = [];

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [isLoading, setIsLoading] = useState(!cachedUser);

  useEffect(() => {
    const listener = () => setUser(cachedUser);
    listeners.push(listener);

    if (!cachedUser) {
      apiFetch<{ user: User }>("/auth/me")
        .then((data) => {
          cachedUser = data.user;
          notifyListeners();
        })
        .catch(() => {
          cachedUser = null;
          notifyListeners();
        })
        .finally(() => setIsLoading(false));
    }

    return () => {
      listeners = listeners.filter((fn) => fn !== listener);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiPost<{ user: User }>("/auth/login", { email, password });
    cachedUser = data.user;
    setUser(data.user);
    notifyListeners();
  }, []);

  const register = useCallback(async (regData: { email: string; username: string; password: string; full_name: string; role?: string }) => {
    const data = await apiPost<{ user: User }>("/auth/register", regData);
    cachedUser = data.user;
    setUser(data.user);
    notifyListeners();
  }, []);

  const logout = useCallback(async () => {
    await apiPost("/auth/logout", {});
    cachedUser = null;
    setUser(null);
    notifyListeners();
  }, []);

  return { user, isLoading, login, register, logout };
}
