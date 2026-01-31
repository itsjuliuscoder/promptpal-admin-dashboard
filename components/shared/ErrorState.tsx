"use client";

import React from "react";
import { FiAlertCircle } from "react-icons/fi";

interface ErrorStateProps {
  title?: string;
  message: string;
  action?: React.ReactNode;
  onRetry?: () => void;
}

export default function ErrorState({
  title = "Something went wrong",
  message,
  action,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-red-500 dark:text-red-400 mb-4">
        <FiAlertCircle size={48} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-[#A84C34] text-white rounded-lg hover:bg-[#92361a] transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
