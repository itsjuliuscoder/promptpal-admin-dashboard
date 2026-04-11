"use client";

import React from "react";
import { FiActivity, FiArrowUpRight } from "react-icons/fi";
import SectionCard from "@/components/shared/SectionCard";

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
    <SectionCard
      eyebrow="Events"
      title="Recent activity"
      description="Live feed of the latest meaningful admin-facing events across the platform."
    >
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
          <FiActivity className="mb-3 h-10 w-10 text-[color:var(--admin-text-faint)]" aria-hidden="true" />
          <p className="text-sm font-medium text-[color:var(--admin-text)]">No recent activity</p>
          <p className="mt-1 text-xs text-[color:var(--admin-text-faint)]">
            Events will appear here as they occur
          </p>
        </div>
      ) : (
        <ul className="space-y-3" role="list">
          {events.map((event, index) => (
            <li
              key={`${event.type}-${index}`}
              className="rounded-[1rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-panel-muted)] px-4 py-4"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-full bg-[color:var(--admin-accent-soft)] p-2 text-[color:var(--admin-accent-strong)]">
                  <FiArrowUpRight size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[color:var(--admin-text)]">
                        {event.label}
                      </p>
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--admin-text-faint)]">
                        {getTypeLabel(event.type)}
                      </p>
                    </div>
                    <time
                      dateTime={event.createdAt}
                      className="shrink-0 text-xs text-[color:var(--admin-text-soft)]"
                    >
                      {formatTimestamp(event.createdAt)}
                    </time>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
