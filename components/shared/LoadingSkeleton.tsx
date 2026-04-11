"use client";

import React from "react";

interface LoadingSkeletonProps {
  rows?: number;
  showHeader?: boolean;
  className?: string;
}

export default function LoadingSkeleton({
  rows = 5,
  showHeader = true,
  className = "",
}: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      {showHeader && (
        <div className="mb-4 h-4 w-1/4 rounded-full bg-[color:var(--admin-panel-muted)]"></div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="h-4 rounded-full bg-[color:var(--admin-panel-muted)]"></div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="animate-pulse">
      <div className="admin-table-shell">
        <div className="admin-table-scroll">
        <table className="min-w-full text-sm">
          <thead className="bg-[color:var(--admin-panel-muted)]">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-4 py-3">
                  <div className="h-4 w-20 rounded-full bg-[color:var(--admin-border)]"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[color:var(--admin-panel)]">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-t border-[color:var(--admin-border)]">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <div className="h-4 w-full rounded-full bg-[color:var(--admin-panel-muted)]"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="admin-panel animate-pulse space-y-3 p-5">
      <div className="h-6 w-1/3 rounded-full bg-[color:var(--admin-panel-muted)]"></div>
      <div className="space-y-2">
        <div className="h-4 rounded-full bg-[color:var(--admin-panel-muted)]"></div>
        <div className="h-4 w-5/6 rounded-full bg-[color:var(--admin-panel-muted)]"></div>
      </div>
    </div>
  );
}
