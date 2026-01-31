"use client";

import React, { useEffect, useState } from "react";
import SectionCard from "@/components/shared/SectionCard";
import DataTable from "@/components/shared/DataTable";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton, { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import ErrorState from "@/components/shared/ErrorState";
import { adminService } from "@/lib/services/adminService";

export default function AdminContentPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminService.getTemplates({ page: 1, limit: 20 });
        setTemplates(response.data || []);
      } catch (err) {
        console.error("Failed to load templates", err);
        setError("Failed to load templates. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Content & Templates"
        description="Manage email templates and content library"
      />
      <SectionCard title="Templates">
        {loading ? (
          <TableSkeleton rows={10} columns={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : (
          <DataTable
            rows={templates}
            columns={[
              { key: "title", label: "Title" },
              { key: "templateType", label: "Type" },
              { key: "category", label: "Category" },
              {
                key: "updatedAt",
                label: "Updated",
                render: (value) => (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {value ? new Date(value).toLocaleDateString() : "N/A"}
                  </span>
                ),
              },
            ]}
            emptyMessage="No templates found"
          />
        )}
      </SectionCard>
    </div>
  );
}
