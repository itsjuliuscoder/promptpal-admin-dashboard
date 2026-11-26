"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiCheckCircle, FiExternalLink, FiRefreshCw, FiXCircle } from "react-icons/fi";
import PageHeader from "@/components/shared/PageHeader";
import SectionCard from "@/components/shared/SectionCard";
import ErrorState from "@/components/shared/ErrorState";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import Pagination from "@/components/shared/Pagination";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { MetricTile } from "@/components/shared/AdminWidgets";
import {
  adminService,
  type SeoPageContent,
  type SeoPageList,
  type SeoPageRow,
  type SeoPageStatusFilter,
} from "@/lib/services/adminService";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.promptpal.app";
const MAX_APPROVE = 50;
const PAGE_SIZE = 50;

const STATUS_OPTIONS: Array<{ value: SeoPageStatusFilter; label: string }> = [
  { value: "in_review", label: "Waiting for review" },
  { value: "passed", label: "Passed quality gate" },
  { value: "failed", label: "Failed quality gate" },
  { value: "approved", label: "Live" },
  { value: "needs_review", label: "Refresh flagged" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

function errorMessage(error: unknown): string {
  const data = (error as { response?: { data?: { error?: string } } })?.response?.data;
  return data?.error || (error instanceof Error ? error.message : "Request failed");
}

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function rowStatus(row: SeoPageRow): { label: string; variant: "error" | "info" | "success" | "warning" } {
  if (row.status === "approved") return row.seoPage?.refresh?.needsReview ? { label: "Live, refresh flagged", variant: "warning" } : { label: "Live", variant: "info" };
  if (row.status === "archived") return { label: "Rejected", variant: "warning" };
  return row.seoPage?.quality?.passed ? { label: "Passed", variant: "success" } : { label: "Failed", variant: "error" };
}

function SeoPagesScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const batch = params.get("batch") || "";
  const status = (params.get("status") as SeoPageStatusFilter) || "in_review";
  const [page, setPage] = useState(1);
  const [data, setData] = useState<SeoPageList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const setFilter = (next: { batch?: string; status?: string }) => {
    const query = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) query.set(key, value);
      else query.delete(key);
    }
    setPage(1);
    router.replace(`/seo-pages?${query.toString()}`);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminService.listSeoPages({ batch: batch || undefined, status, page, limit: PAGE_SIZE }));
      setSelected(new Set());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [batch, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => data?.pages ?? [], [data]);
  const approvable = rows.filter((r) => r.status === "in_review" && r.seoPage?.quality?.passed);
  const allApprovableSelected = approvable.length > 0 && approvable.every((r) => selected.has(r._id));

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const approveSelected = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    if (!window.confirm(`Publish ${ids.length} page(s)? They go live on www.promptpal.app and into the sitemap.`)) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await adminService.approveSeoPages(ids);
      setNotice(`Published ${result.approved.length} page(s).`);
      await load();
    } catch (err) {
      setNotice(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const passed = rows.filter((r) => r.seoPage?.quality?.passed).length;
  const spend = rows.reduce((sum, r) => sum + (r.seoPage?.costUsd || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content"
        title="SEO Pages"
        description="Tested prompt pages from the generation pipeline. Every page starts as a hidden draft. Only pages that passed the quality gate can be published, up to 50 at a time."
        actions={
          <button type="button" className="admin-button admin-button-secondary" onClick={load} disabled={loading}>
            <FiRefreshCw size={16} /> Refresh
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile label="Pages in view" value={data?.total ?? "-"} />
        <MetricTile label="Passed on this page" value={`${passed} / ${rows.length}`} />
        <MetricTile label="Generation spend on this page" value={`$${spend.toFixed(2)}`} />
      </div>

      <SectionCard
        title="Review queue"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <select className="admin-select" value={batch} onChange={(e) => setFilter({ batch: e.target.value })} aria-label="Batch">
              <option value="">All batches</option>
              {(data?.batches ?? []).map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select className="admin-select" value={status} onChange={(e) => setFilter({ status: e.target.value })} aria-label="Status">
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              type="button"
              className="admin-button admin-button-primary"
              disabled={busy || selected.size === 0 || selected.size > MAX_APPROVE}
              onClick={approveSelected}
            >
              <FiCheckCircle size={16} /> Publish selected ({selected.size})
            </button>
          </div>
        }
      >
        {notice ? <p className="mb-4 text-sm text-[color:var(--admin-text-muted)]" role="status">{notice}</p> : null}
        {error ? (
          <ErrorState message={error} />
        ) : loading ? (
          <TableSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState message="No pages match these filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-[color:var(--admin-border)] text-[color:var(--admin-text-muted)]">
                  <th className="w-10 py-3 pr-2">
                    <input
                      type="checkbox"
                      aria-label="Select all passed pages"
                      checked={allApprovableSelected}
                      disabled={!approvable.length}
                      onChange={() => setSelected(allApprovableSelected ? new Set() : new Set(approvable.slice(0, MAX_APPROVE).map((r) => r._id)))}
                    />
                  </th>
                  <th className="py-3 pr-4">Page</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Quality</th>
                  <th className="py-3 pr-4">Batch</th>
                  <th className="py-3 pr-4">Tested</th>
                  <th className="py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const s = rowStatus(row);
                  const canApprove = row.status === "in_review" && row.seoPage?.quality?.passed;
                  return (
                    <tr key={row._id} className="border-b border-[color:var(--admin-border)] align-top">
                      <td className="py-3 pr-2">
                        <input type="checkbox" aria-label={`Select ${row.title}`} disabled={!canApprove} checked={selected.has(row._id)} onChange={() => toggle(row._id)} />
                      </td>
                      <td className="py-3 pr-4">
                        <button type="button" className="text-left font-semibold text-[color:var(--admin-text)] hover:underline" onClick={() => setOpenId(row._id)}>
                          {row.title}
                        </button>
                        <p className="text-xs text-[color:var(--admin-text-muted)]">/prompts/{row.slug} · {row.seoPage?.role} · {row.category}</p>
                      </td>
                      <td className="py-3 pr-4"><StatusBadge label={s.label} variant={s.variant} size="sm" /></td>
                      <td className="py-3 pr-4 text-xs text-[color:var(--admin-text-muted)]">
                        {row.seoPage?.quality?.passed ? `${row.seoPage.quality.wordCount ?? 0} words` : (row.seoPage?.quality?.reasons ?? []).join("; ")}
                        {row.seoPage?.refresh?.needsReview ? <span className="block">Refresh: {(row.seoPage.refresh.reasons ?? []).join("; ")}</span> : null}
                      </td>
                      <td className="py-3 pr-4 text-xs">{row.seoPage?.source?.batchId}</td>
                      <td className="py-3 pr-4 text-xs">{formatDate(row.seoPage?.lastTestedAt)}</td>
                      <td className="py-3 text-right">
                        {row.status === "approved" ? (
                          <a className="inline-flex items-center gap-1 text-xs" href={`${SITE_URL}/prompts/${row.slug}`} target="_blank" rel="noreferrer">
                            View <FiExternalLink size={12} />
                          </a>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {data && data.total > PAGE_SIZE ? (
          <div className="mt-4">
            <Pagination currentPage={page} totalPages={Math.ceil(data.total / PAGE_SIZE)} totalItems={data.total} itemsPerPage={PAGE_SIZE} onPageChange={setPage} />
          </div>
        ) : null}
      </SectionCard>

      {openId ? <SeoPageDetail id={openId} onClose={() => setOpenId(null)} onChanged={load} /> : null}
    </div>
  );
}

function Field({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--admin-text-muted)]">{label}</span>
      {rows === 1 ? (
        <input className="admin-input w-full" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <textarea className="admin-input w-full" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

function SeoPageDetail({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const [page, setPage] = useState<SeoPageRow | null>(null);
  const [draft, setDraft] = useState<{ title: string; seoTitle: string; metaDescription: string; text: string; seo: SeoPageContent } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminService
      .getSeoPage(id)
      .then((p) => {
        if (cancelled) return;
        setPage(p);
        setDraft({ title: p.title, seoTitle: p.seoTitle || "", metaDescription: p.metaDescription || "", text: p.text || "", seo: { ...p.seoPage } });
      })
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await adminService.updateSeoPage(id, {
        title: draft.title,
        seoTitle: draft.seoTitle,
        metaDescription: draft.metaDescription,
        text: draft.text,
        seoPage: {
          whatItDoes: draft.seo.whatItDoes,
          whenToUse: draft.seo.whenToUse,
          outputNotes: draft.seo.outputNotes,
          faqs: draft.seo.faqs,
          commonMistakes: draft.seo.commonMistakes,
          variations: draft.seo.variations,
        },
      });
      setPage(updated);
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const reject = async () => {
    const reason = window.prompt("Why reject this page? (kept with the page)");
    if (reason === null) return;
    try {
      await adminService.rejectSeoPage(id, reason);
      onChanged();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const setSeo = (patch: Partial<SeoPageContent>) => setDraft((d) => (d ? { ...d, seo: { ...d.seo, ...patch } } : d));
  const quality = page?.seoPage?.quality;

  return (
    <SectionCard
      title={page?.title || "Loading page"}
      description={page ? `/prompts/${page.slug} · ${page.seoPage?.role} · written for ${page.seoPage?.targetModel}` : undefined}
      actions={
        <div className="flex flex-wrap gap-2">
          <button type="button" className="admin-button admin-button-secondary" onClick={onClose}>Close</button>
          <button type="button" className="admin-button admin-button-secondary" onClick={reject} disabled={!page}>
            <FiXCircle size={16} /> Reject
          </button>
          <button type="button" className="admin-button admin-button-primary" onClick={save} disabled={!draft || saving}>
            {saving ? "Saving..." : "Save and re-check"}
          </button>
        </div>
      }
    >
      {error ? <ErrorState message={error} /> : null}
      {!draft || !page ? (
        <TableSkeleton />
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[color:var(--admin-border)] p-4 text-sm">
            <p className="font-semibold">Quality gate: {quality?.passed ? "passed" : "failed"}</p>
            {quality?.reasons?.length ? (
              <ul className="mt-2 list-disc pl-5 text-[color:var(--admin-text-muted)]">
                {quality.reasons.map((r) => <li key={r}>{r}</li>)}
              </ul>
            ) : null}
            <p className="mt-2 text-[color:var(--admin-text-muted)]">
              {quality?.wordCount ?? 0} words of page copy · closest existing page overlap {Math.round((quality?.maxOverlap ?? 0) * 100)}% · cost ${(page.seoPage?.costUsd ?? 0).toFixed(3)}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Title (H1)" rows={1} value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
            <Field label="SEO title" rows={1} value={draft.seoTitle} onChange={(v) => setDraft({ ...draft, seoTitle: v })} />
          </div>
          <Field label={`Meta description (${draft.metaDescription.length} characters)`} rows={2} value={draft.metaDescription} onChange={(v) => setDraft({ ...draft, metaDescription: v })} />
          <Field label="Prompt" rows={8} value={draft.text} onChange={(v) => setDraft({ ...draft, text: v })} />
          <Field label="What this prompt does" rows={5} value={draft.seo.whatItDoes || ""} onChange={(v) => setSeo({ whatItDoes: v })} />
          <Field label="When to use it" rows={4} value={draft.seo.whenToUse || ""} onChange={(v) => setSeo({ whenToUse: v })} />
          <Field label="How the outputs differed" rows={4} value={draft.seo.outputNotes || ""} onChange={(v) => setSeo({ outputNotes: v })} />

          <div className="space-y-3">
            <h3 className="font-semibold">Model outputs (as returned by each API, read only)</h3>
            {(page.seoPage?.modelOutputs ?? []).map((o) => (
              <details key={o.provider} className="rounded-2xl border border-[color:var(--admin-border)] p-3">
                <summary className="cursor-pointer text-sm font-semibold">
                  {o.label} ({o.model}){o.output ? "" : " · missing"} · {o.tokens ?? 0} tokens · ${(o.costUsd ?? 0).toFixed(4)}
                </summary>
                <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-xs">{o.output || "No output"}</pre>
              </details>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Variations</h3>
            {(draft.seo.variations ?? []).map((v, i) => (
              <div key={i} className="space-y-2 rounded-2xl border border-[color:var(--admin-border)] p-3">
                <Field label="Title" rows={1} value={v.title} onChange={(value) => setSeo({ variations: draft.seo.variations!.map((x, j) => (j === i ? { ...x, title: value } : x)) })} />
                <Field label="Prompt" rows={4} value={v.prompt} onChange={(value) => setSeo({ variations: draft.seo.variations!.map((x, j) => (j === i ? { ...x, prompt: value } : x)) })} />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Common mistakes</h3>
            {(draft.seo.commonMistakes ?? []).map((m, i) => (
              <div key={i} className="grid gap-2 lg:grid-cols-2">
                <Field label="Mistake" rows={2} value={m.mistake} onChange={(value) => setSeo({ commonMistakes: draft.seo.commonMistakes!.map((x, j) => (j === i ? { ...x, mistake: value } : x)) })} />
                <Field label="Fix" rows={2} value={m.fix} onChange={(value) => setSeo({ commonMistakes: draft.seo.commonMistakes!.map((x, j) => (j === i ? { ...x, fix: value } : x)) })} />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">FAQs</h3>
            {(draft.seo.faqs ?? []).map((f, i) => (
              <div key={i} className="space-y-2 rounded-2xl border border-[color:var(--admin-border)] p-3">
                <Field label="Question" rows={1} value={f.question} onChange={(value) => setSeo({ faqs: draft.seo.faqs!.map((x, j) => (j === i ? { ...x, question: value } : x)) })} />
                <Field label="Answer" rows={3} value={f.answer} onChange={(value) => setSeo({ faqs: draft.seo.faqs!.map((x, j) => (j === i ? { ...x, answer: value } : x)) })} />
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

export default function SeoPagesPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <SeoPagesScreen />
    </Suspense>
  );
}
