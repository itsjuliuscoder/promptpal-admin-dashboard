"use client";

import React from "react";
import { FiAlertCircle } from "react-icons/fi";

export function MetricTile({
  label,
  value,
  note,
}: {
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
}) {
  return (
    <div className="admin-metric-tile">
      <p className="admin-metric-label">{label}</p>
      <div className="admin-metric-value">{value}</div>
      {note ? <div className="admin-metric-note">{note}</div> : null}
    </div>
  );
}

export function PreviewNotice({
  title = "Preview only",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <div className="admin-preview-notice">
      <div className="flex items-start gap-3">
        <FiAlertCircle className="mt-0.5 shrink-0 text-[color:var(--admin-warning)]" size={16} />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[color:var(--admin-text)]">{title}</p>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
}

export function ToggleCard({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="admin-list-card flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-lg font-semibold tracking-[-0.03em] text-[color:var(--admin-text)]">
          {title}
        </p>
        <p className="mt-1 text-sm leading-6 text-[color:var(--admin-text-soft)]">
          {description}
        </p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative mt-1 inline-flex h-9 w-16 shrink-0 items-center rounded-full border transition-colors ${
          checked
            ? "border-transparent bg-[color:var(--admin-accent)]"
            : "border-[color:var(--admin-border)] bg-[color:var(--admin-panel-muted)]"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
        aria-pressed={checked}
      >
        <span
          className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-8" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
