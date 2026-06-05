"use client";

import React, { useCallback, useEffect, useState } from "react";
import { FiMail, FiRefreshCw, FiRotateCcw } from "react-icons/fi";
import DataTable from "@/components/shared/DataTable";
import ErrorState from "@/components/shared/ErrorState";
import FilterBar from "@/components/shared/FilterBar";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import StatusBadge from "@/components/shared/StatusBadge";
import { PreviewNotice } from "@/components/shared/AdminWidgets";
import RejectApplicationModal from "@/components/creators/RejectApplicationModal";
import {
  adminService,
  type CreatorApplication,
  type CreatorApplicationStatus,
} from "@/lib/services/adminService";

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusVariant(status: string): "success" | "warning" | "error" | "info" {
  if (status === "invited") return "success";
  if (status === "rejected") return "error";
  return "warning";
}

export default function ApplicationsSection() {
  const [statusFilter, setStatusFilter] = useState<CreatorApplicationStatus | "">(
    "pending"
  );
  const [applications, setApplications] = useState<CreatorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInvitingEmail, setIsInvitingEmail] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<CreatorApplication | null>(null);
  const [devInviteUrl, setDevInviteUrl] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getCreatorApplications({
        status: statusFilter || undefined,
        limit: 100,
      });
      setApplications(response.applications || []);
    } catch (err) {
      console.error("Failed to load creator applications", err);
      setError("Failed to load applications. Please try again.");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleInvite = async (applicationId: string) => {
    if (!window.confirm("Send invitation email to this applicant?")) return;
    setActionId(applicationId);
    setActionMessage(null);
    try {
      const result = await adminService.inviteCreatorApplication(applicationId);
      if (result.invitation?.activationUrl) {
        setDevInviteUrl(result.invitation.activationUrl);
        console.info("Creator invite URL:", result.invitation.activationUrl);
      }
      setActionMessage("Invitation sent successfully.");
      await loadApplications();
    } catch (err) {
      console.error("Failed to invite application", err);
      setActionMessage("Failed to send invitation.");
    } finally {
      setActionId(null);
    }
  };

  const handleInviteEmail = async () => {
    if (!inviteEmail.includes("@")) {
      setActionMessage("Enter a valid email address.");
      return;
    }
    setIsInvitingEmail(true);
    setActionMessage(null);
    try {
      const result = await adminService.inviteCreatorEmail(inviteEmail);
      if (result.invitation?.activationUrl) {
        setDevInviteUrl(result.invitation.activationUrl);
        console.info("Creator invite URL:", result.invitation.activationUrl);
      }
      setActionMessage(`Invited ${inviteEmail}`);
      setInviteEmail("");
      await loadApplications();
    } catch (err) {
      console.error("Failed to invite by email", err);
      setActionMessage("Failed to send invitation.");
    } finally {
      setIsInvitingEmail(false);
    }
  };

  const handleReject = async (notes: string) => {
    if (!rejectTarget) return;
    await adminService.rejectCreatorApplication(rejectTarget.id, notes);
    setActionMessage("Application rejected.");
    await loadApplications();
  };

  return (
    <div className="space-y-6">
      {actionMessage ? (
        <PreviewNotice title="Update" message={actionMessage} />
      ) : null}
      {devInviteUrl ? (
        <div className="admin-panel-muted rounded-2xl border border-[color:var(--admin-border)] p-4 text-sm">
          <p className="admin-eyebrow">Dev invite URL</p>
          <p className="mt-2 break-all font-mono text-[color:var(--admin-text-soft)]">
            {devInviteUrl}
          </p>
        </div>
      ) : null}

      <FilterBar
        filterSlot={
          <select
            className="admin-select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as CreatorApplicationStatus | "")
            }
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="invited">Invited</option>
            <option value="rejected">Rejected</option>
          </select>
        }
        searchSlot={
          <div className="grid gap-2">
            <label className="admin-eyebrow" htmlFor="direct-invite-email">
              Direct invite by email
            </label>
            <input
              id="direct-invite-email"
              className="admin-input"
              type="email"
              placeholder="creator@example.com"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleInviteEmail();
              }}
            />
          </div>
        }
        actionSlot={
          <>
            <button
              type="button"
              className="admin-button admin-button-primary"
              onClick={handleInviteEmail}
              disabled={isInvitingEmail}
            >
              <FiMail size={16} />
              Invite
            </button>
            <button
              type="button"
              className="admin-button admin-button-secondary"
              onClick={loadApplications}
            >
              <FiRefreshCw size={16} />
              Refresh
            </button>
            <button
              type="button"
              className="admin-button admin-button-ghost"
              onClick={() => {
                setStatusFilter("pending");
                setInviteEmail("");
                setDevInviteUrl(null);
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
        <TableSkeleton rows={8} columns={8} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadApplications} />
      ) : (
        <DataTable
          rows={applications}
          rowKey={(row) => row.id}
          emptyTitle="No applications found"
          emptyMessage="Try adjusting the status filter or invite creators directly."
          mobileCardTitle={(row) => row.name || row.email}
          mobileCardMeta={(row) => `${row.primaryPlatform} · ${row.handle || "—"}`}
          mobileCardFooter={(row) => (
            <StatusBadge label={row.status} variant={statusVariant(row.status)} size="sm" />
          )}
          columns={[
            {
              key: "name",
              label: "Name",
              width: "14%",
              emphasize: true,
              render: (value) => value || "—",
            },
            {
              key: "email",
              label: "Email",
              width: "18%",
            },
            {
              key: "primaryPlatform",
              label: "Platform",
              width: "10%",
              render: (value) => String(value).toUpperCase(),
            },
            {
              key: "handle",
              label: "Handle",
              width: "12%",
              render: (value) => value || "—",
            },
            {
              key: "followerRange",
              label: "Followers",
              width: "12%",
              render: (value) => value || "—",
            },
            {
              key: "status",
              label: "Status",
              width: "10%",
              render: (value) => (
                <StatusBadge label={String(value)} variant={statusVariant(String(value))} />
              ),
            },
            {
              key: "createdAt",
              label: "Applied",
              width: "14%",
              render: (value) => formatDate(value),
            },
            {
              key: "id",
              label: "Actions",
              align: "right",
              width: "10%",
              sortable: false,
              render: (_, row) =>
                row.status === "pending" ? (
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="admin-button admin-button-primary min-h-[36px] px-3 py-1.5 text-xs"
                      disabled={actionId === row.id}
                      onClick={() => handleInvite(row.id)}
                    >
                      Invite
                    </button>
                    <button
                      type="button"
                      className="admin-button admin-button-ghost min-h-[36px] px-3 py-1.5 text-xs"
                      onClick={() => setRejectTarget(row)}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-[color:var(--admin-text-faint)]">—</span>
                ),
            },
          ]}
        />
      )}

      <RejectApplicationModal
        open={Boolean(rejectTarget)}
        email={rejectTarget?.email}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
      />
    </div>
  );
}
