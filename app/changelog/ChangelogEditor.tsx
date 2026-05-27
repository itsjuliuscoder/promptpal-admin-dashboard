"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import { changelogApi, type ChangelogEntry, type ChangelogPayload } from "@/lib/changelog-api";

const CATEGORIES: { value: ChangelogEntry["category"]; label: string }[] = [
  { value: "new_feature", label: "New Feature" },
  { value: "improvement", label: "Improvement" },
  { value: "bug_fix", label: "Bug Fix" },
  { value: "deprecation", label: "Deprecation" },
  { value: "security", label: "Security" },
];

interface Props {
  id?: string; // undefined = new entry
}

export default function ChangelogEditor({ id }: Props) {
  const router = useRouter();
  const isNew = !id;

  const [title, setTitle] = useState("");
  const [version, setVersion] = useState("");
  const [category, setCategory] = useState<ChangelogEntry["category"]>("new_feature");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("Julius");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    changelogApi
      .getOne(id)
      .then((entry) => {
        setTitle(entry.title);
        setVersion(entry.version ?? "");
        setCategory(entry.category);
        setSummary(entry.summary ?? "");
        setBody(entry.body);
        setAuthor(entry.author);
        setStatus(entry.status);
      })
      .catch(() => setError("Failed to load entry."))
      .finally(() => setLoading(false));
  }, [id]);

  const buildPayload = (): ChangelogPayload => ({
    title: title.trim(),
    version: version.trim() || undefined,
    category,
    body,
    summary: summary.trim() || undefined,
    author: author.trim() || "Julius",
  });

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) {
      setError("Title and body are required.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (isNew) {
        const created = await changelogApi.create(buildPayload());
        setSuccessMsg("Entry saved as draft.");
        router.replace(`/changelog/${created._id}`);
      } else {
        await changelogApi.update(id!, buildPayload());
        setSuccessMsg("Entry saved.");
      }
    } catch {
      setError("Failed to save entry.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!id) {
      setError("Save the entry as a draft first.");
      return;
    }
    if (!confirm("Publish this entry? Subscribers will be notified.")) return;
    setPublishing(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await changelogApi.update(id, buildPayload());
      await changelogApi.publish(id);
      setStatus("published");
      setSuccessMsg("Entry published and subscribers notified.");
    } catch {
      setError("Failed to publish entry.");
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!id) return;
    if (!confirm("Unpublish this entry? It will revert to draft.")) return;
    setUnpublishing(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await changelogApi.unpublish(id);
      setStatus("draft");
      setSuccessMsg("Entry unpublished.");
    } catch {
      setError("Failed to unpublish entry.");
    } finally {
      setUnpublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("Permanently delete this entry? This cannot be undone.")) return;
    try {
      await changelogApi.remove(id);
      router.push("/changelog");
    } catch {
      setError("Failed to delete entry.");
    }
  };

  if (loading) {
    return (
      <div className="admin-page space-y-6">
        <div className="admin-skeleton h-10 w-48 rounded" />
        <div className="admin-skeleton h-64 w-full rounded" />
      </div>
    );
  }

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow="Content / Changelog"
        title={isNew ? "New Entry" : title || "Edit Entry"}
        description={
          isNew
            ? "Create a new changelog entry. Save as draft, then publish when ready."
            : `Status: ${status === "published" ? "Published" : "Draft"}`
        }
        actions={
          <button
            className="admin-button admin-button-ghost"
            onClick={() => router.push("/changelog")}
          >
            ← Back to list
          </button>
        }
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="admin-card space-y-4 p-6">
            <div className="grid gap-1.5">
              <label className="admin-eyebrow" htmlFor="entry-title">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="entry-title"
                className="admin-input"
                placeholder="e.g. Connector sync speed improvements"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <label className="admin-eyebrow" htmlFor="entry-summary">
                Summary <span className="text-[color:var(--admin-text-faint)]">(max 200 chars)</span>
              </label>
              <textarea
                id="entry-summary"
                className="admin-input resize-none"
                rows={2}
                maxLength={200}
                placeholder="One-line teaser shown in the changelog list"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
              <p className="text-xs text-[color:var(--admin-text-faint)]">
                {summary.length}/200
              </p>
            </div>

            <div className="grid gap-1.5">
              <label className="admin-eyebrow" htmlFor="entry-body">
                Body (Markdown) <span className="text-red-500">*</span>
              </label>
              <textarea
                id="entry-body"
                className="admin-input font-mono text-sm resize-y"
                rows={16}
                placeholder="## What's new&#10;&#10;Describe the release in Markdown..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="admin-card space-y-4 p-5">
            <h3 className="admin-eyebrow">Entry details</h3>

            <div className="grid gap-1.5">
              <label className="admin-eyebrow text-xs" htmlFor="entry-version">
                Version
              </label>
              <input
                id="entry-version"
                className="admin-input font-mono"
                placeholder="e.g. v1.4.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <label className="admin-eyebrow text-xs" htmlFor="entry-category">
                Category
              </label>
              <select
                id="entry-category"
                className="admin-input"
                value={category}
                onChange={(e) => setCategory(e.target.value as ChangelogEntry["category"])}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <label className="admin-eyebrow text-xs" htmlFor="entry-author">
                Author
              </label>
              <input
                id="entry-author"
                className="admin-input"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-card space-y-3 p-5">
            <h3 className="admin-eyebrow">Actions</h3>

            <button
              className="admin-button admin-button-secondary w-full"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Draft"}
            </button>

            {status === "draft" && (
              <button
                className="admin-button admin-button-primary w-full"
                onClick={handlePublish}
                disabled={publishing || isNew}
                title={isNew ? "Save as draft first" : undefined}
              >
                {publishing ? "Publishing…" : "Publish"}
              </button>
            )}

            {status === "published" && (
              <button
                className="admin-button admin-button-secondary w-full"
                onClick={handleUnpublish}
                disabled={unpublishing}
              >
                {unpublishing ? "Unpublishing…" : "Unpublish"}
              </button>
            )}

            {!isNew && (
              <button
                className="admin-button admin-button-danger w-full"
                onClick={handleDelete}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
