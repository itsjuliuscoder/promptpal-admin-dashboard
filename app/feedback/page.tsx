"use client";

import React, { useEffect, useState } from "react";
import { FiEdit3, FiPlus, FiRefreshCw, FiRotateCcw, FiSearch } from "react-icons/fi";
import DataTable from "@/components/shared/DataTable";
import ErrorState from "@/components/shared/ErrorState";
import FilterBar from "@/components/shared/FilterBar";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import PageHeader from "@/components/shared/PageHeader";
import Pagination from "@/components/shared/Pagination";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  adminService,
  type AdminFeedbackCreatePayload,
  type AdminFeedbackItem,
  type AdminFeedbackUpdatePayload,
} from "@/lib/services/adminService";

const categories = ["general", "feature-request", "bug-report"] as const;
const priorities = ["low", "medium", "high"] as const;
const statuses = ["open", "in-progress", "resolved", "closed"] as const;

const emptyCreateForm: AdminFeedbackCreatePayload = {
  category: "general",
  subject: "",
  message: "",
  priority: "medium",
  status: "open",
  adminNotes: "",
};

function formatDate(value?: string | null) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatLabel(value?: string) {
  if (!value) return "General";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function userLabel(feedback: AdminFeedbackItem) {
  if (feedback.source === "admin_created") return "Admin-created";
  return feedback.userId?.email || feedback.userId?.name || "Deleted user";
}

function metadataPreview(metadata?: Record<string, unknown>) {
  if (!metadata || Object.keys(metadata).length === 0) return "No metadata";
  return JSON.stringify(metadata, null, 2);
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<AdminFeedbackItem[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<AdminFeedbackItem | null>(null);
  const [createForm, setCreateForm] = useState<AdminFeedbackCreatePayload>(emptyCreateForm);
  const [editForm, setEditForm] = useState<AdminFeedbackUpdatePayload>({});
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
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

  const loadFeedback = async (page = currentPage) => {
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
      setPagination(response.pagination || null);
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

  const openDetail = async (item: AdminFeedbackItem) => {
    setDetailOpen(true);
    setModalLoading(true);
    setModalError(null);
    setSelectedFeedback(item);
    try {
      const response = await adminService.getFeedbackById(item._id);
      setSelectedFeedback(response.feedback);
      setEditForm({
        category: response.feedback.category,
        priority: response.feedback.priority,
        status: response.feedback.status,
        adminNotes: response.feedback.adminNotes || "",
      });
    } catch (err) {
      console.error("Failed to load feedback detail", err);
      setModalError("Failed to load feedback detail.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadFeedback(1);
  };

  const handleReset = () => {
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("");
    setCurrentPage(1);
    setTimeout(() => loadFeedback(1), 0);
  };

  const handleCreate = async () => {
    setSaving(true);
    setModalError(null);
    try {
      await adminService.createFeedback(createForm);
      setCreateOpen(false);
      setCreateForm(emptyCreateForm);
      setCurrentPage(1);
      await loadFeedback(1);
    } catch (err: any) {
      setModalError(err?.response?.data?.error || "Failed to create feedback.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedFeedback) return;
    setSaving(true);
    setModalError(null);
    try {
      const response = await adminService.updateFeedback(selectedFeedback._id, editForm);
      setFeedback((current) =>
        current.map((item) => (item._id === response.feedback._id ? response.feedback : item)),
      );
      setSelectedFeedback(response.feedback);
      setDetailOpen(false);
      await loadFeedback(currentPage);
    } catch (err: any) {
      setModalError(err?.response?.data?.error || "Failed to update feedback.");
    } finally {
      setSaving(false);
    }
  };

  const createDisabled =
    saving || !createForm.subject.trim() || createForm.message.trim().length < 10;

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
          <>
            <button className="admin-button admin-button-secondary" onClick={() => loadFeedback(currentPage)}>
              <FiRefreshCw size={16} />
              Refresh
            </button>
            <button className="admin-button admin-button-primary" onClick={() => setCreateOpen(true)}>
              <FiPlus size={16} />
              New feedback
            </button>
          </>
        }
      />

      <FilterBar>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
          <input
            className="admin-input"
            placeholder="Search by subject or message"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSearch();
            }}
          />
          <button className="admin-button admin-button-primary" onClick={handleSearch}>
            <FiSearch size={16} />
            Search
          </button>
          <button className="admin-button admin-button-secondary" onClick={handleReset}>
            <FiRotateCcw size={16} />
            Reset
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <select className="admin-select" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{formatLabel(category)}</option>
            ))}
          </select>
          <select className="admin-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{formatLabel(status)}</option>
            ))}
          </select>
        </div>
      </FilterBar>

      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState title="Unable to load feedback" message={error} onRetry={() => loadFeedback(currentPage)} />
      ) : (
        <>
          <DataTable
            columns={[
              {
                key: "createdAt",
                label: "Submitted",
                sortable: true,
                render: (_value, item: AdminFeedbackItem) => formatDate(item.createdAt),
              },
              {
                key: "user",
                label: "User",
                sortable: false,
                render: (_value, item: AdminFeedbackItem) => userLabel(item),
              },
              {
                key: "category",
                label: "Category",
                sortable: true,
                render: (_value, item: AdminFeedbackItem) => (
                  <StatusBadge label={formatLabel(item.category)} variant="info" />
                ),
              },
              {
                key: "subject",
                label: "Subject",
                sortable: true,
                emphasize: true,
                render: (_value, item: AdminFeedbackItem) => (
                  <button className="text-left font-semibold text-[color:var(--admin-text)] hover:underline" onClick={() => openDetail(item)}>
                    {item.subject}
                  </button>
                ),
              },
              {
                key: "priority",
                label: "Priority",
                sortable: true,
                render: (_value, item: AdminFeedbackItem) => (
                  <StatusBadge label={item.priority} variant={item.priority === "high" ? "error" : "warning"} />
                ),
              },
              {
                key: "status",
                label: "Status",
                sortable: true,
                render: (_value, item: AdminFeedbackItem) => (
                  <StatusBadge
                    label={formatLabel(item.status)}
                    variant={item.status === "resolved" || item.status === "closed" ? "success" : "error"}
                  />
                ),
              },
              {
                key: "actions",
                label: "Actions",
                sortable: false,
                render: (_value, item: AdminFeedbackItem) => (
                  <button className="admin-button admin-button-secondary" onClick={() => openDetail(item)}>
                    <FiEdit3 size={16} />
                    Review
                  </button>
                ),
              },
            ]}
            rows={feedback}
            emptyMessage="No feedback found"
            rowKey={(item) => item._id}
            mobileCardTitle={(item) => item.subject}
            mobileCardMeta={(item) => `${userLabel(item)} • ${formatDate(item.createdAt)}`}
            mobileCardFooter={(item) => (
              <button className="admin-button admin-button-secondary" onClick={() => openDetail(item)}>
                <FiEdit3 size={16} />
                Review
              </button>
            )}
          />
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={(page) => {
                setCurrentPage(page);
                loadFeedback(page);
              }}
            />
          )}
        </>
      )}

      <FeedbackModal
        open={createOpen}
        title="New feedback"
        primaryLabel={saving ? "Creating..." : "Create feedback"}
        primaryDisabled={createDisabled}
        onClose={() => {
          setCreateOpen(false);
          setModalError(null);
        }}
        onPrimary={handleCreate}
      >
        <FeedbackCreateForm form={createForm} setForm={setCreateForm} error={modalError} />
      </FeedbackModal>

      <FeedbackModal
        open={detailOpen}
        title="Feedback detail"
        primaryLabel={saving ? "Saving..." : "Save triage"}
        primaryDisabled={saving || modalLoading || !selectedFeedback}
        onClose={() => {
          setDetailOpen(false);
          setModalError(null);
        }}
        onPrimary={handleUpdate}
      >
        {modalLoading || !selectedFeedback ? (
          <div className="py-8 text-sm text-[color:var(--admin-text-soft)]">Loading feedback detail...</div>
        ) : (
          <FeedbackDetailForm
            feedback={selectedFeedback}
            form={editForm}
            setForm={setEditForm}
            error={modalError}
          />
        )}
      </FeedbackModal>
    </div>
  );
}

function FeedbackModal({
  open,
  title,
  primaryLabel,
  primaryDisabled,
  children,
  onClose,
  onPrimary,
}: {
  open: boolean;
  title: string;
  primaryLabel: string;
  primaryDisabled: boolean;
  children: React.ReactNode;
  onClose: () => void;
  onPrimary: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[color:var(--admin-border)] px-6 py-4">
          <h2 className="text-xl font-bold text-[color:var(--admin-text)]">{title}</h2>
          <button className="admin-button admin-button-secondary" onClick={onClose}>Close</button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        <div className="flex justify-end gap-3 border-t border-[color:var(--admin-border)] px-6 py-4">
          <button className="admin-button admin-button-secondary" onClick={onClose}>Cancel</button>
          <button className="admin-button admin-button-primary" disabled={primaryDisabled} onClick={onPrimary}>
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function FeedbackCreateForm({
  form,
  setForm,
  error,
}: {
  form: AdminFeedbackCreatePayload;
  setForm: React.Dispatch<React.SetStateAction<AdminFeedbackCreatePayload>>;
  error: string | null;
}) {
  return (
    <div className="space-y-5">
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="grid gap-4 md:grid-cols-3">
        <SelectField label="Category" value={form.category} onChange={(value) => setForm((current) => ({ ...current, category: value as AdminFeedbackCreatePayload["category"] }))} options={categories} />
        <SelectField label="Priority" value={form.priority} onChange={(value) => setForm((current) => ({ ...current, priority: value as AdminFeedbackCreatePayload["priority"] }))} options={priorities} />
        <SelectField label="Status" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value as AdminFeedbackCreatePayload["status"] }))} options={statuses} />
      </div>
      <TextField label="Subject" value={form.subject} maxLength={200} onChange={(value) => setForm((current) => ({ ...current, subject: value }))} />
      <TextAreaField label="Message" value={form.message} rows={5} onChange={(value) => setForm((current) => ({ ...current, message: value }))} />
      <TextAreaField label="Admin notes" value={form.adminNotes || ""} rows={3} onChange={(value) => setForm((current) => ({ ...current, adminNotes: value }))} />
    </div>
  );
}

function FeedbackDetailForm({
  feedback,
  form,
  setForm,
  error,
}: {
  feedback: AdminFeedbackItem;
  form: AdminFeedbackUpdatePayload;
  setForm: React.Dispatch<React.SetStateAction<AdminFeedbackUpdatePayload>>;
  error: string | null;
}) {
  return (
    <div className="space-y-5">
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="rounded-lg border border-[color:var(--admin-border)] bg-white p-4">
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <p><strong>User:</strong> {userLabel(feedback)}</p>
          <p><strong>Submitted:</strong> {formatDate(feedback.createdAt)}</p>
          <p><strong>Source:</strong> {formatLabel(feedback.source || "user")}</p>
          <p><strong>Resolved:</strong> {feedback.resolvedAt ? formatDate(feedback.resolvedAt) : "N/A"}</p>
        </div>
        <div className="mt-4">
          <p className="admin-eyebrow">Subject</p>
          <p className="font-semibold text-[color:var(--admin-text)]">{feedback.subject}</p>
        </div>
        <div className="mt-4">
          <p className="admin-eyebrow">Message</p>
          <p className="mt-1 whitespace-pre-wrap text-[color:var(--admin-text-soft)]">{feedback.message}</p>
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer font-semibold text-[color:var(--admin-text)]">Metadata</summary>
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-[color:var(--admin-bg)] p-3 text-xs text-[color:var(--admin-text-soft)]">
            {metadataPreview(feedback.metadata)}
          </pre>
        </details>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SelectField label="Category" value={form.category || feedback.category} onChange={(value) => setForm((current) => ({ ...current, category: value as AdminFeedbackUpdatePayload["category"] }))} options={categories} />
        <SelectField label="Priority" value={form.priority || feedback.priority} onChange={(value) => setForm((current) => ({ ...current, priority: value as AdminFeedbackUpdatePayload["priority"] }))} options={priorities} />
        <SelectField label="Status" value={form.status || feedback.status} onChange={(value) => setForm((current) => ({ ...current, status: value as AdminFeedbackUpdatePayload["status"] }))} options={statuses} />
      </div>
      <TextAreaField label="Admin notes" value={form.adminNotes ?? feedback.adminNotes ?? ""} rows={4} onChange={(value) => setForm((current) => ({ ...current, adminNotes: value }))} />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="admin-eyebrow">{label}</span>
      <select className="admin-select" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{formatLabel(option)}</option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  maxLength,
  onChange,
}: {
  label: string;
  value: string;
  maxLength?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="admin-eyebrow">{label}</span>
      <input className="admin-input" value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  rows,
  onChange,
}: {
  label: string;
  value: string;
  rows: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="admin-eyebrow">{label}</span>
      <textarea className="admin-input min-h-24 resize-y" rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
