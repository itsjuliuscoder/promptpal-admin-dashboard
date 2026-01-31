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
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-4"></div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="animate-pulse">
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-4 py-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-20"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-950">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-t border-gray-200 dark:border-gray-800">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-3">
      <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
      </div>
    </div>
  );
}
