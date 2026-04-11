"use client";

import React from "react";
import { FiArrowUpRight } from "react-icons/fi";

interface KpiCardProps {
  label: string;
  value: number | string;
  unit?: string;
  caption?: string;
  tone?: "neutral" | "accent" | "success" | "warning";
  emphasis?: "primary" | "secondary";
}

const toneStyles = {
  neutral: {
    accent: "var(--admin-text)",
    soft: "var(--admin-panel-muted)",
  },
  accent: {
    accent: "var(--admin-accent-strong)",
    soft: "var(--admin-accent-soft)",
  },
  success: {
    accent: "var(--admin-success)",
    soft: "var(--admin-success-soft)",
  },
  warning: {
    accent: "var(--admin-warning)",
    soft: "var(--admin-warning-soft)",
  },
};

export default function KpiCard({
  label,
  value,
  unit,
  caption,
  tone = "neutral",
  emphasis = "secondary",
}: KpiCardProps) {
  const palette = toneStyles[tone];

  return (
    <div
      className={`admin-kpi-card ${emphasis === "primary" ? "min-h-[190px]" : "min-h-[168px]"}`}
      style={{
        background:
          emphasis === "primary"
            ? `linear-gradient(180deg, color-mix(in srgb, ${palette.soft} 84%, var(--admin-panel)) 0%, var(--admin-panel) 100%)`
            : "var(--admin-panel)",
      }}
    >
      <div
        className="mb-5 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
        style={{ backgroundColor: palette.soft, color: palette.accent }}
      >
        {label}
      </div>
      <p
        className={`${emphasis === "primary" ? "text-5xl sm:text-[3.5rem]" : "text-4xl"} font-semibold tracking-[-0.05em] text-[color:var(--admin-text)]`}
      >
        {unit ? `${unit} ` : ""}
        {value}
      </p>
      {caption ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-[color:var(--admin-text-soft)]">
          <FiArrowUpRight size={15} style={{ color: palette.accent }} />
          <span>{caption}</span>
        </div>
      ) : null}
    </div>
  );
}
