"use client";

import React from "react";

export default function StatusBadge({ label }: { label: string }) {
  const normalized = label.toLowerCase();
  const color =
    normalized === "active"
      ? "bg-green-100 text-green-700"
      : normalized === "blocked" || normalized === "suspended"
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-600";

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
