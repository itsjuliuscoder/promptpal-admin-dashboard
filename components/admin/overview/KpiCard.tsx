"use client";

import React from "react";

interface KpiCardProps {
  label: string;
  value: number | string;
  unit?: string;
}

export default function KpiCard({ label, value, unit }: KpiCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
        {unit ? `${unit} ` : ""}
        {value}
      </p>
    </div>
  );
}
