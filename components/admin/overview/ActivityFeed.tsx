"use client";

import React from "react";

interface ActivityEvent {
  type: string;
  label: string;
  createdAt: string;
}

export default function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Recent Activity
      </h3>
      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
        {events.length === 0 && <p>No recent activity.</p>}
        {events.map((event, index) => (
          <div key={`${event.type}-${index}`} className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 dark:text-gray-100">{event.label}</p>
              <p className="text-xs">{event.type.replace(/_/g, " ")}</p>
            </div>
            <span className="text-xs">
              {new Date(event.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
