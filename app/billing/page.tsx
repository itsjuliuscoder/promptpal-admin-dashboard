"use client";

import React, { useEffect, useState } from "react";
import SectionCard from "@/components/shared/SectionCard";
import DataTable from "@/components/shared/DataTable";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton, { CardSkeleton } from "@/components/shared/LoadingSkeleton";
import ErrorState from "@/components/shared/ErrorState";
import StatusBadge from "@/components/shared/StatusBadge";
import KpiCard from "@/components/admin/overview/KpiCard";
import { adminService } from "@/lib/services/adminService";

const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

export default function AdminBillingPage() {
  const [revenue, setRevenue] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [planLimits, setPlanLimits] = useState<any>(null);
  const [churn, setChurn] = useState<any>(null);
  const [trialConversion, setTrialConversion] = useState<any>(null);
  const [paymentHealth, setPaymentHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [revenueRes, subsRes, planLimitsRes, churnRes, trialRes, healthRes] = await Promise.all([
          adminService.getBillingRevenue(),
          adminService.getBillingSubscriptions({ page: 1, limit: 20 }),
          adminService.getPlanLimits().catch(() => ({ data: null })),
          adminService.getBillingChurn().catch(() => ({ data: null })),
          adminService.getBillingTrialConversion().catch(() => ({ data: null })),
          adminService.getBillingPaymentHealth().catch(() => ({ data: null })),
        ]);
        setRevenue(revenueRes.data ?? revenueRes);
        setSubscriptions(subsRes.data ?? []);
        setPlanLimits(planLimitsRes.data ?? planLimitsRes ?? null);
        setChurn(churnRes.data ?? churnRes ?? null);
        setTrialConversion(trialRes.data ?? trialRes ?? null);
        setPaymentHealth(healthRes.data ?? healthRes ?? null);
      } catch (err) {
        console.error("Failed to load billing data", err);
        setError("Failed to load billing data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Billing & Plans"
          description="Monitor revenue, subscriptions, and plan usage"
        />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Billing & Plans"
          description="Monitor revenue, subscriptions, and plan usage"
        />
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Billing & Plans"
        description="Monitor revenue, subscriptions, and plan usage"
      />

      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {revenue.totalRevenue != null && (
            <KpiCard
              label="Total Revenue"
              value={formatCurrency(revenue.totalRevenue)}
              unit=""
            />
          )}
          {revenue.monthlyRevenue != null && (
            <KpiCard
              label="Monthly Revenue"
              value={formatCurrency(revenue.monthlyRevenue)}
              unit=""
            />
          )}
          {revenue.activeSubscriptions != null && (
            <KpiCard
              label="Active Subscriptions"
              value={revenue.activeSubscriptions}
              unit=""
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {planLimits != null && typeof planLimits === "object" && Object.keys(planLimits).length > 0 && (
          <SectionCard title="Plan Limits">
            <div className="space-y-2 text-sm">
              {Array.isArray(planLimits) ? (
                <pre className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-auto max-h-48">
                  {JSON.stringify(planLimits, null, 2)}
                </pre>
              ) : (
                <ul className="space-y-1">
                  {Object.entries(planLimits).map(([key, val]) => (
                    <li key={key} className="flex justify-between gap-2">
                      <span className="text-gray-600 dark:text-gray-400 capitalize">
                        {String(key).replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {typeof val === "object" ? JSON.stringify(val) : String(val)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </SectionCard>
        )}
        {churn != null && typeof churn === "object" && Object.keys(churn).length > 0 && (
          <SectionCard title="Churn">
            <div className="space-y-2 text-sm">
              {Array.isArray(churn) ? (
                <pre className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-auto max-h-48">
                  {JSON.stringify(churn, null, 2)}
                </pre>
              ) : (
                <ul className="space-y-1">
                  {Object.entries(churn).map(([key, val]) => (
                    <li key={key} className="flex justify-between gap-2">
                      <span className="text-gray-600 dark:text-gray-400 capitalize">
                        {String(key).replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {typeof val === "object" ? JSON.stringify(val) : String(val)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </SectionCard>
        )}
        {trialConversion != null && typeof trialConversion === "object" && Object.keys(trialConversion).length > 0 && (
          <SectionCard title="Trial Conversion">
            <div className="space-y-2 text-sm">
              {Array.isArray(trialConversion) ? (
                <pre className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-auto max-h-48">
                  {JSON.stringify(trialConversion, null, 2)}
                </pre>
              ) : (
                <ul className="space-y-1">
                  {Object.entries(trialConversion).map(([key, val]) => (
                    <li key={key} className="flex justify-between gap-2">
                      <span className="text-gray-600 dark:text-gray-400 capitalize">
                        {String(key).replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {typeof val === "object" ? JSON.stringify(val) : String(val)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </SectionCard>
        )}
        {paymentHealth != null && typeof paymentHealth === "object" && Object.keys(paymentHealth).length > 0 && (
          <SectionCard title="Payment Health">
            <div className="space-y-2 text-sm">
              {Array.isArray(paymentHealth) ? (
                <pre className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-auto max-h-48">
                  {JSON.stringify(paymentHealth, null, 2)}
                </pre>
              ) : (
                <ul className="space-y-1">
                  {Object.entries(paymentHealth).map(([key, val]) => (
                    <li key={key} className="flex justify-between gap-2">
                      <span className="text-gray-600 dark:text-gray-400 capitalize">
                        {String(key).replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {typeof val === "object" ? JSON.stringify(val) : String(val)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </SectionCard>
        )}
      </div>

      <SectionCard title="Subscriptions">
        <DataTable
          rows={subscriptions}
          columns={[
            {
              key: "userId",
              label: "User",
              render: (value) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {typeof value === "object" && value !== null
                    ? value.email || value.name || "Unknown"
                    : String(value || "Unknown")}
                </span>
              ),
            },
            {
              key: "planName",
              label: "Plan",
              render: (value) => (
                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {String(value || "free")}
                </span>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (value) => <StatusBadge label={String(value || "unknown")} />,
            },
            {
              key: "amount",
              label: "Amount",
              render: (value) => (
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {typeof value === "number" ? formatCurrency(value) : String(value || "N/A")}
                </span>
              ),
            },
          ]}
          emptyMessage="No subscriptions found"
        />
      </SectionCard>
    </div>
  );
}
