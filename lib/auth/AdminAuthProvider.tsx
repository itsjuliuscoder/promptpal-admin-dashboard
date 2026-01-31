"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import axios from "@/lib/config/axios-config";

export interface AdminProfile {
  id: string;
  username: string;
  email: string;
  role?: string;
  permissions?: string[];
}

interface AdminAuthContextValue {
  admin: AdminProfile | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

const ADMIN_PROFILE_KEY = "admin_profile";
const ADMIN_TOKEN_KEY = "admin_token";

const getInitialProfile = (): AdminProfile | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ADMIN_PROFILE_KEY);
  return raw ? (JSON.parse(raw) as AdminProfile) : null;
};

const getInitialToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
};

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(getInitialProfile);
  const [token, setToken] = useState<string | null>(getInitialToken);

  const login = useCallback(async (username: string, password: string) => {
    const response = await axios.post("/admin/login", { username, password });
    const { token: jwt, admin: profile } = response.data;
    localStorage.setItem(ADMIN_TOKEN_KEY, jwt);
    localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(profile));
    setToken(jwt);
    setAdmin(profile);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_PROFILE_KEY);
    setToken(null);
    setAdmin(null);
  }, []);

  const value = useMemo(
    () => ({
      admin,
      token,
      login,
      logout,
    }),
    [admin, token, login, logout]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}

