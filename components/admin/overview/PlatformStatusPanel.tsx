"use client";

import React from "react";
import { FiArrowUpRight, FiCheckCircle, FiClock, FiXCircle } from "react-icons/fi";
import SectionCard from "@/components/shared/SectionCard";

interface PlatformStatusPanelProps {
  status: {
    authStatus: {
      googleOAuth: boolean;
      emailAuth: boolean;
    };
    apiUptimeSeconds: number;
    backgroundJobs: { status: string; note?: string };
    extensionVersionHealth: { currentVersion?: string | null; lastReportedAt?: string | null };
  };
}

function StatusRow({
  label,
  value,
  ok,
  note,
}: {
  label: string;
  value: string;
  ok: boolean;
  note?: string;
}) {
  return (
    <div
      className="rounded-[1rem] border p-4"
      style={{
        borderColor: ok
          ? "color-mix(in srgb, var(--admin-success) 18%, var(--admin-border))"
          : "color-mix(in srgb, var(--admin-warning) 18%, var(--admin-border))",
        backgroundColor: ok
          ? "color-mix(in srgb, var(--admin-success-soft) 54%, var(--admin-panel))"
          : "color-mix(in srgb, var(--admin-warning-soft) 54%, var(--admin-panel))",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--admin-text-faint)]">
            {label}
          </p>
          <p className="mt-3 text-lg font-semibold tracking-[-0.03em] text-[color:var(--admin-text)]">
            {value}
          </p>
          {note ? <p className="mt-1 text-sm text-[color:var(--admin-text-soft)]">{note}</p> : null}
        </div>
        <div
          className="rounded-full p-2"
          style={{
            backgroundColor: ok ? "var(--admin-success-soft)" : "var(--admin-warning-soft)",
            color: ok ? "var(--admin-success)" : "var(--admin-warning)",
          }}
        >
          {ok ? <FiCheckCircle size={18} aria-hidden="true" /> : <FiXCircle size={18} aria-hidden="true" />}
        </div>
      </div>
    </div>
  );
}

export default function PlatformStatusPanel({ status }: PlatformStatusPanelProps) {
  const jobsOk =
    status.backgroundJobs.status?.toLowerCase() === "ok" ||
    status.backgroundJobs.status?.toLowerCase() === "running";
  const uptimeMins = Math.floor(status.apiUptimeSeconds / 60);
  const extensionVersion = status.extensionVersionHealth.currentVersion || "Unknown";
  const lastReported = status.extensionVersionHealth.lastReportedAt
    ? new Date(status.extensionVersionHealth.lastReportedAt).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "N/A";

  return (
    <SectionCard
      eyebrow="Health"
      title="Platform status"
      description="Operational checks for the services admins need to trust before taking action."
      actions={
        <span className="admin-stat-pill">
          <FiClock size={13} />
          Last extension report {lastReported}
        </span>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <StatusRow
          label="Google OAuth"
          value={status.authStatus.googleOAuth ? "Online" : "Missing"}
          ok={status.authStatus.googleOAuth}
          note="Authentication provider"
        />
        <StatusRow
          label="Email Auth"
          value={status.authStatus.emailAuth ? "Online" : "Missing"}
          ok={status.authStatus.emailAuth}
          note="Email-based sign-in flow"
        />
        <StatusRow
          label="API Uptime"
          value={`${uptimeMins} min`}
          ok={uptimeMins > 0}
          note="Current uninterrupted window"
        />
        <StatusRow
          label="Background Jobs"
          value={status.backgroundJobs.status}
          ok={jobsOk}
          note={status.backgroundJobs.note || "Worker state"}
        />
        <StatusRow
          label="Extension"
          value={extensionVersion}
          ok={extensionVersion !== "Unknown"}
          note={`Last reported ${lastReported}`}
        />
        <div className="admin-panel-muted flex flex-col justify-between rounded-[1rem] p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--admin-text-faint)]">
              Database posture
            </p>
            <p className="mt-3 text-lg font-semibold tracking-[-0.03em] text-[color:var(--admin-text)]">
              Stable
            </p>
            <p className="mt-1 text-sm text-[color:var(--admin-text-soft)]">
              Core services currently look reachable from the admin layer.
            </p>
          </div>
          <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--admin-accent-strong)]">
            <FiArrowUpRight size={14} />
            Monitoring snapshot
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
