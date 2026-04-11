"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FiRefreshCw, FiRotateCcw, FiSearch } from "react-icons/fi";
import DataTable from "@/components/shared/DataTable";
import FilterBar from "@/components/shared/FilterBar";
import Pagination from "@/components/shared/Pagination";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import ErrorState from "@/components/shared/ErrorState";
import { adminService } from "@/lib/services/adminService";

interface PromptRow {
  _id: string;
  title: string;
  visibility: string;
  isTemplate: boolean;
  updatedAt: string;
  userId?: {
    _id: string;
    name?: string;
    email?: string;
  } | null;
}

function formatDate(value?: string) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminPromptsPage() {
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadPrompts = async (page: number = currentPage, searchTerm: string = search) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getPrompts({
        search: searchTerm,
        page,
        limit: itemsPerPage,
      });
      setPrompts(response.data || []);
      if (response.pagination) {
        setTotalPages(response.pagination.totalPages || 1);
        setTotal(response.pagination.total || 0);
      }
    } catch (err) {
      console.error("Failed to load prompts", err);
      setError("Failed to load prompts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = () => {
    if (currentPage === 1) {
      loadPrompts(1, search);
    } else {
      setCurrentPage(1);
    }
  };

  const handleReset = () => {
    setSearch("");
    if (currentPage === 1) {
      loadPrompts(1, "");
    } else {
      setCurrentPage(1);
    }
  };

  const promptStats = useMemo(() => {
    const templates = prompts.filter((prompt) => prompt.isTemplate).length;
    const privateCount = prompts.filter((prompt) => prompt.visibility === "private").length;
    const publicCount = prompts.filter((prompt) => prompt.visibility === "public").length;
    return {
      templates,
      prompts: prompts.length - templates,
      privateCount,
      publicCount,
    };
  }, [prompts]);

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Prompts"
        description="Review the prompt catalog, identify templates quickly, and track who owns the most recent updates."
        metadata={
          <>
            <span className="admin-stat-pill">Page {currentPage}</span>
            <span className="admin-stat-pill">{total || prompts.length} total items</span>
          </>
        }
        actions={
          <button
            className="admin-button admin-button-secondary"
            onClick={() => loadPrompts(currentPage)}
          >
            <FiRefreshCw size={16} />
            Refresh
          </button>
        }
      />

      <FilterBar
        searchSlot={
          <div className="grid gap-2">
            <label className="admin-eyebrow" htmlFor="prompt-search">
              Search prompts
            </label>
            <input
              id="prompt-search"
              className="admin-input"
              placeholder="Search titles, prompt text, or owners"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSearch();
              }}
            />
          </div>
        }
        actionSlot={
          <>
            <button className="admin-button admin-button-primary" onClick={handleSearch}>
              <FiSearch size={16} />
              Search
            </button>
            <button className="admin-button admin-button-ghost" onClick={handleReset}>
              <FiRotateCcw size={16} />
              Reset
            </button>
          </>
        }
      />

      <section className="admin-summary-strip">
        <div className="admin-summary-item">
          <p className="admin-summary-label">Total prompts</p>
          <p className="admin-summary-value">{total || prompts.length}</p>
          <p className="admin-summary-hint">Catalog size across prompt and template content</p>
        </div>
        <div className="admin-summary-item">
          <p className="admin-summary-label">Visible templates</p>
          <p className="admin-summary-value">{promptStats.templates}</p>
          <p className="admin-summary-hint">Template items on the current result page</p>
        </div>
        <div className="admin-summary-item">
          <p className="admin-summary-label">Visible prompts</p>
          <p className="admin-summary-value">{promptStats.prompts}</p>
          <p className="admin-summary-hint">Standard prompts on the current result page</p>
        </div>
        <div className="admin-summary-item">
          <p className="admin-summary-label">Visibility mix</p>
          <p className="admin-summary-value">
            {promptStats.privateCount}/{promptStats.publicCount}
          </p>
          <p className="admin-summary-hint">Private vs public items on this page</p>
        </div>
      </section>

      {loading ? (
        <TableSkeleton rows={10} columns={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadPrompts(1)} />
      ) : (
        <>
          <DataTable
            rows={prompts}
            rowKey={(row) => row._id}
            emptyTitle="No prompts found"
            emptyMessage="No prompts matched the current search query."
            mobileCardTitle={(row) => (
              <Link
                className="text-[color:var(--admin-text)] hover:text-[color:var(--admin-accent-strong)]"
                href={`/prompts/${row._id}`}
              >
                {row.title}
              </Link>
            )}
            mobileCardMeta={(row) =>
              row.userId?.name || row.userId?.email || "Deleted user"
            }
            mobileCardFooter={(row) => (
              <StatusBadge
                label={row.isTemplate ? "Template" : "Prompt"}
                variant="info"
                size="sm"
              />
            )}
            columns={[
              {
                key: "title",
                label: "Title",
                emphasize: true,
                width: "34%",
                render: (value, row) => (
                  <Link
                    className="font-semibold text-[color:var(--admin-text)] transition-colors hover:text-[color:var(--admin-accent-strong)]"
                    href={`/prompts/${row._id}`}
                  >
                    {value}
                  </Link>
                ),
              },
              {
                key: "visibility",
                label: "Visibility",
                width: "14%",
                render: (value) => (
                  <StatusBadge
                    label={value}
                    variant={value === "public" ? "success" : "info"}
                  />
                ),
              },
              {
                key: "isTemplate",
                label: "Type",
                width: "14%",
                render: (value) => (
                  <StatusBadge
                    label={value ? "Template" : "Prompt"}
                    variant="info"
                  />
                ),
              },
              {
                key: "userId",
                label: "Created by",
                width: "22%",
                render: (_, row) => {
                  if (!row.userId || !row.userId._id) {
                    return <span className="text-[color:var(--admin-text-faint)]">Deleted user</span>;
                  }
                  const displayName = row.userId.name || row.userId.email || "Unknown";
                  return (
                    <Link
                      className="font-medium text-[color:var(--admin-accent-strong)] hover:underline"
                      href={`/users/${row.userId._id}`}
                    >
                      {displayName}
                    </Link>
                  );
                },
              },
              {
                key: "updatedAt",
                label: "Updated",
                align: "right",
                width: "16%",
                render: (value) => formatDate(value),
              },
            ]}
          />
          {totalPages > 1 ? (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
