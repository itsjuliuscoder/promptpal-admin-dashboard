"use client";

import React, { useCallback, useEffect, useState } from "react";
import SectionCard from "@/components/shared/SectionCard";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { MetricTile } from "@/components/shared/AdminWidgets";
import { useAdminAuth } from "@/lib/auth/AdminAuthProvider";
import { hasPermission } from "@/lib/auth/rbac";
import {
  adminService,
  type AdminUserCredits,
  type CreditAdjustment,
  type CreditBucket,
} from "@/lib/services/adminService";

const fmt = (value: number | null | undefined) => (value == null ? "Unlimited" : value.toLocaleString("en-US"));
const shortDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const errorMessage = (err: any, fallback: string) => err?.response?.data?.error || err?.response?.data?.message || fallback;

const BUCKET_LABEL: Record<CreditBucket, string> = { wallet: "Never expires", monthly: "This month only" };

/** A user's AI credits with an "Adjust credits" action. Loads its own data. */
export default function UserCreditsCard({ userId, disabled = false }: { userId: string; disabled?: boolean }) {
  const { admin } = useAdminAuth();
  const canAdjust = Boolean(admin && hasPermission(admin.role, "users:write", admin.permissions));
  const [data, setData] = useState<AdminUserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await adminService.getUserCredits(userId);
      setData(res.data);
    } catch (err) {
      setError(errorMessage(err, "Couldn't load credits."));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const balance = data?.balance;
  const breakdown = balance?.breakdown || {};

  return (
    <SectionCard
      title="AI Credits"
      description="This billing month's credits plus purchased and granted credits that never expire."
      actions={
        canAdjust ? (
          <button type="button" className="admin-button admin-button-primary" disabled={disabled || loading || !balance} onClick={() => { setNotice(null); setOpen(true); }}>
            Adjust credits
          </button>
        ) : null
      }
    >
      {loading ? (
        <p className="text-sm text-[color:var(--admin-text-soft)]">Loading credits…</p>
      ) : error ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-[color:var(--admin-danger)]">{error}</span>
          <button type="button" className="admin-button admin-button-secondary" onClick={() => { setLoading(true); void load(); }}>Retry</button>
        </div>
      ) : balance ? (
        <div className="space-y-5">
          {notice ? (
            <p role="status" className="rounded-lg bg-[color:var(--admin-success-soft)] px-3 py-2 text-sm text-[color:var(--admin-success)]">{notice}</p>
          ) : null}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricTile
              label="Monthly left"
              value={balance.unlimited ? "Unlimited" : `${fmt(balance.remaining)} / ${fmt(balance.allowance)}`}
              note={`${balance.used.toLocaleString("en-US")} used${balance.reserved ? ` · ${balance.reserved} held` : ""}`}
            />
            <MetricTile
              label="Plan allowance"
              value={fmt(balance.planAllowance)}
              note={
                balance.bonus ? (
                  <span>{balance.bonus > 0 ? "+" : ""}{balance.bonus.toLocaleString("en-US")} adjustment this month</span>
                ) : (
                  <span className="capitalize">{balance.plan.replace(/_/g, " ")} plan</span>
                )
              }
            />
            <MetricTile label="Never-expiring" value={fmt(balance.purchased)} note={`${(balance.purchasedUsed || 0).toLocaleString("en-US")} spent this month`} />
            <MetricTile label="Resets on" value={shortDate(balance.resetsAt)} note={`Period started ${shortDate(balance.periodStart)}`} />
          </div>

          <div>
            <p className="admin-field-label mb-2">Spent this month by action</p>
            <div className="flex flex-wrap gap-2 text-sm">
              {Object.entries(breakdown).map(([action, value]) => (
                <span key={action} className="rounded-full border border-[color:var(--admin-border)] px-3 py-1 text-[color:var(--admin-text)]">
                  {action.replace(/_/g, " ")}: <strong>{Number(value || 0).toLocaleString("en-US")}</strong>
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="admin-field-label mb-2">Adjustment history</p>
            <DataTable<CreditAdjustment>
              rows={data?.adjustments || []}
              emptyMessage="No adjustments yet."
              rowKey={(row, i) => row._id || String(i)}
              columns={[
                { key: "createdAt", label: "When", render: (v) => (v ? new Date(String(v)).toLocaleString() : "—") },
                {
                  key: "applied",
                  label: "Change",
                  align: "right",
                  render: (v, row) => (
                    <span className={Number(v) >= 0 ? "text-[color:var(--admin-success)]" : "text-[color:var(--admin-danger)]"}>
                      {Number(v) > 0 ? "+" : ""}{Number(v).toLocaleString("en-US")}
                      {row.applied !== row.amount ? <span className="ml-1 text-xs text-[color:var(--admin-text-soft)]">(asked {row.amount})</span> : null}
                    </span>
                  ),
                },
                { key: "bucket", label: "Type", render: (v) => <StatusBadge label={BUCKET_LABEL[v as CreditBucket] || String(v)} variant={v === "wallet" ? "info" : "warning"} size="sm" /> },
                { key: "reason", label: "Reason", truncate: true },
                { key: "adminEmail", label: "By", render: (v) => (v ? String(v) : "—") },
              ]}
            />
          </div>
        </div>
      ) : null}

      {open && balance ? (
        <AdjustCreditsDialog
          userId={userId}
          unlimitedMonthly={balance.unlimited}
          monthlyLeft={balance.remaining ?? 0}
          walletLeft={balance.purchased || 0}
          onClose={() => setOpen(false)}
          onDone={(adjustment) => {
            setOpen(false);
            setNotice(`${adjustment.applied > 0 ? "Added" : "Removed"} ${Math.abs(adjustment.applied).toLocaleString("en-US")} credits (${BUCKET_LABEL[adjustment.bucket].toLowerCase()}).`);
            void load();
          }}
        />
      ) : null}
    </SectionCard>
  );
}

function AdjustCreditsDialog({
  userId,
  unlimitedMonthly,
  monthlyLeft,
  walletLeft,
  onClose,
  onDone,
}: {
  userId: string;
  unlimitedMonthly: boolean;
  monthlyLeft: number;
  walletLeft: number;
  onClose: () => void;
  onDone: (adjustment: CreditAdjustment) => void;
}) {
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState("");
  const [bucket, setBucket] = useState<CreditBucket>("wallet");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" && !saving) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const value = Number(amount);
  const validAmount = Number.isInteger(value) && value > 0 && value <= 1_000_000;
  const validReason = reason.trim().length >= 3;
  const available = bucket === "wallet" ? walletLeft : monthlyLeft;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validAmount || !validReason) return;
    setSaving(true);
    setError(null);
    try {
      const res = await adminService.adjustUserCredits(userId, { amount: direction === "add" ? value : -value, bucket, reason: reason.trim() });
      onDone(res.data.adjustment);
    } catch (err) {
      setError(errorMessage(err, "Couldn't adjust credits. Try again."));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => !saving && onClose()}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="adjust-credits-title"
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="admin-panel w-full max-w-lg space-y-4 p-6"
      >
        <h2 id="adjust-credits-title" className="text-xl font-semibold text-[color:var(--admin-text)]">Adjust credits</h2>

        <fieldset className="space-y-2">
          <legend className="admin-field-label">Change</legend>
          <div className="flex gap-2">
            {(["add", "remove"] as const).map((d) => (
              <label key={d} className={`admin-button flex-1 cursor-pointer justify-center ${direction === d ? "admin-button-primary" : "admin-button-secondary"}`}>
                <input type="radio" name="direction" className="sr-only" checked={direction === d} onChange={() => setDirection(d)} />
                {d === "add" ? "Add credits" : "Remove credits"}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-1">
          <label htmlFor="credit-amount" className="admin-field-label">Amount</label>
          <input
            id="credit-amount"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            required
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="admin-input w-full"
            placeholder="e.g. 100"
          />
          {amount && !validAmount ? <p className="admin-field-hint text-[color:var(--admin-danger)]">Enter a whole number from 1 to 1,000,000.</p> : null}
        </div>

        <fieldset className="space-y-2">
          <legend className="admin-field-label">How long they last</legend>
          <label className="flex cursor-pointer items-start gap-2 text-sm text-[color:var(--admin-text)]">
            <input type="radio" name="bucket" className="mt-1" checked={bucket === "wallet"} onChange={() => setBucket("wallet")} />
            <span><strong>Never expire.</strong> Added to the user&rsquo;s purchased credits and used after their monthly credits.</span>
          </label>
          <label className={`flex items-start gap-2 text-sm ${unlimitedMonthly ? "opacity-50" : "cursor-pointer"} text-[color:var(--admin-text)]`}>
            <input type="radio" name="bucket" className="mt-1" disabled={unlimitedMonthly} checked={bucket === "monthly"} onChange={() => setBucket("monthly")} />
            <span><strong>This month only.</strong> Changes this billing month&rsquo;s allowance and is gone when it resets.{unlimitedMonthly ? " (Not available: this plan has unlimited monthly credits.)" : ""}</span>
          </label>
        </fieldset>
        {direction === "remove" ? (
          <p className="admin-field-hint">The user has {available.toLocaleString("en-US")} {bucket === "wallet" ? "never-expiring" : "monthly"} credits left. Removing more stops at zero.</p>
        ) : null}

        <div className="space-y-1">
          <label htmlFor="credit-reason" className="admin-field-label">Reason (required, shown in the audit log)</label>
          <textarea id="credit-reason" required minLength={3} maxLength={500} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="admin-textarea w-full" placeholder="e.g. Compensation for failed generations on Nov 18" />
        </div>

        {error ? <p role="alert" className="rounded-lg bg-[color:var(--admin-danger-soft)] px-3 py-2 text-sm text-[color:var(--admin-danger)]">{error}</p> : null}

        <div className="flex justify-end gap-3">
          <button type="button" className="admin-button admin-button-secondary" disabled={saving} onClick={onClose}>Cancel</button>
          <button type="submit" className="admin-button admin-button-primary" disabled={saving || !validAmount || !validReason}>
            {saving ? "Saving…" : `${direction === "add" ? "Add" : "Remove"} ${validAmount ? value.toLocaleString("en-US") : ""} credits`}
          </button>
        </div>
      </form>
    </div>
  );
}
