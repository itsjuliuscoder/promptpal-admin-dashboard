"use client";

import React from "react";
import { FiInbox } from "react-icons/fi";

interface EmptyStateProps {
  title?: string;
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function EmptyState({
  title,
  message,
  icon = <FiInbox size={48} />,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-gray-400 dark:text-gray-600 mb-4">{icon}</div>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      )}
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
