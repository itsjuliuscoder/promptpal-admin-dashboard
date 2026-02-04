"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Username
            </label>
            <input
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#A84C34] text-white py-2 rounded-lg font-medium hover:bg-[#8b3f2b] transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
