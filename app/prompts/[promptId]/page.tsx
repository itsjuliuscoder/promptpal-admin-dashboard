"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SectionCard from "@/components/shared/SectionCard";
import DataTable from "@/components/shared/DataTable";
import { adminService } from "@/lib/services/adminService";

export default function AdminPromptDetailPage() {
  const params = useParams();
  const promptId = params.promptId as string;
  const [prompt, setPrompt] = useState<any>(null);
  const [usage, setUsage] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [promptRes, usageRes, versionsRes] = await Promise.all([
          adminService.getPromptDetails(promptId),
          adminService.getPromptUsage(promptId),
          adminService.getPromptVersions(promptId),
        ]);
        setPrompt(promptRes.data || promptRes);
        setUsage(usageRes.data || []);
        setVersions(versionsRes.data || []);
      } catch (error) {
        console.error("Failed to load prompt detail", error);
      }
    };
    load();
  }, [promptId]);

  if (!prompt) {
    return <div className="p-6 text-gray-500">Loading prompt detail...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <SectionCard title="Prompt Content">
        <p className="text-sm text-gray-700 dark:text-gray-200">{prompt.title}</p>
        <pre className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
          {prompt.text}
        </pre>
      </SectionCard>

      <SectionCard title="Variables">
        <pre className="text-xs text-gray-500 dark:text-gray-400">
          {JSON.stringify(prompt.variables || [], null, 2)}
        </pre>
      </SectionCard>

      <SectionCard title="Usage Stats">
        <DataTable
          rows={usage}
          columns={[
            { key: "_id", label: "Action" },
            { key: "count", label: "Count" },
            { key: "lastUsed", label: "Last Used" },
          ]}
        />
      </SectionCard>

      <SectionCard title="Version History">
        <DataTable
          rows={versions}
          columns={[
            { key: "version", label: "Version" },
            { key: "status", label: "Status" },
            { key: "createdAt", label: "Created" },
          ]}
        />
      </SectionCard>
    </div>
  );
}
