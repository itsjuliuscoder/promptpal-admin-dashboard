"use client";

import React from "react";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";

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

function StatusChip({
  label,
  value,
  ok,
  className = "",
}: {
  label: string;
  value: string;
  ok: boolean;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${className} ${
        ok
          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300"
          : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"
      }`}
    >
      {ok ? (
        <FiCheckCircle size={16} aria-hidden="true" />
      ) : (
        <FiAlertCircle size={16} aria-hidden="true" />
      )}
      <span className="font-medium">{label}:</span>
      <span>{value}</span>
    </div>
  );
}

export default function PlatformStatusPanel({ status }: PlatformStatusPanelProps) {
  const jobsOk = status.backgroundJobs.status?.toLowerCase() === "ok" || status.backgroundJobs.status?.toLowerCase() === "running";
  const uptimeMins = Math.floor(status.apiUptimeSeconds / 60);
  const extensionVersion = status.extensionVersionHealth.currentVersion || "Unknown";
  const lastReported = status.extensionVersionHealth.lastReportedAt
    ? new Date(status.extensionVersionHealth.lastReportedAt).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "N/A";

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Platform Status
      </h3>
      <div className="flex flex-wrap gap-3">
        <StatusChip
          label="Google OAuth"
          value={status.authStatus.googleOAuth ? "Online" : "Missing"}
          ok={status.authStatus.googleOAuth}
        />
        <StatusChip
          label="Email Auth"
          value={status.authStatus.emailAuth ? "Online" : "Missing"}
          ok={status.authStatus.emailAuth}
        />
        <StatusChip
          label="API Uptime"
          value={`${uptimeMins} min`}
          ok={uptimeMins > 0}
        />
        <StatusChip
          label="Background Jobs"
          value={status.backgroundJobs.status}
          ok={jobsOk}
        />
        <StatusChip
          label="Extension"
          value={extensionVersion}
          ok={extensionVersion !== "Unknown"}
        />
        <div
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700`}
        >
          <span className="font-medium">Last reported:</span>
          <span>{lastReported}</span>
        </div>
      </div>
    </div>
  );
}
