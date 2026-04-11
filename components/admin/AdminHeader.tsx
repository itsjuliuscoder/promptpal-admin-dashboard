"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiChevronRight,
  FiCommand,
  FiLogOut,
  FiChevronDown,
  FiMenu,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminAuth } from "@/lib/auth/AdminAuthProvider";

const TITLE_MAP: Record<string, string> = {
  "/": "Overview",
  "/users": "Users",
  "/prompts": "Prompts",
  "/extension": "Chrome Extension",
  "/analytics": "Analytics",
  "/billing": "Billing & Plans",
  "/content": "Content & Templates",
  "/email": "Email",
  "/system": "System & Security",
  "/admins": "Admins",
  "/settings": "Settings",
  "/refine-chat": "Refine Agent",
};

const buildBreadcrumbs = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; path: string }[] = [];
  if (pathname !== "/") {
    segments.forEach((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join("/")}`;
      const label = TITLE_MAP[path] || segment.replace(/-/g, " ");
      crumbs.push({ label, path });
    });
  }
  return crumbs;
};

interface AdminHeaderProps {
  onMenuToggle: () => void;
}

export default function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logout } = useAdminAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const firstDropdownFocusRef = useRef<HTMLButtonElement>(null);

  const title = useMemo(() => TITLE_MAP[pathname] || "Admin", [pathname]);
  const breadcrumbs = useMemo(() => buildBreadcrumbs(pathname), [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        profileButtonRef.current?.focus();
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isDropdownOpen) {
        setIsDropdownOpen(false);
        profileButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (isDropdownOpen) {
      const t = setTimeout(() => firstDropdownFocusRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [isDropdownOpen]);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    profileButtonRef.current?.focus();
    router.push("/login");
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "super_admin":
        return {
          backgroundColor: "var(--admin-accent-soft)",
          color: "var(--admin-accent-strong)",
        };
      case "support":
        return {
          backgroundColor: "var(--admin-success-soft)",
          color: "var(--admin-success)",
        };
      case "analyst":
        return {
          backgroundColor: "var(--admin-warning-soft)",
          color: "var(--admin-warning)",
        };
      default:
        return {
          backgroundColor: "var(--admin-panel-muted)",
          color: "var(--admin-text-soft)",
        };
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--admin-border)] bg-[color:var(--admin-bg-elevated)] backdrop-blur-xl">
      <div className="flex min-h-[76px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="inline-flex min-h-[46px] min-w-[46px] items-center justify-center rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-panel)] text-[color:var(--admin-text-soft)] transition-colors hover:border-[color:var(--admin-border-strong)] hover:text-[color:var(--admin-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--admin-bg)] lg:hidden"
            aria-label="Toggle navigation"
          >
            <FiMenu size={18} />
          </button>

          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-sm text-[color:var(--admin-text-faint)]">
              <span className="hidden items-center gap-2 rounded-full border border-[color:var(--admin-border)] bg-[color:var(--admin-panel)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] sm:inline-flex">
                <FiCommand size={12} />
                Admin workspace
              </span>
              <nav className="flex min-w-0 flex-wrap items-center gap-2" aria-label="Breadcrumb">
                {pathname === "/" ? (
                  <span>{title}</span>
                ) : (
                  <>
                    <Link href="/" className="transition-colors hover:text-[color:var(--admin-text)]">
                      Overview
                    </Link>
                    {breadcrumbs.map((crumb, index) => {
                      const isLast = index === breadcrumbs.length - 1;
                      return (
                        <React.Fragment key={crumb.path}>
                          <FiChevronRight size={13} aria-hidden="true" />
                          {isLast ? (
                            <span className="truncate font-medium text-[color:var(--admin-text-soft)]">
                              {crumb.label}
                            </span>
                          ) : (
                            <Link
                              href={crumb.path}
                              className="transition-colors hover:text-[color:var(--admin-text)]"
                            >
                              {crumb.label}
                            </Link>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </>
                )}
              </nav>
            </div>
            <p className="truncate text-sm font-medium text-[color:var(--admin-text)]">
              PromptPal Admin
            </p>
          </div>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            ref={profileButtonRef}
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            type="button"
            className="flex items-center gap-3 rounded-[1rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-panel)] px-3 py-2 transition-colors hover:border-[color:var(--admin-border-strong)] focus:outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--admin-bg)]"
            aria-label="Admin profile menu"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[color:var(--admin-text)]">
                {admin?.username || "Admin"}
              </p>
              <p className="text-xs text-[color:var(--admin-text-faint)]">
                {admin?.role || "admin"}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--admin-accent)] text-sm font-semibold text-white">
              {(admin?.username || "A").slice(0, 2).toUpperCase()}
            </div>
            <FiChevronDown
              className={`text-[color:var(--admin-text-faint)] transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              size={16}
              aria-hidden="true"
            />
          </button>

          <AnimatePresence>
            {isDropdownOpen ? (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 mt-3 w-72 rounded-[1.1rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-panel)] p-2 shadow-admin"
                role="menu"
                aria-orientation="vertical"
              >
                <div className="rounded-[0.95rem] bg-[color:var(--admin-panel-muted)] p-4">
                  <p className="text-sm font-semibold text-[color:var(--admin-text)]">
                    {admin?.username || "Admin"}
                  </p>
                  {admin?.email ? (
                    <p className="mt-1 truncate text-xs text-[color:var(--admin-text-faint)]">
                      {admin.email}
                    </p>
                  ) : null}
                  {admin?.role ? (
                    <span
                      className="mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium"
                      style={getRoleBadgeColor(admin.role)}
                    >
                      {admin.role.replace("_", " ")}
                    </span>
                  ) : null}
                </div>

                <div className="mt-2">
                  <button
                    ref={firstDropdownFocusRef}
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-[0.95rem] px-4 py-3 text-sm font-medium text-[color:var(--admin-danger)] transition-colors hover:bg-[color:var(--admin-danger-soft)] focus:outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--admin-panel)]"
                    role="menuitem"
                  >
                    <FiLogOut size={16} aria-hidden="true" />
                    <span>Logout</span>
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
