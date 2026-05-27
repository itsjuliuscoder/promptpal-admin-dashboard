"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FiPlus, FiRefreshCw, FiSearch, FiRotateCcw } from "react-icons/fi";
import DataTable from "@/components/shared/DataTable";
import FilterBar from "@/components/shared/FilterBar";
import Pagination from "@/components/shared/Pagination";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import ErrorState from "@/components/shared/ErrorState";
import { changelogApi, type ChangelogEntry } from "@/lib/changelog-api";

const CATEGORY_LABELS: Record<string, string> = {
  new_feature: "New Feature",
  improvement: "Improvement",
  bug_fix: "Bug Fix",
  deprecation: "Deprecation",
  security: "Security",
};

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadEntries = async (page = currentPage, status = statusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await changelogApi.list({ page, limit: 20, status: status || undefined });
      setEntries(res.data);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch {
      setError("Failed to load changelog entries. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleFilter = () => {
    if (currentPage === 1) loadEntries(1, statusFilter);
    else setCurrentPage(1);
  };

  const handleReset = () => {
    setStatusFilter("");
    if (currentPage === 1) loadEntries(1, "");
    else setCurrentPage(1);
  };

  const handlePublish = async (id: string) => {
    if (!confirm("Publish this entry and notify subscribers?")) return;
    try {
      await changelogApi.publish(id);
      loadEntries(currentPage);
    } catch {
      alert("Failed to publish entry.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this changelog entry?")) return;
    try {
      await changelogApi.remove(id);
      loadEntries(currentPage);
    } catch {
      alert("Failed to delete entry.");
    }
  };

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow="Content"
        title="Changelog"
        description="Draft, publish, and manage product release notes shown at promptpal.app/changelog."
        metadata={
          <>
            <span className="admin-stat-pill">Page {currentPage}</span>
            <span className="admin-stat-pill">{total} entries</span>
          </>
        }
        actions={
          <div className="flex gap-2">
            <button
              className="admin-button admin-button-secondary"
              onClick={() => loadEntries(currentPage)}
            >
              <FiRefreshCw size={16} />
              Refresh
            </button>
            <Link href="/changelog/new" className="admin-button admin-button-primary">
              <FiPlus size={16} />
              New Entry
            </Link>
          </div>
        }
      />

      <FilterBar
        searchSlot={
          <div className="grid gap-2">
            <label className="admin-eyebrow" htmlFor="status-filter">
              Filter by status
            </label>
            <select
              id="status-filter"
              className="admin-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        }
        actionSlot={
          <>
            <button className="admin-button admin-button-primary" onClick={handleFilter}>
              <FiSearch size={16} />
              Filter
            </button>
            <button className="admin-button admin-button-ghost" onClick={handleReset}>
              <FiRotateCcw size={16} />
              Reset
            </button>
          </>
        }
      />

      {loading ? (
        <TableSkeleton rows={10} columns={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadEntries(1)} />
      ) : (
        <>
          <DataTable
            rows={entries}
            rowKey={(row) => row._id}
            emptyTitle="No changelog entries"
            emptyMessage="Create your first entry using the New Entry button above."
            mobileCardTitle={(row) => row.title}
            mobileCardMeta={(row) => row.version ?? ""}
            mobileCardFooter={(row) => (
              <StatusBadge
                label={row.status}
                variant={row.status === "published" ? "success" : "warning"}
                size="sm"
              />
            )}
            columns={[
              {
                key: "title",
                label: "Title",
                emphasize: true,
                width: "30%",
                render: (value, row) => (
                  <Link
                    className="font-semibold text-[color:var(--admin-text)] transition-colors hover:text-[color:var(--admin-accent-strong)]"
                    href={`/changelog/${row._id}`}
                  >
                    {value}
                  </Link>
                ),
              },
              {
                key: "version",
                label: "Version",
                width: "10%",
                render: (value) =>
                  value ? (
                    <span className="font-mono text-xs">{value}</span>
                  ) : (
                    <span className="text-[color:var(--admin-text-faint)]">—</span>
                  ),
              },
              {
                key: "category",
                label: "Category",
                width: "16%",
                render: (value) => (
                  <StatusBadge label={CATEGORY_LABELS[value] ?? value} variant="info" />
                ),
              },
              {
                key: "status",
                label: "Status",
                width: "12%",
                render: (value) => (
                  <StatusBadge
                    label={value}
                    variant={value === "published" ? "success" : "warning"}
                  />
                ),
              },
              {
                key: "publishedAt",
                label: "Published",
                width: "14%",
                render: (value) => formatDate(value),
              },
              {
                key: "_id",
                label: "Actions",
                align: "right",
                width: "18%",
                render: (_, row) => (
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/changelog/${row._id}`}
                      className="admin-button admin-button-ghost admin-button-sm"
                    >
                      Edit
                    </Link>
                    {row.status === "draft" && (
                      <button
                        className="admin-button admin-button-primary admin-button-sm"
                        onClick={() => handlePublish(row._id)}
                      >
                        Publish
                      </button>
                    )}
                    <button
                      className="admin-button admin-button-danger admin-button-sm"
                      onClick={() => handleDelete(row._id)}
                    >
                      Delete
                    </button>
                  </div>
                ),
              },
            ]}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}
