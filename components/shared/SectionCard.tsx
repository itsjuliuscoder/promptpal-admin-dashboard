"use client";

import React from "react";

export default function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      {children}
    </div>
  );
}
