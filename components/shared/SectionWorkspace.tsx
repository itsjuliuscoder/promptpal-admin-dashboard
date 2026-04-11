"use client";

import React from "react";

export interface WorkspaceSectionItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: React.ReactNode;
}

interface SectionWorkspaceProps {
  sections: WorkspaceSectionItem[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  sectionLabel?: string;
  children: React.ReactNode;
}

export default function SectionWorkspace({
  sections,
  activeSection,
  onSectionChange,
  sectionLabel = "Page sections",
  children,
}: SectionWorkspaceProps) {
  return (
    <div className="admin-workspace">
      <nav className="admin-workspace-nav" aria-label={sectionLabel}>
        <div className="admin-workspace-nav-list">
          {sections.map((section) => {
            const active = section.id === activeSection;
            return (
              <button
                key={section.id}
                type="button"
                className="admin-section-trigger"
                data-active={active}
                data-disabled={section.disabled}
                disabled={section.disabled}
                onClick={() => onSectionChange(section.id)}
                aria-current={active ? "page" : undefined}
              >
                {section.icon ? <span className="admin-section-icon">{section.icon}</span> : null}
                <span className="min-w-0 flex-1 truncate">{section.label}</span>
                {section.badge ? <span className="shrink-0">{section.badge}</span> : null}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="admin-workspace-panel">{children}</div>
    </div>
  );
}
