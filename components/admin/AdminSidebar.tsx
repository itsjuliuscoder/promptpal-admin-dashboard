"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
  FiSettings,
  FiShield,
  FiUsers,
  FiUserPlus,
  FiZap,
} from "react-icons/fi";

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const sidebarItems: SidebarItem[] = [
  { label: "Overview", path: "/", icon: <FiGrid size={18} /> },
  { label: "Users", path: "/users", icon: <FiUsers size={18} /> },
  { label: "Prompts", path: "/prompts", icon: <FiBookOpen size={18} /> },
  { label: "Analytics", path: "/analytics", icon: <FiBarChart2 size={18} /> },
  { label: "Refine Agent", path: "/refine-chat", icon: <FiMessageSquare size={18} /> },
  { label: "Chrome Extension", path: "/extension", icon: <FiZap size={18} /> },
  { label: "Billing & Plans", path: "/billing", icon: <FiCreditCard size={18} /> },
  { label: "Content & Templates", path: "/content", icon: <FiActivity size={18} /> },
  { label: "Email", path: "/email", icon: <FiMail size={18} /> },
  { label: "System & Security", path: "/system", icon: <FiShield size={18} /> },
  { label: "Admins", path: "/admins", icon: <FiUserPlus size={18} /> },
  { label: "Settings", path: "/settings", icon: <FiSettings size={18} /> },
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

  return (
    <div
      className={`h-full bg-white dark:bg-gray-900 shadow-xl border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${
        isExpanded ? "w-64" : "w-20"
      } ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
    >
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isExpanded ? "PromptPal Admin" : "PP"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded?.(!isExpanded)}
          className="hidden lg:inline-flex p-1.5 min-w-[44px] min-h-[44px] items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A84C34] focus:ring-offset-2"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? <FiChevronLeft size={18} /> : <FiChevronRight size={18} />}
        </button>
      </div>

      <nav className="px-3 py-4 pb-6 space-y-1" aria-label="Admin navigation">
        {sidebarItems.map((item) => {
          const isActive = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center min-h-[44px] rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#A84C34] focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 border-l-2 ${
                isActive
                  ? "bg-[#F4E7E2] text-[#A84C34] dark:bg-gray-800 border-[#A84C34]"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 border-transparent"
              }`}
              onClick={() => setIsMobileMenuOpen?.(false)}
            >
              <motion.div
                whileHover={{ x: 2 }}
                className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg"
              >
                <span aria-hidden="true">{item.icon}</span>
                {isExpanded && <span>{item.label}</span>}
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
