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
    <div className="admin-panel-muted flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 rounded-full p-4 text-[color:var(--admin-text-faint)]">{icon}</div>
      {title && (
        <h3 className="mb-2 text-xl font-semibold tracking-[-0.03em] text-[color:var(--admin-text)]">{title}</h3>
      )}
      <p className="mb-4 max-w-md text-sm text-[color:var(--admin-text-soft)]">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
