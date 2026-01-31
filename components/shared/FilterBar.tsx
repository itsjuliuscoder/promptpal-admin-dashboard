"use client";

import React from "react";

interface FilterBarProps {
  children: React.ReactNode;
}

export default function FilterBar({ children }: FilterBarProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-wrap gap-3">
      {children}
    </div>
  );
}
