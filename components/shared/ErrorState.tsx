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
    <div className="admin-panel flex flex-col items-center justify-center px-6 py-12 text-center">
      <div
        className="mb-4 rounded-full p-4"
        style={{ backgroundColor: "var(--admin-danger-soft)", color: "var(--admin-danger)" }}
        aria-hidden="true"
      >
        <FiAlertCircle size={48} />
      </div>
      <h3 className="mb-2 text-xl font-semibold tracking-[-0.03em] text-[color:var(--admin-text)]">{title}</h3>
      <p className="mb-6 max-w-md text-sm text-[color:var(--admin-text-soft)]">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="admin-button admin-button-primary"
        >
          Try again
        </button>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
