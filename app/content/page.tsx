"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiGrid,
  FiPlus,
  FiRefreshCw,
  FiStar,
  FiTag,
  FiShield,
} from "react-icons/fi";
import PageHeader from "@/components/shared/PageHeader";
import SectionCard from "@/components/shared/SectionCard";
import ErrorState from "@/components/shared/ErrorState";
import { CardSkeleton, TableSkeleton } from "@/components/shared/LoadingSkeleton";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import SectionWorkspace, { WorkspaceSectionItem } from "@/components/shared/SectionWorkspace";
import { MetricTile, PreviewNotice } from "@/components/shared/AdminWidgets";
import { useSectionQueryState } from "@/lib/hooks/useSectionQueryState";
import { adminService } from "@/lib/services/adminService";
import { useAdminAuth } from "@/lib/auth/AdminAuthProvider";

interface TemplateRow {
  _id: string;
  title: string;
  text?: string;
  description?: string;
  templateType?: string;
  category?: string;
  isPublic?: boolean;
  featured?: boolean;
  updatedAt?: string;
  userId?: string | null;
}

const SECTION_ITEMS: WorkspaceSectionItem[] = [
  { id: "templates", label: "Templates", icon: <FiTag size={18} /> },
  { id: "categories", label: "Categories", icon: <FiGrid size={18} /> },
  { id: "featured", label: "Featured", icon: <FiStar size={18} /> },
  { id: "moderation", label: "Moderation", icon: <FiShield size={18} /> },
];

const DEFAULT_TEMPLATE_FORM = {
  title: "",
  description: "",
  text: "",
  category: "",
  templateType: "free",
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

function formatCategory(value?: string) {
  return value || "Uncategorized";
}

export default function AdminContentPage() {
  const { admin } = useAdminAuth();
  const sectionIds = useMemo(() => SECTION_ITEMS.map((item) => item.id), []);
  const { activeSection, setActiveSection } = useSectionQueryState(sectionIds, "templates");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [templateStats, setTemplateStats] = useState<any>(null);
  const [moderationSignals, setModerationSignals] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(DEFAULT_TEMPLATE_FORM);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [featuredOrder, setFeaturedOrder] = useState<string[]>([]);

  const loadContentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [templatesRes, statsRes, abuseRes] = await Promise.all([
        adminService.getTemplates({ page: 1, limit: 60 }),
        adminService.getTemplateStats().catch(() => null),
        adminService.getAbuseSignals().catch(() => ({ data: [] })),
      ]);

      const templateRows = templatesRes?.data || [];
      setTemplates(templateRows);
      setTemplateStats(statsRes?.data || statsRes || null);
      setModerationSignals(abuseRes?.data || []);
      setFeaturedOrder(
        templateRows
          .filter((item: TemplateRow) => Boolean(item.featured))
          .map((item: TemplateRow) => item._id)
      );
    } catch (loadError) {
      console.error("Failed to load content", loadError);
      setError("Failed to load templates and content controls.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContentData();
  }, []);

  const categories = useMemo(() => {
    const fromStats = Array.isArray(templateStats?.templatesByCategory)
      ? templateStats.templatesByCategory.map((item: any) => item._id || "Uncategorized")
      : [];
    const fromTemplates = templates.map((template) => formatCategory(template.category));
    return Array.from(new Set([...fromStats, ...fromTemplates])).filter(Boolean);
  }, [templateStats, templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        !search ||
        template.title?.toLowerCase().includes(search.toLowerCase()) ||
        template.description?.toLowerCase().includes(search.toLowerCase()) ||
        template.text?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || formatCategory(template.category) === categoryFilter;
      const visibility = template.isPublic ? "published" : "draft";
      const matchesStatus = !statusFilter || visibility === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [categoryFilter, search, statusFilter, templates]);

  const featuredTemplates = useMemo(() => {
    const featured = templates.filter((template) => Boolean(template.featured));
    if (featuredOrder.length === 0) return featured;
    const orderMap = new Map(featuredOrder.map((id, index) => [id, index]));
    return [...featured].sort(
      (a, b) => (orderMap.get(a._id) ?? 999) - (orderMap.get(b._id) ?? 999)
    );
  }, [featuredOrder, templates]);

  const togglePublish = async (template: TemplateRow) => {
    setSaving(true);
    setBanner(null);
    try {
      if (template.isPublic) {
        await adminService.unpublishTemplate(template._id);
      } else {
        await adminService.publishTemplate(template._id);
      }
      setTemplates((current) =>
        current.map((item) =>
          item._id === template._id ? { ...item, isPublic: !item.isPublic } : item
        )
      );
      setBanner({
        type: "success",
        message: `${template.title} ${template.isPublic ? "unpublished" : "published"}.`,
      });
    } catch (actionError: any) {
      console.error("Failed to update template visibility", actionError);
      setBanner({
        type: "error",
        message:
          actionError?.response?.data?.error ||
          actionError?.response?.data?.message ||
          "Failed to update template visibility.",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleFeatured = async (template: TemplateRow, featured: boolean) => {
    setSaving(true);
    setBanner(null);
    try {
      await adminService.featurePrompt(template._id, featured);
      setTemplates((current) =>
        current.map((item) =>
          item._id === template._id ? { ...item, featured } : item
        )
      );
      setFeaturedOrder((current) => {
        if (featured) return [...current, template._id];
        return current.filter((id) => id !== template._id);
      });
      setBanner({
        type: "success",
        message: featured ? `${template.title} marked as featured.` : `${template.title} removed from featured.`,
      });
    } catch (actionError: any) {
      console.error("Failed to update featured state", actionError);
      setBanner({
        type: "error",
        message:
          actionError?.response?.data?.error ||
          actionError?.response?.data?.message ||
          "Failed to update featured state.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!createForm.title || !createForm.text || !admin?.id) return;
    setSaving(true);
    setBanner(null);
    try {
      const response = await adminService.createTemplate({
        ...createForm,
        ownerId: admin.id,
      });
      const created = response?.data || response;
      setTemplates((current) => [created, ...current]);
      setCreateForm(DEFAULT_TEMPLATE_FORM);
      setShowCreateModal(false);
      setBanner({ type: "success", message: "Template created successfully." });
      loadContentData();
    } catch (actionError: any) {
      console.error("Failed to create template", actionError);
      setBanner({
        type: "error",
        message:
          actionError?.response?.data?.error ||
          actionError?.response?.data?.message ||
          "Failed to create template.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFeaturedReorder = (draggedId: string, targetId: string) => {
    setFeaturedOrder((current) => {
      const next = [...current];
      const fromIndex = next.indexOf(draggedId);
      const toIndex = next.indexOf(targetId);
      if (fromIndex === -1 || toIndex === -1) return current;
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, draggedId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="admin-page space-y-6">
        <PageHeader
          eyebrow="Operations"
          title="Content & Templates"
          description="Manage the public template library, categories, and moderation surface."
        />
        <div className="admin-workspace">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page space-y-6">
        <PageHeader
          eyebrow="Operations"
          title="Content & Templates"
          description="Manage the public template library, categories, and moderation surface."
        />
        <ErrorState message={error} onRetry={loadContentData} />
      </div>
    );
  }

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Content & Templates"
        description="Manage the public template library, categories, and moderation surface."
        metadata={
          <span className="admin-stat-pill">
            {templateStats?.totalTemplates || templates.length} total templates
          </span>
        }
        actions={
          <>
            <button type="button" className="admin-button admin-button-secondary" onClick={loadContentData}>
              <FiRefreshCw size={16} />
              Refresh
            </button>
            <button type="button" className="admin-button admin-button-primary" onClick={() => setShowCreateModal(true)}>
              <FiPlus size={16} />
              New template
            </button>
          </>
        }
      />

      {banner ? (
        <div
          className={`rounded-[1rem] border px-4 py-3 text-sm ${
            banner.type === "success"
              ? "border-[color:var(--admin-success)]/30 bg-[color:var(--admin-success-soft)] text-[color:var(--admin-success)]"
              : "border-[color:var(--admin-danger)]/30 bg-[color:var(--admin-danger-soft)] text-[color:var(--admin-danger)]"
          }`}
        >
          {banner.message}
        </div>
      ) : null}

      <SectionWorkspace
        sections={SECTION_ITEMS}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        sectionLabel="Content sections"
      >
        {activeSection === "templates" ? (
          <SectionCard
            title="Template library"
            description={`${templateStats?.totalTemplates || templates.length} templates managed through the admin workspace.`}
            actions={
              <button type="button" className="admin-button admin-button-primary" onClick={() => setShowCreateModal(true)}>
                <FiPlus size={16} />
                New template
              </button>
            }
          >
            <div className="space-y-5">
              <div className="admin-toolbar">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,0.8fr))_auto]">
                  <input
                    className="admin-input"
                    placeholder="Search templates, titles, descriptions"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <select
                    className="admin-select"
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                  >
                    <option value="">All categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <select
                    className="admin-select"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="">All modes</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                  <button type="button" className="admin-button admin-button-secondary" onClick={() => {
                    setSearch("");
                    setCategoryFilter("");
                    setStatusFilter("");
                  }}>
                    Search
                  </button>
                </div>
              </div>

              <div className="admin-template-grid">
                {filteredTemplates.map((template) => (
                  <article key={template._id} className="admin-template-card">
                    <div className="space-y-3">
                      <p className="admin-eyebrow">{formatCategory(template.category)}</p>
                      <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[color:var(--admin-text)]">
                        {template.title}
                      </h3>
                      <p className="text-sm leading-6 text-[color:var(--admin-text-soft)]">
                        {template.description || template.text?.slice(0, 120) || "No description available."}
                      </p>
                    </div>

                    <div className="text-sm text-[color:var(--admin-text-faint)]">
                      Updated {formatDate(template.updatedAt)}
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-2">
                      <StatusBadge
                        label={template.isPublic ? "Published" : "Draft"}
                        variant={template.isPublic ? "success" : "warning"}
                      />
                      <StatusBadge label={template.templateType || "free"} variant="info" />
                      {template.featured ? <StatusBadge label="Featured" variant="info" /> : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="admin-button admin-button-secondary min-h-[40px] px-3 py-2"
                        onClick={() => togglePublish(template)}
                        disabled={saving}
                      >
                        {template.isPublic ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        type="button"
                        className="admin-button admin-button-ghost min-h-[40px] px-3 py-2"
                        onClick={() => toggleFeatured(template, !template.featured)}
                        disabled={saving}
                      >
                        {template.featured ? "Remove featured" : "Feature"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {filteredTemplates.length === 0 ? (
                <PreviewNotice title="No templates match" message="Adjust the library filters or create a new template." />
              ) : null}
            </div>
          </SectionCard>
        ) : null}

        {activeSection === "categories" ? (
          <SectionCard
            title="Categories"
            description="Organize templates by use case."
            actions={
              <button type="button" className="admin-button admin-button-secondary opacity-60" disabled>
                <FiPlus size={16} />
                Add category
              </button>
            }
          >
            <div className="space-y-5">
              <PreviewNotice message="Category creation is not exposed by the current backend. The table below is derived directly from template analytics." />
              {Array.isArray(templateStats?.templatesByCategory) ? (
                <DataTable
                  rows={templateStats.templatesByCategory}
                  rowKey={(row) => row._id}
                  columns={[
                    {
                      key: "_id",
                      label: "Category",
                      emphasize: true,
                      render: (value) => formatCategory(value),
                    },
                    { key: "count", label: "Templates", align: "right" },
                    {
                      key: "_id",
                      label: "Status",
                      render: (value) => (
                        <StatusBadge
                          label={value ? "Active" : "Hidden"}
                          variant={value ? "success" : "warning"}
                        />
                      ),
                    },
                  ]}
                />
              ) : (
                <TableSkeleton rows={6} columns={3} />
              )}
            </div>
          </SectionCard>
        ) : null}

        {activeSection === "featured" ? (
          <SectionCard
            title="Featured templates"
            description="Templates pinned to the top of the public library homepage. Reorder is local-only in this pass."
          >
            <div className="space-y-5">
              <PreviewNotice message="Featured ordering is available for UI review here, but the current backend only persists the featured flag, not the manual order." />
              {featuredTemplates.length === 0 ? (
                <PreviewNotice title="No featured templates" message="Feature a template from the library to populate this list." />
              ) : (
                featuredTemplates.map((template, index) => (
                  <div
                    key={template._id}
                    className="admin-list-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("text/plain", template._id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      handleFeaturedReorder(event.dataTransfer.getData("text/plain"), template._id);
                    }}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-3">
                        <StatusBadge label={`Featured #${index + 1}`} variant="info" />
                        <span className="admin-eyebrow">{formatCategory(template.category)}</span>
                      </div>
                      <p className="text-2xl font-semibold tracking-[-0.04em] text-[color:var(--admin-text)]">
                        {template.title}
                      </p>
                      <p className="text-sm text-[color:var(--admin-text-soft)]">
                        Updated {formatDate(template.updatedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="admin-button admin-button-secondary"
                      onClick={() => toggleFeatured(template, false)}
                      disabled={saving}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        ) : null}

        {activeSection === "moderation" ? (
          <div className="space-y-6">
            <div className="admin-metric-grid">
              <MetricTile label="Reported prompts" value={moderationSignals.length} note="Current moderation-related signals returned by the backend." />
              <MetricTile label="Auto-flagged" value={moderationSignals.length} note="No dedicated moderation queue endpoint exists yet." />
              <MetricTile label="Resolved (30d)" value="Unknown" note="Resolution telemetry is not exposed yet." />
            </div>

            <SectionCard
              title="Content moderation"
              description="Review prompts reported by users or flagged by automated scanning."
            >
              {moderationSignals.length === 0 ? (
                <PreviewNotice message="No moderation queue is currently exposed by the admin API. This section will render real items as soon as those signals become available." />
              ) : (
                <DataTable
                  rows={moderationSignals}
                  rowKey={(row, index) => row._id || `signal-${index}`}
                  columns={[
                    {
                      key: "signal",
                      label: "Reason",
                      emphasize: true,
                      render: (value) => value || "Flagged signal",
                    },
                    {
                      key: "userId",
                      label: "Reported by",
                      render: (value) => value || "Auto-scan",
                    },
                    {
                      key: "createdAt",
                      label: "Time",
                      render: (value) => formatDate(value),
                    },
                    {
                      key: "signal",
                      label: "Status",
                      render: () => <StatusBadge label="Open" variant="warning" />,
                    },
                  ]}
                />
              )}
            </SectionCard>
          </div>
        ) : null}
      </SectionWorkspace>

      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="admin-panel w-full max-w-2xl p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[color:var(--admin-text)]">
                  Create template
                </h2>
                <p className="mt-2 text-sm text-[color:var(--admin-text-soft)]">
                  Minimal admin-backed template creation using the existing API fields.
                </p>
              </div>
              <button type="button" className="admin-button admin-button-ghost min-h-[40px] px-3 py-2" onClick={() => setShowCreateModal(false)}>
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div className="admin-field-grid">
                <div className="admin-field-stack">
                  <label className="admin-field-label" htmlFor="template-title">
                    Title
                  </label>
                  <input
                    id="template-title"
                    className="admin-input"
                    value={createForm.title}
                    onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))}
                  />
                </div>
                <div className="admin-field-stack">
                  <label className="admin-field-label" htmlFor="template-category">
                    Category
                  </label>
                  <input
                    id="template-category"
                    className="admin-input"
                    value={createForm.category}
                    onChange={(event) => setCreateForm((current) => ({ ...current, category: event.target.value }))}
                  />
                </div>
              </div>

              <div className="admin-field-stack">
                <label className="admin-field-label" htmlFor="template-description">
                  Description
                </label>
                <input
                  id="template-description"
                  className="admin-input"
                  value={createForm.description}
                  onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
                />
              </div>

              <div className="admin-field-stack">
                <label className="admin-field-label" htmlFor="template-text">
                  Template content
                </label>
                <textarea
                  id="template-text"
                  className="admin-textarea min-h-[180px]"
                  value={createForm.text}
                  onChange={(event) => setCreateForm((current) => ({ ...current, text: event.target.value }))}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="admin-button admin-button-primary"
                onClick={handleCreateTemplate}
                disabled={saving || !createForm.title || !createForm.text || !admin?.id}
              >
                {saving ? <FiRefreshCw className="animate-spin" size={16} /> : <FiCheckCircle size={16} />}
                Create template
              </button>
              <button type="button" className="admin-button admin-button-secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
