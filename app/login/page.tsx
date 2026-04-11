"use client";

import React, { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiAlertCircle, FiEye, FiEyeOff } from "react-icons/fi";
import PromptPalAdminLogo from "@/components/branding/PromptPalAdminLogo";
import { useAdminAuth } from "@/lib/auth/AdminAuthProvider";
import packageJson from "../../package.json";

const PAGE_BG = "#F5F1E9";
const HEADER_BG = "#1A1612";
const ACCENT = "#c95b2b";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();
  const passwordFieldId = useId();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
      router.replace("/");
    } catch {
      setError("Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const version = packageJson.version;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ backgroundColor: PAGE_BG }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_18px_40px_rgb(53_42_28_/_0.12)] border border-[#e8e2d8]">
        <header
          className="flex justify-center px-8 py-10"
          style={{ backgroundColor: HEADER_BG }}
        >
          <PromptPalAdminLogo priority />
        </header>

        <div className="px-8 pt-8 pb-2">
          <h1 className="text-2xl font-bold text-[#1A1612]">Admin sign in</h1>
          <p className="mt-1 text-sm text-[#655d53]">
            Restricted access — authorised personnel only
          </p>
        </div>

        <form className="space-y-4 px-8 pb-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              htmlFor="admin-username"
              className="text-sm font-bold text-[#3d3830]"
            >
              Username
            </label>
            <input
              id="admin-username"
              name="username"
              autoComplete="username"
              placeholder="admin@promptpal.app"
              className="w-full rounded-lg border border-[#d4cec4] bg-white px-3 py-2.5 min-h-[44px] text-[#1A1612] placeholder:text-[#9c948a] focus:outline-none focus:ring-2 focus:ring-[#c95b2b] focus:border-transparent"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor={passwordFieldId}
              className="text-sm font-bold text-[#3d3830]"
            >
              Password
            </label>
            <div className="relative">
              <input
                id={passwordFieldId}
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full rounded-lg border border-[#d4cec4] bg-white px-3 py-2.5 min-h-[44px] pr-11 text-[#1A1612] placeholder:text-[#9c948a] focus:outline-none focus:ring-2 focus:ring-[#c95b2b] focus:border-transparent"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-[#655d53] hover:bg-[#f0ebe3] focus:outline-none focus:ring-2 focus:ring-[#c95b2b] focus:ring-offset-1"
              >
                {showPassword ? (
                  <FiEyeOff size={20} aria-hidden />
                ) : (
                  <FiEye size={20} aria-hidden />
                )}
              </button>
            </div>
          </div>
          {error && (
            <div
              className="flex items-center gap-2 text-sm text-[#ba453b]"
              role="alert"
            >
              <FiAlertCircle size={18} aria-hidden className="flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg border border-[#d4cec4] bg-white py-2.5 min-h-[44px] font-bold text-[#1A1612] shadow-sm hover:bg-[#faf8f4] transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#c95b2b] focus:ring-offset-2"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="px-8 pb-8">
          <div className="flex gap-2.5 rounded-lg bg-[#f0ebe3] px-3 py-3 text-xs text-[#655d53] leading-relaxed">
            <span
              className="mt-1.5 h-2 w-2 text-center flex-shrink-0 rounded-full bg-emerald-500"
              aria-hidden
            />
            <p>Secured connection · All admin actions are logged</p>
          </div>
        </div>

        <footer className="border-t border-[#e8e2d8] px-8 py-4 text-center text-xs text-[#8c8378]">
          <span>PromptPal Admin v{version} · </span>
          <Link
            href="/system"
            className="font-medium hover:underline"
            style={{ color: ACCENT }}
          >
            Status
          </Link>
          <span> · </span>
          <a
            href="#"
            className="font-medium hover:underline"
            style={{ color: ACCENT }}
          >
            Help
          </a>
        </footer>
      </div>
    </div>
  );
}
