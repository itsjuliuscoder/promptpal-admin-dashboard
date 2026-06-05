"use client";

import React, { useCallback, useEffect, useState } from "react";
import { FiRefreshCw, FiRotateCcw } from "react-icons/fi";
import DataTable from "@/components/shared/DataTable";
import ErrorState from "@/components/shared/ErrorState";
import FilterBar from "@/components/shared/FilterBar";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import StatusBadge from "@/components/shared/StatusBadge";
import { PreviewNotice } from "@/components/shared/AdminWidgets";
import ReviewSubmissionModal from "@/components/creators/ReviewSubmissionModal";
import {
  adminService,
  type CreatorSubmission,
  type CreatorSubmissionStatus,
} from "@/lib/services/adminService";

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusVariant(status: string): "success" | "warning" | "error" | "info" {
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  return "warning";
}

export default function SubmissionsSection() {
  const [statusFilter, setStatusFilter] = useState<CreatorSubmissionStatus | "">(
    "pending"
  );
  const [submissions, setSubmissions] = useState<CreatorSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<CreatorSubmission | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getCreatorSubmissions({
        status: statusFilter || undefined,
        limit: 100,
      });
      setSubmissions(response.submissions || []);
    } catch (err) {
      console.error("Failed to load creator submissions", err);
      setError("Failed to load submissions. Please try again.");
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleReview = async (
    submissionId: string,
    status: "approved" | "rejected",
    notes: string
  ) => {
    const result = await adminService.reviewCreatorSubmission(submissionId, {
      status,
      reviewerNotes: notes,
    });
    if (status === "approved") {
      setActionMessage(
        `Submission approved (+${result.submission?.pointsAwarded ?? 0} pts).`
      );
    } else {
      setActionMessage("Submission rejected.");
    }
    await loadSubmissions();
  };

  return (
    <div className="space-y-6">
      {actionMessage ? (
        <PreviewNotice title="Update" message={actionMessage} />
      ) : null}

      <FilterBar
        filterSlot={
          <select
            className="admin-select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as CreatorSubmissionStatus | "")
            }
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="">All statuses</option>
          </select>
        }
        actionSlot={
          <>
            <button
              type="button"
              className="admin-button admin-button-secondary"
              onClick={loadSubmissions}
            >
              <FiRefreshCw size={16} />
              Refresh
            </button>
            <button
              type="button"
              className="admin-button admin-button-ghost"
              onClick={() => {
                setStatusFilter("pending");
                setActionMessage(null);
              }}
            >
              <FiRotateCcw size={16} />
              Reset
            </button>
          </>
        }
      />

      {loading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadSubmissions} />
      ) : (
        <DataTable
          rows={submissions}
          rowKey={(row) => row.id}
          emptyTitle="No submissions found"
          emptyMessage="Submissions appear here when creators submit content briefs."
          mobileCardTitle={(row) => row.brief?.title ?? "Submission"}
          mobileCardMeta={(row) => row.creator?.email ?? row.creator?.name ?? "—"}
          mobileCardFooter={(row) => (
            <StatusBadge label={row.status} variant={statusVariant(row.status)} size="sm" />
          )}
          columns={[
            {
              key: "creator",
              label: "Creator",
              width: "22%",
              emphasize: true,
              render: (_, row) => (
                <div>
                  <p className="font-medium text-[color:var(--admin-text)]">
                    {row.creator?.name ?? "—"}
                  </p>
                  <p className="text-xs text-[color:var(--admin-text-faint)]">
                    {row.creator?.email}
                  </p>
                </div>
              ),
            },
            {
              key: "brief",
              label: "Brief",
              width: "24%",
              render: (_, row) => row.brief?.title ?? "—",
            },
            {
              key: "platform",
              label: "Platform",
              width: "10%",
              render: (_, row) =>
                String(row.platform || row.brief?.platform || "—").toUpperCase(),
            },
            {
              key: "status",
              label: "Status",
              width: "12%",
              render: (value) => (
                <StatusBadge label={String(value)} variant={statusVariant(String(value))} />
              ),
            },
            {
              key: "submittedAt",
              label: "Submitted",
              width: "18%",
              render: (value) => formatDate(value),
            },
            {
              key: "id",
              label: "Actions",
              align: "right",
              width: "14%",
              sortable: false,
              render: (_, row) => (
                <button
                  type="button"
                  className="admin-button admin-button-primary min-h-[36px] px-3 py-1.5 text-xs"
                  onClick={() => setReviewTarget(row)}
                >
                  {row.status === "pending" ? "Review" : "View"}
                </button>
              ),
            },
          ]}
        />
      )}

      <ReviewSubmissionModal
        open={Boolean(reviewTarget)}
        submission={reviewTarget}
        onClose={() => setReviewTarget(null)}
        onReview={handleReview}
      />
    </div>
  );
}
