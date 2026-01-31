"use client";

import React from "react";

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

export default function PlatformStatusPanel({ status }: PlatformStatusPanelProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Platform Status</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <p>Google OAuth: {status.authStatus.googleOAuth ? "Online" : "Missing"}</p>
          <p>Email Auth: {status.authStatus.emailAuth ? "Online" : "Missing"}</p>
        </div>
        <div>
          <p>API Uptime: {Math.floor(status.apiUptimeSeconds / 60)} mins</p>
          <p>Jobs: {status.backgroundJobs.status}</p>
        </div>
        <div>
          <p>Extension Version: {status.extensionVersionHealth.currentVersion || "Unknown"}</p>
          <p>
            Last Reported:{" "}
            {status.extensionVersionHealth.lastReportedAt
              ? new Date(status.extensionVersionHealth.lastReportedAt).toLocaleString()
              : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}
