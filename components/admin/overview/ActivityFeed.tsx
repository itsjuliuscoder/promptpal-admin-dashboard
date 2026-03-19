"use client";

import React from "react";
import { FiActivity } from "react-icons/fi";

interface ActivityEvent {
  type: string;
  label: string;
  createdAt: string;
}

function formatTimestamp(createdAt: string): string {
  return new Date(createdAt).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getTypeLabel(type: string): string {
  if (type === "refine_agent_session") return "Refine Agent";
  return type.replace(/_/g, " ");
}

export default function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Activity
      </h3>
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <FiActivity className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" aria-hidden="true" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No recent activity</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Events will appear here as they occur
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700" role="list">
          {events.map((event, index) => (
            <li
              key={`${event.type}-${index}`}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {event.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {getTypeLabel(event.type)}
                </p>
              </div>
              <time
                dateTime={event.createdAt}
                className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0"
              >
                {formatTimestamp(event.createdAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
