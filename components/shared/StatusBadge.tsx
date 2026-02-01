"use client";

import React from "react";

interface StatusBadgeProps {
  label: string;
  variant?: "success" | "warning" | "error" | "info";
}

export default function StatusBadge({ label, variant }: StatusBadgeProps) {
  const normalized = label.toLowerCase();
  
  let color: string;
  
  if (variant) {
    switch (variant) {
      case "success":
        color = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
        break;
      case "warning":
        color = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
        break;
      case "error":
        color = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
        break;
      case "info":
        color = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
        break;
      default:
        color = "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  } else {
    // Fallback to label-based logic for backward compatibility
    color =
      normalized === "active" || normalized === "completed"
        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        : normalized === "blocked" || normalized === "suspended"
        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        : normalized === "pending"
        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
