"use client";

import React from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  metadata?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: "standard" | "compact";
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  metadata,
  actions,
  variant = "standard",
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-5 ${
        variant === "compact" ? "md:flex-row md:items-start md:justify-between" : "xl:flex-row xl:items-end xl:justify-between"
      }`}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {eyebrow ? <span className="admin-eyebrow">{eyebrow}</span> : null}
          {metadata ? <div className="flex flex-wrap items-center gap-2">{metadata}</div> : null}
        </div>
        <div className="space-y-2">
          <h1 className={variant === "compact" ? "text-2xl font-semibold tracking-[-0.04em] text-[color:var(--admin-text)]" : "admin-title"}>
            {title}
          </h1>
          {description ? <p className="admin-subtitle max-w-3xl">{description}</p> : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-3 xl:justify-end">{actions}</div>
      ) : null}
    </div>
  );
}
