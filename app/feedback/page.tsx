"use client";

import React, { useEffect, useState } from "react";
import { FiRefreshCw, FiRotateCcw, FiSearch } from "react-icons/fi";
import DataTable from "@/components/shared/DataTable";
import ErrorState from "@/components/shared/ErrorState";
import FilterBar from "@/components/shared/FilterBar";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import PageHeader from "@/components/shared/PageHeader";
import Pagination from "@/components/shared/Pagination";
import StatusBadge from "@/components/shared/StatusBadge";
import { adminService, type AdminFeedbackItem } from "@/lib/services/adminService";

function formatDate(value?: string) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCategory(value: string) {
  if (!value) return "General";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<AdminFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const loadFeedback = async (page: number = currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getFeedback({
        page,
        limit: itemsPerPage,
        q: search || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
      });

      setFeedback(response.feedback || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error("Failed to load feedback list", err);
      setError("Failed to load feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    loadFeedback(1);
  };

  const handleReset = () => {
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("");
    setCurrentPage(1);
    setTimeout(() => {
      loadFeedback(1);
    }, 0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadFeedback(page);
  };

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Feedback"
        description="Review user-submitted product feedback, bug reports, and feature requests in one admin queue."
        metadata={
          <>
            <span className="admin-stat-pill">Page {pagination?.page || 1}</span>
            <span className="admin-stat-pill">{pagination?.total || feedback.length} total feedback</span>
          </>
        }
        actions={
          <button className="admin-button admin-button-secondary" onClick={() => loadFeedback(currentPage)}>
            <FiRefreshCw size={16} />
            Refresh
          </button>
        }
      />

      <FilterBar
        searchSlot={
          <div className="grid gap-2">
            <label className="admin-eyebrow" htmlFor="feedback-search">
              Search feedback
            </label>
            <input
              id="feedback-search"
              className="admin-input"
              placeholder="Search by subject or message"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSearch();
              }}
            />
          </div>
        }
        filterSlot={
          <>
            <select
              className="admin-select"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">All categories</option>
              <option value="general">General</option>
              <option value="feature-request">Feature Request</option>
              <option value="bug-report">Bug Report</option>
            </select>
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </>
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

      {loading ? (
        <TableSkeleton rows={10} columns={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadFeedback(1)} />
      ) : (
        <>
          <DataTable
            rows={feedback}
            rowKey={(row) => row._id}
            emptyTitle="No feedback found"
            emptyMessage="Try adjusting your filters or search query."
            mobileCardTitle={(row) => row.subject}
            mobileCardMeta={(row) => row.userId?.email || row.userId?.name || "Unknown user"}
            mobileCardFooter={(row) => (
              <StatusBadge label={row.status} variant="info" size="sm" />
            )}
            columns={[
              {
                key: "createdAt",
                label: "Submitted",
                width: "16%",
                render: (value) => formatDate(value),
              },
              {
                key: "userId",
                label: "User",
                width: "20%",
                render: (_, row) => row.userId?.email || row.userId?.name || "Deleted user",
              },
              {
                key: "category",
                label: "Category",
                width: "12%",
                render: (value) => <StatusBadge label={formatCategory(value)} variant="info" />,
              },
              {
                key: "subject",
                label: "Subject",
                emphasize: true,
                width: "24%",
              },
              {
                key: "priority",
                label: "Priority",
                width: "12%",
                render: (value) => (
                  <StatusBadge
                    label={value}
                    variant={value === "high" ? "error" : value === "medium" ? "warning" : "success"}
                  />
                ),
              },
              {
                key: "status",
                label: "Status",
                align: "right",
                width: "16%",
                render: (value) => (
                  <StatusBadge
                    label={value}
                    variant={value === "closed" ? "success" : value === "resolved" ? "info" : value === "in-progress" ? "warning" : "error"}
                  />
                ),
              },
            ]}
          />
          {pagination ? (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

