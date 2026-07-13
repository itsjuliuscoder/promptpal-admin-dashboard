"use client";

import React, { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiAlertCircle, FiEye, FiEyeOff } from "react-icons/fi";
import PromptPalAdminLogo from "@/components/branding/PromptPalAdminLogo";
import { useAdminAuth } from "@/lib/auth/AdminAuthProvider";
import packageJson from "../../package.json";

// New PromptPal brand palette
const BRAND = "#7A42FC";
const BRAND_DARK = "#6525EA";
const BRAND_DARKER = "#5415C2";
const INK = "#1A1612";

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
      className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden"
      style={{
        background:
          "radial-gradient(1100px 520px at 50% -10%, #efe7ff 0%, #f7f4ff 42%, #fbfaf7 100%)",
      }}
    >
      {/* soft brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full blur-3xl opacity-40"
        style={{ background: BRAND }}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgb(58_34_120_/_0.18)] border border-[#ece7f7]">
        <header
          className="relative flex flex-col items-center justify-center px-8 py-11"
          style={{
            background: `linear-gradient(150deg, ${BRAND_DARKER} 0%, ${BRAND_DARK} 52%, ${BRAND} 100%)`,
          }}
        >
          {/* subtle top sheen */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                "radial-gradient(320px 120px at 50% 0%, rgba(255,255,255,0.5) 0%, transparent 70%)",
            }}
          />
          <div className="relative">
            <PromptPalAdminLogo priority />
          </div>
        </header>

        <div className="px-8 pt-8 pb-2">
          <h1 className="text-2xl font-bold" style={{ color: INK }}>
            Admin sign in
          </h1>
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
              className="w-full rounded-xl border border-[#e0dbef] bg-[#faf9fe] px-3.5 py-2.5 min-h-[46px] text-[#1A1612] placeholder:text-[#a49bb3] transition focus:outline-none focus:bg-white focus:border-[#7A42FC] focus:ring-2 focus:ring-[#7A42FC]/30"
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
                className="w-full rounded-xl border border-[#e0dbef] bg-[#faf9fe] px-3.5 py-2.5 min-h-[46px] pr-11 text-[#1A1612] placeholder:text-[#a49bb3] transition focus:outline-none focus:bg-white focus:border-[#7A42FC] focus:ring-2 focus:ring-[#7A42FC]/30"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-[#655d53] hover:bg-[#f2eefc] hover:text-[#6525EA] focus:outline-none focus:ring-2 focus:ring-[#7A42FC]/40 focus:ring-offset-1"
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
            className="w-full rounded-xl py-2.5 min-h-[46px] font-bold text-white transition-all disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#7A42FC] focus:ring-offset-2 hover:brightness-[1.06] active:brightness-95"
            style={{
              background: `linear-gradient(180deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`,
              boxShadow: "0 8px 20px rgb(101 37 234 / 0.28)",
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="px-8 pb-8">
          <div className="flex items-start gap-2.5 rounded-xl bg-[#f5f2fd] border border-[#ece7f7] px-3.5 py-3 text-xs text-[#655d53] leading-relaxed">
            <span
              className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500"
              aria-hidden
            />
            <p>Secured connection · All admin actions are logged</p>
          </div>
        </div>

        <footer className="border-t border-[#ece7f7] px-8 py-4 text-center text-xs text-[#8c8378]">
          <span>PromptPal Admin v{version} · </span>
          <Link
            href="/system"
            className="font-semibold hover:underline"
            style={{ color: BRAND_DARK }}
          >
            Status
          </Link>
          <span> · </span>
          <a
            href="#"
            className="font-semibold hover:underline"
            style={{ color: BRAND_DARK }}
          >
            Help
          </a>
        </footer>
      </div>
    </div>
  );
}
