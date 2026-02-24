"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiAlertCircle } from "react-icons/fi";
import { useAdminAuth } from "@/lib/auth/AdminAuthProvider";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
      router.replace("/");
    } catch (err) {
      setError("Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[700px] flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg p-6">
        <div className="flex flex-col items-center">
          {/* Logo - Light mode */}
          <div className="dark:hidden">
            <Image
              src="/images/logo.png"
              alt="PromptPal Logo"
              width={180}
              height={60}
              priority
              className="h-auto"
            />
          </div>
          {/* Logo - Dark mode */}
          <div className="hidden dark:block">
            <Image
              src="/images/logo-dark.png"
              alt="PromptPal Logo"
              width={180}
              height={60}
              priority
              className="h-auto"
            />
          </div>
        </div>
        <div className="space-y-2 text-center -mt-2">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">PromptPal Admin</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to manage the platform.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="admin-username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Username
            </label>
            <input
              id="admin-username"
              name="username"
              autoComplete="username"
              className="admin-input w-full focus:ring-2 focus:ring-[#A84C34] focus:border-[#A84C34] rounded-lg px-3 py-2.5 min-h-[44px] border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="admin-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="admin-input w-full focus:outline-none focus:ring-2 focus:ring-[#A84C34] focus:border-[#A84C34] rounded-lg px-3 py-2.5 min-h-[44px] border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400" role="alert">
              <FiAlertCircle size={18} aria-hidden="true" className="flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#A84C34] text-white py-2.5 min-h-[44px] rounded-lg font-medium hover:bg-[#8b3f2b] transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#A84C34] focus:ring-offset-2"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
