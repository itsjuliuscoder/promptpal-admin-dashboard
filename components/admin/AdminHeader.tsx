"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FiChevronRight, FiLogOut, FiChevronDown } from "react-icons/fi";
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
  "/system": "System & Security",
  "/settings": "Settings",
};

const buildBreadcrumbs = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join("/")}`;
    const label = TITLE_MAP[path] || segment.replace(/-/g, " ");
    return { label, path };
  });
};

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logout } = useAdminAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const title = useMemo(() => TITLE_MAP[pathname] || "Admin", [pathname]);
  const breadcrumbs = useMemo(() => buildBreadcrumbs(pathname), [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    router.push("/login");
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "super_admin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "admin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "support":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "analyst":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="px-6 py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-2">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.path}>
                <span className="capitalize">{crumb.label}</span>
                {index < breadcrumbs.length - 1 && (
                  <FiChevronRight aria-hidden="true" />
                )}
              </React.Fragment>
            ))}
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h1>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#A84C34] focus:ring-offset-2"
            aria-label="Admin profile menu"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {admin?.username || "Admin"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {admin?.role || "admin"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-[#A84C34] text-white flex items-center justify-center text-sm font-semibold">
              {(admin?.username || "A").slice(0, 2).toUpperCase()}
            </div>
            <FiChevronDown
              className={`text-gray-500 dark:text-gray-400 transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              size={16}
              aria-hidden="true"
            />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50"
                role="menu"
                aria-orientation="vertical"
              >
                {/* Profile Section */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {admin?.username || "Admin"}
                  </p>
                  {admin?.email && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                      {admin.email}
                    </p>
                  )}
                  {admin?.role && (
                    <span
                      className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor(
                        admin.role
                      )}`}
                    >
                      {admin.role.replace("_", " ")}
                    </span>
                  )}
                </div>

                {/* Logout Button */}
                <div className="p-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    role="menuitem"
                  >
                    <FiLogOut size={16} aria-hidden="true" />
                    <span>Logout</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
