"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import PageHeader from "@/components/shared/PageHeader";
import SectionCard from "@/components/shared/SectionCard";
import DataTable from "@/components/shared/DataTable";
import ErrorState from "@/components/shared/ErrorState";
import StatusBadge from "@/components/shared/StatusBadge";
import { MetricTile } from "@/components/shared/AdminWidgets";
import { useAdminAuth } from "@/lib/auth/AdminAuthProvider";
import { hasPermission } from "@/lib/auth/rbac";
import {
  adminService,
  type CreditSettingsResponse,
  type CreditSettingsValues,
  type CreditUsageResponse,
  type CreditUsageUserRow,
} from "@/lib/services/adminService";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  lifetime_starter: "Lifetime Starter",
  lifetime: "Lifetime Pro",
  team_starter: "Team Starter",
  team_pro: "Team Pro",
  trial: "Trial (legacy)",
  enterprise: "Enterprise",
};
const ACTION_LABELS: Record<string, string> = {
  generate: "Generate a prompt",
  revise: "Revise a prompt",
  refine: "Refine (legacy flows)",
  run: "Run an outcome",
  agent: "Agent mode turn",
  agent_test: "Agent test run",
};
const TIER_LABELS: Record<string, string> = { standard: "Standard", advanced: "Advanced", top: "Top" };
const n = (value: number | null | undefined) => (value == null ? "—" : value.toLocaleString("en-US"));
const errorMessage = (err: any, fallback: string) => err?.response?.data?.error || err?.response?.data?.message || fallback;

type Tab = "usage" | "settings";

export default function AdminCreditsPage() {
  const [tab, setTab] = useState<Tab>("usage");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("admin:credits-tab");
      if (saved === "usage" || saved === "settings") setTab(saved);
    } catch {
      // storage unavailable
    }
  }, []);

  const choose = (next: Tab) => {
    setTab(next);
    try {
      window.localStorage.setItem("admin:credits-tab", next);
    } catch {
      // storage unavailable
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Operations"
        title="AI Credits"
        description="How credits are being used, and what each plan gets and each action costs. To change one user's credits, open them from Users."
      />
      <div role="tablist" aria-label="AI credits" className="flex gap-2">
        {(["usage", "settings"] as const).map((id) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            aria-controls={`credits-${id}`}
            id={`credits-tab-${id}`}
            onClick={() => choose(id)}
            className={`admin-button ${tab === id ? "admin-button-primary" : "admin-button-secondary"}`}
          >
            {id === "usage" ? "Usage" : "Allowances & costs"}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`credits-${tab}`} aria-labelledby={`credits-tab-${tab}`}>
        {tab === "usage" ? <UsageTab /> : <SettingsTab />}
      </div>
    </div>
  );
}

// ── Usage ──────────────────────────────────────────────────────────────────────────────────────

function UsageTab() {
  const [months, setMonths] = useState(6);
  const [data, setData] = useState<CreditUsageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getCreditUsage(months);
      setData(res.data);
    } catch (err) {
      setError(errorMessage(err, "Couldn't load credit usage."));
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (loading && !data) return <p className="text-sm text-[color:var(--admin-text-soft)]">Loading usage…</p>;
  if (!data) return null;

  const { totals, byPlan, topSpenders, outOfCredits, outOfCreditsCount } = data.current;
  const chartData = data.months.map((m) => ({ month: m.month, Monthly: m.used, Purchased: m.purchasedUsed }));
  const actionTotals = data.months.reduce<Record<string, number>>((acc, m) => {
    for (const [k, v] of Object.entries(m.breakdown)) acc[k] = (acc[k] || 0) + v;
    return acc;
  }, {});

  const userColumns = (extra: "spent" | "out") => [
    {
      key: "email",
      label: "User",
      render: (_: unknown, row: CreditUsageUserRow) => (
        <Link href={`/users/${row.userId}`} className="font-medium text-[color:var(--admin-accent-strong)] hover:underline">
          {row.email || row.name || row.userId}
        </Link>
      ),
    },
    { key: "plan", label: "Plan", render: (v: unknown) => PLAN_LABELS[String(v)] || String(v) },
    extra === "spent"
      ? { key: "spent", label: "Spent this month", align: "right" as const, render: (v: unknown) => n(Number(v)) }
      : { key: "used", label: "Used / limit", align: "right" as const, render: (_: unknown, row: CreditUsageUserRow) => `${n(row.used)} / ${n((row.allowance || 0) + (row.bonus || 0))}` },
    { key: "periodEnd", label: "Resets", render: (v: unknown) => (v ? new Date(String(v)).toLocaleDateString() : "—") },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile label="Users with credits this month" value={n(totals.users)} />
        <MetricTile label="Monthly credits spent" value={n(totals.used)} />
        <MetricTile label="Purchased credits spent" value={n(totals.purchasedUsed)} />
        <MetricTile label="Out of credits now" value={n(outOfCreditsCount)} note={totals.bonus ? `${n(totals.bonus)} credits adjusted by admins this month` : undefined} />
      </div>

      <SectionCard
        title="Credits spent per month"
        description="Grouped by the month each user's billing period started."
        actions={
          <select aria-label="Months to show" className="admin-select" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
            {[3, 6, 12].map((m) => <option key={m} value={m}>Last {m} months</option>)}
          </select>
        }
      >
        {chartData.length ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "var(--admin-text-soft)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--admin-text-soft)", fontSize: 12 }} />
                <Tooltip formatter={(v: number) => v.toLocaleString("en-US")} />
                <Legend />
                <Bar dataKey="Monthly" stackId="a" fill="#A84C34" />
                <Bar dataKey="Purchased" stackId="a" fill="#d97706" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-[color:var(--admin-text-soft)]">No credit usage in this range.</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {Object.entries(actionTotals).map(([action, value]) => (
            <span key={action} className="rounded-full border border-[color:var(--admin-border)] px-3 py-1 text-[color:var(--admin-text)]">
              {ACTION_LABELS[action] || action}: <strong>{n(value)}</strong>
            </span>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Top spenders this month">
          <DataTable<CreditUsageUserRow> rows={topSpenders} rowKey={(r) => r.userId} columns={userColumns("spent")} emptyMessage="No credits spent yet this month." />
        </SectionCard>
        <SectionCard title="Out of credits" description="Monthly credits used up and no purchased or granted credits left.">
          <DataTable<CreditUsageUserRow> rows={outOfCredits} rowKey={(r) => r.userId} columns={userColumns("out")} emptyMessage="Nobody is out of credits." />
          {outOfCreditsCount > outOfCredits.length ? (
            <p className="mt-2 text-xs text-[color:var(--admin-text-soft)]">Showing {outOfCredits.length} of {n(outOfCreditsCount)}.</p>
          ) : null}
        </SectionCard>
      </div>

      <SectionCard title="By plan this month">
        <DataTable
          rows={byPlan}
          rowKey={(r) => r.plan}
          columns={[
            { key: "plan", label: "Plan", render: (v) => PLAN_LABELS[String(v)] || String(v) },
            { key: "users", label: "Users", align: "right", render: (v) => n(Number(v)) },
            { key: "used", label: "Monthly credits spent", align: "right", render: (v) => n(Number(v)) },
          ]}
        />
      </SectionCard>
    </div>
  );
}

// ── Settings ───────────────────────────────────────────────────────────────────────────────────

type Draft = {
  monthlyCredits: Record<string, string>; // "" = unlimited
  baseCost: Record<string, string>;
  agentCost: Record<string, string>;
  tierMultiplier: Record<string, string>;
  bestMultiplier: string;
  modelCreditTier: Record<string, string>;
};

const toDraft = (v: CreditSettingsValues): Draft => ({
  monthlyCredits: Object.fromEntries(Object.entries(v.monthlyCredits).map(([k, x]) => [k, x == null ? "" : String(x)])),
  baseCost: Object.fromEntries(Object.entries(v.baseCost).map(([k, x]) => [k, String(x)])),
  agentCost: Object.fromEntries(Object.entries(v.agentCost).map(([k, x]) => [k, String(x)])),
  tierMultiplier: Object.fromEntries(Object.entries(v.tierMultiplier).map(([k, x]) => [k, String(x)])),
  bestMultiplier: String(v.bestMultiplier),
  modelCreditTier: { ...v.modelCreditTier },
});

/** Only the fields that differ from what's live, parsed to numbers. */
function diff(draft: Draft, current: CreditSettingsValues): { changes: Partial<CreditSettingsValues>; errors: string[] } {
  const changes: Record<string, any> = {};
  const errors: string[] = [];
  const intMap = (field: "monthlyCredits" | "baseCost" | "agentCost", allowUnlimited: boolean, labels: Record<string, string>) => {
    for (const [key, raw] of Object.entries(draft[field])) {
      const value = raw.trim() === "" && allowUnlimited && key !== "free" ? null : Number(raw);
      if (value !== null && (!Number.isInteger(value) || value < 0)) {
        errors.push(`${labels[key] || key}: enter a whole number of 0 or more${allowUnlimited && key !== "free" ? ", or leave empty for unlimited" : ""}.`);
        continue;
      }
      if (value !== (current[field] as Record<string, number | null>)[key]) (changes[field] ||= {})[key] = value;
    }
  };
  intMap("monthlyCredits", true, PLAN_LABELS);
  intMap("baseCost", false, ACTION_LABELS);
  intMap("agentCost", false, ACTION_LABELS);
  for (const [key, raw] of Object.entries(draft.tierMultiplier)) {
    const value = Number(raw);
    if (!(value > 0) || value > 100) { errors.push(`${TIER_LABELS[key] || key} multiplier: enter a number above 0 and up to 100.`); continue; }
    if (value !== current.tierMultiplier[key]) (changes.tierMultiplier ||= {})[key] = value;
  }
  const best = Number(draft.bestMultiplier);
  if (!(best >= 1) || best > 100) errors.push('"Make it best" multiplier: enter a number from 1 to 100.');
  else if (best !== current.bestMultiplier) changes.bestMultiplier = best;
  for (const [key, tier] of Object.entries(draft.modelCreditTier)) {
    if (tier !== current.modelCreditTier[key]) (changes.modelCreditTier ||= {})[key] = tier;
  }
  return { changes, errors };
}

function SettingsTab() {
  const { admin } = useAdminAuth();
  const canEdit = Boolean(admin && hasPermission(admin.role, "billing:write", admin.permissions));
  const [data, setData] = useState<CreditSettingsResponse | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const apply = (res: CreditSettingsResponse) => {
    setData(res);
    setDraft(toDraft(res.current));
  };

  const load = useCallback(async () => {
    setError(null);
    try {
      apply((await adminService.getCreditSettings()).data);
    } catch (err) {
      setError(errorMessage(err, "Couldn't load credit settings."));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const { changes, errors } = useMemo(() => (data && draft ? diff(draft, data.current) : { changes: {}, errors: [] }), [data, draft]);
  const changeCount = Object.values(changes).reduce<number>((sum, v) => sum + (typeof v === "object" && v ? Object.keys(v).length : 1), 0);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data || !draft) return <p className="text-sm text-[color:var(--admin-text-soft)]">Loading settings…</p>;

  const set = (field: keyof Draft, key: string | null, value: string) =>
    setDraft((d) => (d ? (key === null ? { ...d, [field]: value } : { ...d, [field]: { ...(d[field] as Record<string, string>), [key]: value } }) : d));

  const save = async () => {
    if (errors.length || !changeCount) return;
    setSaving(true);
    setSaveError(null);
    setNotice(null);
    try {
      apply((await adminService.updateCreditSettings(changes)).data);
      setNotice("Saved. New values apply to every user's next request (within a minute on all servers).");
    } catch (err) {
      setSaveError(errorMessage(err, "Couldn't save settings."));
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setSaving(true);
    setSaveError(null);
    setNotice(null);
    try {
      apply((await adminService.resetCreditSettings()).data);
      setNotice("All values are back to the defaults.");
      setConfirmReset(false);
    } catch (err) {
      setSaveError(errorMessage(err, "Couldn't reset settings."));
    } finally {
      setSaving(false);
    }
  };

  const isOverridden = (field: keyof CreditSettingsValues, key?: string) => {
    const o = data.overrides[field] as any;
    return key ? o && Object.prototype.hasOwnProperty.call(o, key) : o !== undefined && o !== null;
  };
  const defaultHint = (value: number | string | null | undefined) => `Default: ${value == null ? "unlimited" : typeof value === "number" ? value.toLocaleString("en-US") : value}`;

  const numberField = (field: "monthlyCredits" | "baseCost" | "agentCost" | "tierMultiplier", key: string, label: string, opts: { unlimited?: boolean; step?: string } = {}) => {
    const id = `${field}-${key}`;
    const def = (data.defaults[field] as Record<string, number | null>)[key];
    return (
      <div key={id} className="space-y-1">
        <label htmlFor={id} className="admin-field-label flex items-center gap-2">
          {label}
          {isOverridden(field, key) ? <StatusBadge label="Changed" variant="info" size="sm" /> : null}
        </label>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={opts.step || "1"}
          disabled={!canEdit || saving}
          value={draft[field][key] ?? ""}
          placeholder={opts.unlimited ? "Unlimited" : undefined}
          onChange={(e) => set(field, key, e.target.value)}
          className="admin-input w-full"
        />
        <p className="admin-field-hint">{defaultHint(def)}{opts.unlimited ? " · leave empty for unlimited" : ""}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {!canEdit ? (
        <p className="rounded-lg border border-[color:var(--admin-border)] px-4 py-3 text-sm text-[color:var(--admin-text-soft)]">
          Only super admins can change these values. You can view them.
        </p>
      ) : null}
      {data.updatedAt ? (
        <p className="text-xs text-[color:var(--admin-text-soft)]">
          Last changed {new Date(data.updatedAt).toLocaleString()}
          {data.updatedBy ? ` by ${data.updatedBy.email || data.updatedBy.username}` : ""}.
        </p>
      ) : null}

      <SectionCard title="Monthly credits per plan" description="Credits each plan gets every billing month. They reset and don't roll over. Free can't be unlimited.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.keys(data.defaults.monthlyCredits).map((plan) => numberField("monthlyCredits", plan, PLAN_LABELS[plan] || plan, { unlimited: plan !== "free" }))}
        </div>
      </SectionCard>

      <SectionCard title="What actions cost" description="Base cost on a standard model. Generate and revise are multiplied by the model's tier and by &quot;Make it best&quot;; the others are flat.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.keys(data.defaults.baseCost).map((action) => numberField("baseCost", action, ACTION_LABELS[action] || action))}
          {Object.keys(data.defaults.agentCost).map((action) => numberField("agentCost", action, ACTION_LABELS[action] || action))}
        </div>
      </SectionCard>

      <SectionCard title="Model pricing" description="Each model belongs to a tier; the tier multiplies generate and revise costs.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.keys(data.defaults.tierMultiplier).map((tier) => numberField("tierMultiplier", tier, `${TIER_LABELS[tier] || tier} tier ×`, { step: "0.5" }))}
          <div className="space-y-1">
            <label htmlFor="bestMultiplier" className="admin-field-label flex items-center gap-2">
              &ldquo;Make it best&rdquo; ×
              {isOverridden("bestMultiplier") ? <StatusBadge label="Changed" variant="info" size="sm" /> : null}
            </label>
            <input id="bestMultiplier" type="number" min={1} step="0.5" disabled={!canEdit || saving} value={draft.bestMultiplier} onChange={(e) => set("bestMultiplier", null, e.target.value)} className="admin-input w-full" />
            <p className="admin-field-hint">{defaultHint(data.defaults.bestMultiplier)}</p>
          </div>
        </div>
        <div className="mt-5">
          <DataTable
            rows={data.models}
            rowKey={(r) => r.id}
            columns={[
              { key: "name", label: "Model", render: (v, row) => <span>{String(v)} <span className="text-xs text-[color:var(--admin-text-soft)]">{row.id}</span></span> },
              {
                key: "id",
                label: "Tier",
                render: (id) => (
                  <select
                    aria-label={`Tier for ${id}`}
                    className="admin-select"
                    disabled={!canEdit || saving}
                    value={draft.modelCreditTier[String(id)]}
                    onChange={(e) => set("modelCreditTier", String(id), e.target.value)}
                  >
                    {Object.keys(data.defaults.tierMultiplier).map((tier) => <option key={tier} value={tier}>{TIER_LABELS[tier] || tier}</option>)}
                  </select>
                ),
              },
              { key: "credits", label: "Generate / revise / best (live)", align: "right", render: (c) => `${c.generate} / ${c.revise} / ${c.best}` },
            ]}
          />
        </div>
      </SectionCard>

      {errors.length ? (
        <ul role="alert" className="space-y-1 rounded-lg bg-[color:var(--admin-danger-soft)] px-4 py-3 text-sm text-[color:var(--admin-danger)]">
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      ) : null}
      {saveError ? <p role="alert" className="rounded-lg bg-[color:var(--admin-danger-soft)] px-4 py-3 text-sm text-[color:var(--admin-danger)]">{saveError}</p> : null}
      {notice ? <p role="status" className="rounded-lg bg-[color:var(--admin-success-soft)] px-4 py-3 text-sm text-[color:var(--admin-success)]">{notice}</p> : null}

      {canEdit ? (
        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-3 border-t border-[color:var(--admin-border)] bg-[color:var(--admin-bg,transparent)] py-4">
          {confirmReset ? (
            <>
              <span className="text-sm text-[color:var(--admin-text)]">Reset every value to the default?</span>
              <button type="button" className="admin-button admin-button-secondary" disabled={saving} onClick={() => setConfirmReset(false)}>Keep my values</button>
              <button type="button" className="admin-button admin-button-primary" disabled={saving} onClick={() => void reset()}>{saving ? "Resetting…" : "Reset to defaults"}</button>
            </>
          ) : (
            <>
              <button type="button" className="admin-button admin-button-ghost" disabled={saving} onClick={() => setConfirmReset(true)}>Reset to defaults</button>
              <button type="button" className="admin-button admin-button-secondary" disabled={saving || !changeCount} onClick={() => setDraft(toDraft(data.current))}>Discard changes</button>
              <button type="button" className="admin-button admin-button-primary" disabled={saving || !changeCount || errors.length > 0} onClick={() => void save()}>
                {saving ? "Saving…" : changeCount ? `Save ${changeCount} change${changeCount === 1 ? "" : "s"}` : "No changes"}
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
