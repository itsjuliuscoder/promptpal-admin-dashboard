"use client";

import React from "react";

export default function SectionCard({
  eyebrow,
  title,
  description,
  actions,
  children,
  className = "",
  contentClassName = "",
  tone = "default",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  tone?: "default" | "muted";
}) {
  return (
    <section
      className={`${tone === "muted" ? "admin-panel-muted" : "admin-panel"} p-5 sm:p-6 ${className}`}
    >
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          {eyebrow ? <span className="admin-eyebrow">{eyebrow}</span> : null}
          <h3 className="text-xl font-semibold tracking-[-0.03em] text-[color:var(--admin-text)]">{title}</h3>
          {description ? <p className="admin-subtitle max-w-2xl">{description}</p> : null}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
