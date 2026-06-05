"use client";

import React from "react";
import Link from "next/link";
import { FiExternalLink, FiFileText, FiUsers } from "react-icons/fi";
import PageHeader from "@/components/shared/PageHeader";
import SectionWorkspace, {
  type WorkspaceSectionItem,
} from "@/components/shared/SectionWorkspace";
import ApplicationsSection from "@/components/creators/ApplicationsSection";
import SubmissionsSection from "@/components/creators/SubmissionsSection";
import { useSectionQueryState } from "@/lib/hooks/useSectionQueryState";

const SECTION_ITEMS: WorkspaceSectionItem[] = [
  { id: "applications", label: "Applications", icon: <FiUsers size={18} /> },
  { id: "submissions", label: "Submissions", icon: <FiFileText size={18} /> },
];

const CREATOR_APP_URL =
  process.env.NEXT_PUBLIC_CREATOR_APP_URL || "https://academy.promptpal.app";

export default function CreatorsPage() {
  const { activeSection, setActiveSection } = useSectionQueryState(
    ["applications", "submissions"],
    "applications"
  );

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Creator Platform"
        description="Review creator applications, send invites, and approve UGC submissions for the Creator Academy programme."
        metadata={
          <a
            href={CREATOR_APP_URL}
            target="_blank"
            rel="noreferrer"
            className="admin-stat-pill inline-flex items-center gap-1.5 hover:text-[color:var(--admin-accent-strong)]"
          >
            Creator app
            <FiExternalLink size={12} />
          </a>
        }
        actions={
          <Link href={CREATOR_APP_URL} target="_blank" className="admin-button admin-button-secondary">
            Open academy
          </Link>
        }
      />

      <SectionWorkspace
        sections={SECTION_ITEMS}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        sectionLabel="Creator platform sections"
      >
        {activeSection === "applications" ? (
          <ApplicationsSection />
        ) : (
          <SubmissionsSection />
        )}
      </SectionWorkspace>
    </div>
  );
}
