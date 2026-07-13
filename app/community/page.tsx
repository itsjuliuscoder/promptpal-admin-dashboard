"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiEdit3,
  FiFlag,
  FiGrid,
  FiMessageSquare,
  FiPlus,
  FiRefreshCw,
  FiServer,
  FiStar,
  FiTag,
} from "react-icons/fi";
import PageHeader from "@/components/shared/PageHeader";
import SectionWorkspace, { WorkspaceSectionItem } from "@/components/shared/SectionWorkspace";
import SectionCard from "@/components/shared/SectionCard";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import ErrorState from "@/components/shared/ErrorState";
import { CardSkeleton } from "@/components/shared/LoadingSkeleton";
import { MetricTile, PreviewNotice } from "@/components/shared/AdminWidgets";
import { useSectionQueryState } from "@/lib/hooks/useSectionQueryState";
import {
  adminService,
  type CommunityCmsItem,
  type CommunityCmsReport,
  type CommunityCmsTopic,
} from "@/lib/services/adminService";

const SECTIONS: WorkspaceSectionItem[] = [
  { id: "overview", label: "Overview", icon: <FiGrid size={18} /> },
  { id: "prompts", label: "Prompts", icon: <FiTag size={18} /> },
  { id: "discussions", label: "Discussions", icon: <FiMessageSquare size={18} /> },
  { id: "mcp", label: "MCP servers", icon: <FiServer size={18} /> },
  { id: "topics", label: "Topics", icon: <FiGrid size={18} /> },
  { id: "featured", label: "Featured", icon: <FiStar size={18} /> },
  { id: "moderation", label: "Moderation", icon: <FiFlag size={18} /> },
];

const EMPTY_TOPIC = {
  name: "",
  slug: "",
  description: "",
  accent: "#6D4AFF",
  order: 100,
  active: true,
};

function formatDate(value?: string) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function titleOf(item: CommunityCmsItem) {
  return item.title || item.name || "Untitled";
}

function statusFor(item: CommunityCmsItem) {
  if (item.qualityState) return item.qualityState;
  if (item.isActive === false || item.moderationStatus === "removed") return "removed";
  if (item.moderationStatus && item.moderationStatus !== "none") return item.moderationStatus;
  return "published";
}

function tagsText(value?: string[]) {
  return (value || []).join(", ");
}

export default function CommunityCmsPage() {
  const sectionIds = useMemo(() => SECTIONS.map((item) => item.id), []);
  const { activeSection, setActiveSection } = useSectionQueryState(sectionIds, "overview");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [query, setQuery] = useState("");

  const [overview, setOverview] = useState<{ counts: Record<string, number>; featuredSlots: number } | null>(null);
  const [prompts, setPrompts] = useState<CommunityCmsItem[]>([]);
  const [discussions, setDiscussions] = useState<CommunityCmsItem[]>([]);
  const [mcpServers, setMcpServers] = useState<CommunityCmsItem[]>([]);
  const [topics, setTopics] = useState<CommunityCmsTopic[]>([]);
  const [featured, setFeatured] = useState<Array<CommunityCmsItem & { type: "prompt" | "discussion" | "mcp" }>>([]);
  const [reports, setReports] = useState<CommunityCmsReport[]>([]);
  const [editTarget, setEditTarget] = useState<{ type: "prompt" | "discussion" | "mcp"; item: CommunityCmsItem } | null>(null);
  const [topicForm, setTopicForm] = useState(EMPTY_TOPIC);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, promptRes, discussionRes, mcpRes, topicRes, featuredRes, reportRes] =
        await Promise.all([
          adminService.getCommunityOverview(),
          adminService.getCommunityPrompts({ limit: 40 }),
          adminService.getCommunityDiscussions({ limit: 40 }),
          adminService.getCommunityMcpServers({ limit: 40 }),
          adminService.getCommunityTopics(),
          adminService.getCommunityFeatured(),
          adminService.getCommunityModeration({ limit: 40, status: "open" }),
        ]);
      setOverview(overviewRes.data);
      setPrompts(promptRes.items || []);
      setDiscussions(discussionRes.items || []);
      setMcpServers(mcpRes.items || []);
      setTopics(topicRes.items || []);
      setFeatured(featuredRes.items || []);
      setReports(reportRes.reports || []);
    } catch (loadError) {
      console.error("Failed to load community CMS", loadError);
      setError("Failed to load community CMS data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const reloadList = async (type: "prompts" | "discussions" | "mcp") => {
    if (type === "prompts") {
      const response = await adminService.getCommunityPrompts({ limit: 40, q: query || undefined });
      setPrompts(response.items || []);
    } else if (type === "discussions") {
      const response = await adminService.getCommunityDiscussions({ limit: 40, q: query || undefined });
      setDiscussions(response.items || []);
    } else {
      const response = await adminService.getCommunityMcpServers({ limit: 40, q: query || undefined });
      setMcpServers(response.items || []);
    }
  };

  const patchItem = async (
    type: "prompt" | "discussion" | "mcp",
    item: CommunityCmsItem,
    payload: Record<string, unknown>
  ) => {
    setSaving(true);
    setNotice(null);
    try {
      if (type === "prompt") await adminService.updateCommunityPrompt(item.id, payload);
      if (type === "discussion") await adminService.updateCommunityDiscussion(item.id, payload);
      if (type === "mcp") await adminService.updateCommunityMcpServer(item.id, payload);
      await Promise.all([reloadList(type === "mcp" ? "mcp" : type === "prompt" ? "prompts" : "discussions"), adminService.getCommunityFeatured().then((r) => setFeatured(r.items || []))]);
      setNotice({ type: "success", message: `${titleOf(item)} updated.` });
      setEditTarget(null);
    } catch (actionError: any) {
      setNotice({ type: "error", message: actionError?.response?.data?.error || "Failed to update community item." });
    } finally {
      setSaving(false);
    }
  };

  const toggleFeatured = async (type: "prompt" | "discussion" | "mcp", item: CommunityCmsItem) => {
    await patchItem(type, item, {
      isFeatured: !item.isFeatured,
      featuredRank: !item.isFeatured ? (featured.length || 0) + 1 : null,
      qualityState: type === "prompt" && !item.isFeatured ? "featured" : item.qualityState,
    });
  };

  const createTopic = async () => {
    if (!topicForm.name.trim()) return;
    setSaving(true);
    try {
      await adminService.createCommunityTopic(topicForm);
      const response = await adminService.getCommunityTopics();
      setTopics(response.items || []);
      setTopicForm(EMPTY_TOPIC);
      setNotice({ type: "success", message: "Topic created." });
    } catch (actionError: any) {
      setNotice({ type: "error", message: actionError?.response?.data?.error || "Failed to create topic." });
    } finally {
      setSaving(false);
    }
  };

  const reorderFeatured = async (draggedId: string, targetId: string) => {
    const next = [...featured];
    const from = next.findIndex((item) => `${item.type}-${item.id}` === draggedId);
    const to = next.findIndex((item) => `${item.type}-${item.id}` === targetId);
    if (from === -1 || to === -1) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setFeatured(next);
    const response = await adminService.updateCommunityFeatured(next.map((item) => ({ type: item.type, id: item.id })));
    setFeatured(response.items || next);
    setNotice({ type: "success", message: "Featured order saved." });
  };

  const actOnReport = async (report: CommunityCmsReport, action: string) => {
    setSaving(true);
    try {
      await adminService.actOnCommunityReport(report.id, { action, note: action });
      const response = await adminService.getCommunityModeration({ limit: 40, status: "open" });
      setReports(response.reports || []);
      setNotice({ type: "success", message: `Report ${action} action completed.` });
    } catch (actionError: any) {
      setNotice({ type: "error", message: actionError?.response?.data?.error || "Failed to act on report." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page space-y-6">
        <PageHeader eyebrow="Community" title="Community CMS" description="Manage community content, curation, topics, and reports." />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page space-y-6">
        <PageHeader eyebrow="Community" title="Community CMS" description="Manage community content, curation, topics, and reports." />
        <ErrorState message={error} onRetry={loadAll} />
      </div>
    );
  }

  const renderContentTable = (type: "prompt" | "discussion" | "mcp", rows: CommunityCmsItem[]) => (
    <SectionCard
      title={type === "mcp" ? "MCP servers" : type === "prompt" ? "Prompts" : "Discussions"}
      description="Search, curate, remove, restore, and edit safe public fields."
      actions={
        <button type="button" className="admin-button admin-button-secondary" onClick={() => reloadList(type === "mcp" ? "mcp" : type === "prompt" ? "prompts" : "discussions")}>
          <FiRefreshCw size={16} />
          Apply search
        </button>
      }
    >
      <div className="space-y-5">
        <div className="admin-toolbar">
          <input className="admin-input" placeholder="Search title, body, tags" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <DataTable
          rows={rows}
          rowKey={(row) => row.id}
          columns={[
            {
              key: "title",
              label: "Content",
              emphasize: true,
              render: (_value, row) => (
                <div>
                  <div className="font-semibold text-[color:var(--admin-text)]">{titleOf(row)}</div>
                  <div className="text-xs text-[color:var(--admin-text-faint)]">{row.topicSlug || "no topic"} · {row.author?.name || "unknown"}</div>
                </div>
              ),
            },
            {
              key: "qualityState",
              label: "Status",
              render: (_value, row) => <StatusBadge label={statusFor(row)} variant={statusFor(row).includes("removed") ? "error" : row.isFeatured ? "info" : "success"} />,
            },
            {
              key: "stats",
              label: "Signals",
              render: (_value, row) => `${row.stats?.likes || 0} likes · ${row.stats?.comments || 0} replies`,
            },
            { key: "updatedAt", label: "Updated", render: (value) => formatDate(value) },
            {
              key: "id",
              label: "Actions",
              render: (_value, row) => (
                <div className="flex flex-wrap gap-2">
                  <button className="admin-button admin-button-secondary min-h-[36px] px-3 py-1.5 text-xs" onClick={() => setEditTarget({ type, item: row })}>
                    <FiEdit3 size={14} />
                    Edit
                  </button>
                  <button className="admin-button admin-button-ghost min-h-[36px] px-3 py-1.5 text-xs" onClick={() => toggleFeatured(type, row)} disabled={saving}>
                    {row.isFeatured ? "Unfeature" : "Feature"}
                  </button>
                  <button
                    className="admin-button admin-button-ghost min-h-[36px] px-3 py-1.5 text-xs text-[color:var(--admin-danger)]"
                    onClick={() => patchItem(type, row, type === "prompt" ? { qualityState: row.qualityState === "removed" ? "published" : "removed" } : { isActive: row.isActive === false, moderationStatus: row.isActive === false ? "resolved" : "removed" })}
                    disabled={saving}
                  >
                    {row.isActive === false || row.qualityState === "removed" ? "Restore" : "Remove"}
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>
    </SectionCard>
  );

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow="Community"
        title="Community CMS"
        description="Manage PromptPal Community content, curation, topics, and moderation."
        metadata={<span className="admin-stat-pill">{overview?.counts.openReports || 0} open reports</span>}
        actions={<button type="button" className="admin-button admin-button-secondary" onClick={loadAll}><FiRefreshCw size={16} />Refresh</button>}
      />

      {notice ? (
        <div className={`rounded-[1rem] border px-4 py-3 text-sm ${notice.type === "success" ? "border-[color:var(--admin-success)]/30 bg-[color:var(--admin-success-soft)] text-[color:var(--admin-success)]" : "border-[color:var(--admin-danger)]/30 bg-[color:var(--admin-danger-soft)] text-[color:var(--admin-danger)]"}`}>
          {notice.message}
        </div>
      ) : null}

      <SectionWorkspace sections={SECTIONS} activeSection={activeSection} onSectionChange={setActiveSection} sectionLabel="Community CMS sections">
        {activeSection === "overview" ? (
          <div className="space-y-6">
            <div className="admin-metric-grid">
              <MetricTile label="Prompts" value={overview?.counts.prompts || 0} note="Public community prompts" />
              <MetricTile label="Discussions" value={overview?.counts.discussions || 0} note="Active community discussions" />
              <MetricTile label="MCP servers" value={overview?.counts.mcpServers || 0} note="Active server submissions" />
              <MetricTile label="Topics" value={overview?.counts.topics || 0} note="Active navigation topics" />
              <MetricTile label="Featured slots" value={overview?.featuredSlots || 0} note="Curated homepage candidates" />
            </div>
            <SectionCard title="Recent reports" description="Open moderation reports that need review.">
              {reports.length ? (
                <div className="space-y-3">
                  {reports.slice(0, 5).map((report) => (
                    <div key={report.id} className="admin-list-card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-[color:var(--admin-text)]">{report.reason} · {report.targetType}</p>
                        <p className="text-sm text-[color:var(--admin-text-soft)]">{report.details || "No details provided."}</p>
                      </div>
                      <StatusBadge label={report.status} variant="warning" />
                    </div>
                  ))}
                </div>
              ) : <PreviewNotice title="No open reports" message="The community moderation queue is clear." />}
            </SectionCard>
          </div>
        ) : null}

        {activeSection === "prompts" ? renderContentTable("prompt", prompts) : null}
        {activeSection === "discussions" ? renderContentTable("discussion", discussions) : null}
        {activeSection === "mcp" ? renderContentTable("mcp", mcpServers) : null}

        {activeSection === "topics" ? (
          <SectionCard title="Topics" description="Create and edit public community topic navigation.">
            <div className="space-y-6">
              <div className="admin-panel-muted rounded-2xl border border-[color:var(--admin-border)] p-4">
                <div className="grid gap-3 lg:grid-cols-[1fr_1fr_2fr_110px_auto]">
                  <input className="admin-input" placeholder="Name" value={topicForm.name} onChange={(e) => setTopicForm((c) => ({ ...c, name: e.target.value }))} />
                  <input className="admin-input" placeholder="Slug" value={topicForm.slug} onChange={(e) => setTopicForm((c) => ({ ...c, slug: e.target.value }))} />
                  <input className="admin-input" placeholder="Description" value={topicForm.description} onChange={(e) => setTopicForm((c) => ({ ...c, description: e.target.value }))} />
                  <input className="admin-input" placeholder="#6D4AFF" value={topicForm.accent} onChange={(e) => setTopicForm((c) => ({ ...c, accent: e.target.value }))} />
                  <button className="admin-button admin-button-primary" onClick={createTopic} disabled={saving || !topicForm.name}><FiPlus size={16} />Add</button>
                </div>
              </div>
              <DataTable
                rows={topics}
                rowKey={(row) => row.id}
                columns={[
                  { key: "name", label: "Topic", emphasize: true },
                  { key: "slug", label: "Slug" },
                  { key: "order", label: "Order" },
                  { key: "active", label: "Status", render: (value) => <StatusBadge label={value ? "Active" : "Hidden"} variant={value ? "success" : "warning"} /> },
                  {
                    key: "id",
                    label: "Actions",
                    render: (_value, row) => (
                      <button
                        className="admin-button admin-button-ghost min-h-[36px] px-3 py-1.5 text-xs"
                        onClick={async () => {
                          await adminService.updateCommunityTopic(row.id, { active: !row.active });
                          const response = await adminService.getCommunityTopics();
                          setTopics(response.items || []);
                        }}
                      >
                        {row.active ? "Hide" : "Show"}
                      </button>
                    ),
                  },
                ]}
              />
            </div>
          </SectionCard>
        ) : null}

        {activeSection === "featured" ? (
          <SectionCard title="Featured homepage curation" description="Drag featured items to reorder the homepage highlight candidates.">
            {featured.length ? (
              <div className="space-y-3">
                {featured.map((item, index) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="admin-list-card flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("text/plain", `${item.type}-${item.id}`)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      reorderFeatured(event.dataTransfer.getData("text/plain"), `${item.type}-${item.id}`);
                    }}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge label={`#${index + 1}`} variant="info" />
                        <span className="admin-eyebrow">{item.type}</span>
                      </div>
                      <p className="mt-1 font-semibold text-[color:var(--admin-text)]">{titleOf(item)}</p>
                      <p className="text-sm text-[color:var(--admin-text-soft)]">{item.topicSlug || "no topic"}</p>
                    </div>
                    <button className="admin-button admin-button-ghost" onClick={() => toggleFeatured(item.type, item)}>Remove</button>
                  </div>
                ))}
              </div>
            ) : <PreviewNotice title="No featured items" message="Feature prompts, discussions, or MCP servers from their CMS sections." />}
          </SectionCard>
        ) : null}

        {activeSection === "moderation" ? (
          <SectionCard title="Moderation reports" description="Resolve reports and remove, restore, warn, or suspend where appropriate.">
            {reports.length ? (
              <DataTable
                rows={reports}
                rowKey={(row) => row.id}
                columns={[
                  { key: "reason", label: "Reason", emphasize: true },
                  { key: "targetType", label: "Target" },
                  { key: "reporter", label: "Reporter", render: (value) => value?.email || value?.name || "Unknown" },
                  { key: "createdAt", label: "Reported", render: (value) => formatDate(value) },
                  {
                    key: "id",
                    label: "Actions",
                    render: (_value, row) => (
                      <div className="flex flex-wrap gap-2">
                        {["resolve", "remove", "restore", "warn", "suspend"].map((action) => (
                          <button key={action} className="admin-button admin-button-ghost min-h-[36px] px-3 py-1.5 text-xs" onClick={() => actOnReport(row, action)} disabled={saving}>
                            {action}
                          </button>
                        ))}
                      </div>
                    ),
                  },
                ]}
              />
            ) : <PreviewNotice title="No open reports" message="The moderation queue is clear." />}
          </SectionCard>
        ) : null}
      </SectionWorkspace>

      {editTarget ? (
        <EditModal
          target={editTarget}
          saving={saving}
          onClose={() => setEditTarget(null)}
          onSave={(payload) => patchItem(editTarget.type, editTarget.item, payload)}
        />
      ) : null}
    </div>
  );
}

function EditModal({
  target,
  saving,
  onClose,
  onSave,
}: {
  target: { type: "prompt" | "discussion" | "mcp"; item: CommunityCmsItem };
  saving: boolean;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => void;
}) {
  const item = target.item;
  const [title, setTitle] = useState(item.title || item.name || "");
  const [description, setDescription] = useState(item.description || item.content || item.body || "");
  const [topicSlug, setTopicSlug] = useState(item.topicSlug || "");
  const [tags, setTags] = useState(tagsText(item.tags || item.categories));
  const [curationLabel, setCurationLabel] = useState(item.curationLabel || "");

  const save = () => {
    const payload: Record<string, unknown> = {
      topicSlug,
      tags,
      curationLabel,
    };
    if (target.type === "prompt") {
      payload.title = title;
      payload.description = description;
      payload.body = item.body || description;
    } else if (target.type === "discussion") {
      payload.title = title;
      payload.content = description;
    } else {
      payload.name = title;
      payload.tagline = item.content ? item.content : description.slice(0, 180) || title;
      payload.description = description;
      payload.categories = tags;
    }
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="admin-panel w-full max-w-2xl p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[color:var(--admin-text)]">Edit {target.type}</h2>
            <p className="mt-2 text-sm text-[color:var(--admin-text-soft)]">Update safe public CMS fields.</p>
          </div>
          <button className="admin-button admin-button-ghost" onClick={onClose}>Close</button>
        </div>
        <div className="space-y-4">
          <div className="admin-field-stack">
            <label className="admin-field-label" htmlFor="cms-title">Title</label>
            <input id="cms-title" className="admin-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="admin-field-stack">
            <label className="admin-field-label" htmlFor="cms-description">Description or body</label>
            <textarea id="cms-description" className="admin-textarea min-h-[180px]" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="admin-field-grid">
            <div className="admin-field-stack">
              <label className="admin-field-label" htmlFor="cms-topic">Topic slug</label>
              <input id="cms-topic" className="admin-input" value={topicSlug} onChange={(e) => setTopicSlug(e.target.value)} />
            </div>
            <div className="admin-field-stack">
              <label className="admin-field-label" htmlFor="cms-tags">Tags or categories</label>
              <input id="cms-tags" className="admin-input" value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
          </div>
          <div className="admin-field-stack">
            <label className="admin-field-label" htmlFor="cms-curation">Curation label</label>
            <input id="cms-curation" className="admin-input" value={curationLabel} onChange={(e) => setCurationLabel(e.target.value)} />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button className="admin-button admin-button-secondary" onClick={onClose}>Cancel</button>
            <button className="admin-button admin-button-primary" onClick={save} disabled={saving}>
              <FiCheckCircle size={16} />
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
