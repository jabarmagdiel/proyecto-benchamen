"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { AuthUser, User } from "@/types";
import { authApi } from "@/lib/api";

interface AuthContextType {
  user: AuthUser | null;
  profile: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  reloadProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed: AuthUser = JSON.parse(stored);
        setUser(parsed);
        // Cargar perfil completo
        const res = await authApi.me();
        setProfile(res.data);
      }
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const reloadProfile = async () => {
    try {
      const res = await authApi.me();
      setProfile(res.data);
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed: AuthUser = JSON.parse(stored);
        parsed.name = res.data.name;
        parsed.email = res.data.email;
        parsed.company_id = res.data.company_id;
        localStorage.setItem("user", JSON.stringify(parsed));
        setUser(parsed);
      }
    } catch (e) {
      console.error("Error reloading profile", e);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const data: AuthUser = res.data;
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
    // Cargar perfil
    const profileRes = await authApi.me();
    setProfile(profileRes.data);
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
    setProfile(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAdmin: user?.role === "administrador",
        login,
        logout,
        reloadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
