"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiActivity,
  FiBarChart2,
  FiBookOpen,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiGrid,
  FiMail,
  FiMessageSquare,
  FiMonitor,
  FiSettings,
  FiShield,
  FiUsers,
  FiUserPlus,
  FiZap,
} from "react-icons/fi";
import { useAdminAuth } from "@/lib/auth/AdminAuthProvider";

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

const sidebarGroups: SidebarGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", path: "/", icon: <FiGrid size={18} /> },
      { label: "Users", path: "/users", icon: <FiUsers size={18} /> },
      { label: "Prompts", path: "/prompts", icon: <FiBookOpen size={18} /> },
      { label: "Analytics", path: "/analytics", icon: <FiBarChart2 size={18} /> },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Refine Agent", path: "/refine-chat", icon: <FiMessageSquare size={18} /> },
      { label: "Chrome Extension", path: "/extension", icon: <FiZap size={18} /> },
      { label: "Billing & Plans", path: "/billing", icon: <FiCreditCard size={18} /> },
      { label: "Content & Templates", path: "/content", icon: <FiActivity size={18} /> },
      { label: "Feedback", path: "/feedback", icon: <FiMessageSquare size={18} /> },
      { label: "Email", path: "/email", icon: <FiMail size={18} /> },
      { label: "System & Security", path: "/system", icon: <FiShield size={18} /> },
      { label: "Admins", path: "/admins", icon: <FiUserPlus size={18} /> },
      { label: "Settings", path: "/settings", icon: <FiSettings size={18} /> },
    ],
  },
];

interface AdminSidebarProps {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
  isExpanded?: boolean;
  setIsExpanded?: (expanded: boolean) => void;
}

export default function AdminSidebar({
  isMobileMenuOpen = false,
  setIsMobileMenuOpen,
  isExpanded = true,
  setIsExpanded,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { admin } = useAdminAuth();

  return (
    <aside
      className={`flex h-full flex-col overflow-hidden border-r border-[color:var(--admin-border)] bg-[color:var(--admin-bg-elevated)] backdrop-blur-xl transition-all duration-300 ${
        isExpanded ? "w-[17.5rem]" : "w-24"
      } ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
    >
      <div className="flex items-center justify-between border-b border-[color:var(--admin-border)] px-4 py-4">
        <Link
          href="/"
          onClick={() => setIsMobileMenuOpen?.(false)}
          className="flex min-w-0 items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--admin-accent)] text-base font-semibold text-white shadow-[0_10px_24px_rgb(201_91_43_/_0.22)]">
            P
          </div>
          {isExpanded ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--admin-text-faint)]">
                PromptPal
              </p>
              <p className="truncate text-xl font-semibold tracking-[-0.04em] text-[color:var(--admin-text)]">
                Admin
              </p>
            </div>
          ) : null}
        </Link>
        <button
          type="button"
          onClick={() => setIsExpanded?.(!isExpanded)}
          className="hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-panel)] text-[color:var(--admin-text-soft)] transition-colors hover:border-[color:var(--admin-border-strong)] hover:text-[color:var(--admin-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--admin-bg)] lg:inline-flex"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? <FiChevronLeft size={18} /> : <FiChevronRight size={18} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-6">
          {sidebarGroups.map((group) => (
            <div key={group.label} className="space-y-2">
              {isExpanded ? (
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--admin-text-faint)]">
                  {group.label}
                </p>
              ) : null}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setIsMobileMenuOpen?.(false)}
                      className={`group flex min-h-[48px] items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--admin-bg)] ${
                        isActive
                          ? "border-[color:var(--admin-border-strong)] bg-[color:var(--admin-accent-soft)] text-[color:var(--admin-accent-strong)] shadow-[0_8px_24px_rgb(201_91_43_/_0.08)]"
                          : "border-transparent text-[color:var(--admin-text-soft)] hover:border-[color:var(--admin-border)] hover:bg-[color:var(--admin-panel)] hover:text-[color:var(--admin-text)]"
                      }`}
                    >
                      <span className={`${isActive ? "text-[color:var(--admin-accent-strong)]" : "text-[color:var(--admin-text-faint)] group-hover:text-[color:var(--admin-text)]"}`}>
                        {item.icon}
                      </span>
                      {isExpanded ? <span className="truncate">{item.label}</span> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[color:var(--admin-border)] p-3">
        <div className="rounded-[1.1rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-panel)] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--admin-accent)] text-sm font-semibold text-white">
              {(admin?.username || "A").slice(0, 2).toUpperCase()}
            </div>
            {isExpanded ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[color:var(--admin-text)]">
                  {admin?.username || "Admin"}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-[color:var(--admin-text-faint)]">
                  <FiMonitor size={12} />
                  <span className="truncate">{admin?.role || "admin"}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
