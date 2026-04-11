"use client";

import React from "react";

interface StatusBadgeProps {
  label: string;
  variant?: "success" | "warning" | "error" | "info";
  size?: "sm" | "md";
}

export default function StatusBadge({ label, variant, size = "md" }: StatusBadgeProps) {
  const normalized = label.toLowerCase();
  
  let tone: { bg: string; fg: string };
  
  if (variant) {
    switch (variant) {
      case "success":
        tone = { bg: "var(--admin-success-soft)", fg: "var(--admin-success)" };
        break;
      case "warning":
        tone = { bg: "var(--admin-warning-soft)", fg: "var(--admin-warning)" };
        break;
      case "error":
        tone = { bg: "var(--admin-danger-soft)", fg: "var(--admin-danger)" };
        break;
      case "info":
        tone = { bg: "var(--admin-accent-soft)", fg: "var(--admin-accent-strong)" };
        break;
      default:
        tone = { bg: "var(--admin-panel-muted)", fg: "var(--admin-text-soft)" };
    }
  } else {
    tone =
      normalized === "active" || normalized === "completed"
        ? { bg: "var(--admin-success-soft)", fg: "var(--admin-success)" }
      : normalized === "blocked" || normalized === "suspended"
        ? { bg: "var(--admin-danger-soft)", fg: "var(--admin-danger)" }
        : normalized === "pending"
        ? { bg: "var(--admin-warning-soft)", fg: "var(--admin-warning)" }
        : { bg: "var(--admin-panel-muted)", fg: "var(--admin-text-soft)" };
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-medium ${
        size === "sm" ? "text-[11px]" : "text-xs"
      }`}
      style={{
        backgroundColor: tone.bg,
        color: tone.fg,
        borderColor: "color-mix(in srgb, var(--admin-border) 80%, transparent)",
      }}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: tone.fg }}
      />
      {label}
    </span>
  );
}
