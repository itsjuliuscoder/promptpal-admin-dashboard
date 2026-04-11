"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FiRefreshCw, FiRotateCcw, FiSearch } from "react-icons/fi";
import { adminService } from "@/lib/services/adminService";
import DataTable from "@/components/shared/DataTable";
import FilterBar from "@/components/shared/FilterBar";
import StatusBadge from "@/components/shared/StatusBadge";
import Pagination from "@/components/shared/Pagination";
import PageHeader from "@/components/shared/PageHeader";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import ErrorState from "@/components/shared/ErrorState";

interface UserRow {
  _id: string;
  name: string;
  email: string;
  subscriptionStatus?: string;
  authProvider?: string;
  blocked?: boolean;
  onboardingCompleted?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

interface FilterParams {
  search?: string;
  plan?: string;
  status?: string;
  onboarding?: string;
  dateFrom?: string;
  dateTo?: string;
}

function formatDate(value?: string) {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" });
}

function formatSource(value?: string) {
  return (value || "local").replace("_", " ");
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [onboardingFilter, setOnboardingFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const loadUsers = async (page: number = currentPage, overrides?: FilterParams) => {
    setLoading(true);
    setError(null);
    const filters = overrides ?? {
      search: search || undefined,
      plan: planFilter || undefined,
      status: statusFilter || undefined,
      onboarding: onboardingFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    };
    try {
      const response = await adminService.getUsers({ ...filters, page, limit: itemsPerPage });
      setUsers(response.users || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error("Failed to load users", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    loadUsers(1);
  };

  const handleReset = () => {
    setSearch("");
    setPlanFilter("");
    setStatusFilter("");
    setOnboardingFilter("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
    loadUsers(1, {});
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadUsers(page);
  };

  const visibleStats = useMemo(() => {
    const active = users.filter((user) => !user.blocked).length;
    const blocked = users.filter((user) => user.blocked).length;
    const pendingOnboarding = users.filter((user) => !user.onboardingCompleted).length;
    return { active, blocked, pendingOnboarding };
  }, [users]);

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Users"
        description="Monitor account health, lifecycle status, and recent access patterns across PromptPal."
        metadata={
          <>
            <span className="admin-stat-pill">Page {pagination?.page || 1}</span>
            <span className="admin-stat-pill">{pagination?.total || users.length} total users</span>
          </>
        }
        actions={
          <button
            className="admin-button admin-button-secondary"
            onClick={() => loadUsers(currentPage)}
          >
            <FiRefreshCw size={16} />
            Refresh
          </button>
        }
      />

      <FilterBar
        searchSlot={
          <>
            <div className="grid gap-2">
              <label className="admin-eyebrow" htmlFor="user-search">
                Search users
              </label>
              <input
                id="user-search"
                className="admin-input"
                placeholder="Search by name or email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
              />
            </div>
          </>
        }
        filterSlot={
          <>
            <select
              className="admin-select"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <option value="">All plans</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="team_starter">Team Starter</option>
              <option value="team_pro">Team Pro</option>
              <option value="trial">Trial</option>
            </select>
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
            <select
              className="admin-select"
              value={onboardingFilter}
              onChange={(e) => setOnboardingFilter(e.target.value)}
            >
              <option value="">All onboarding</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
            <input
              type="date"
              className="admin-input"
              title="Signup date from"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <input
              type="date"
              className="admin-input"
              title="Signup date to"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </>
        }
        actionSlot={
          <>
            <button className="admin-button admin-button-primary" onClick={handleSearch}>
              <FiSearch size={16} />
              Search
            </button>
            <button className="admin-button admin-button-ghost" onClick={handleReset}>
              <FiRotateCcw size={16} />
              Reset
            </button>
          </>
        }
      />

      <section className="admin-summary-strip">
        <div className="admin-summary-item">
          <p className="admin-summary-label">Total users</p>
          <p className="admin-summary-value">{pagination?.total || users.length}</p>
          <p className="admin-summary-hint">Registered accounts in PromptPal</p>
        </div>
        <div className="admin-summary-item">
          <p className="admin-summary-label">Visible active</p>
          <p className="admin-summary-value">{visibleStats.active}</p>
          <p className="admin-summary-hint">Users not currently blocked</p>
        </div>
        <div className="admin-summary-item">
          <p className="admin-summary-label">Visible blocked</p>
          <p className="admin-summary-value">{visibleStats.blocked}</p>
          <p className="admin-summary-hint">Flagged on this page of results</p>
        </div>
        <div className="admin-summary-item">
          <p className="admin-summary-label">Pending onboarding</p>
          <p className="admin-summary-value">{visibleStats.pendingOnboarding}</p>
          <p className="admin-summary-hint">Users still incomplete on onboarding</p>
        </div>
      </section>

      {loading ? (
        <TableSkeleton rows={10} columns={7} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadUsers(1)} />
      ) : (
        <>
          <DataTable
            rows={users}
            rowKey={(row) => row._id}
            emptyTitle="No users found"
            emptyMessage="Try adjusting your filters or search query."
            mobileCardTitle={(row) => (
              <Link className="text-[color:var(--admin-text)] hover:text-[color:var(--admin-accent-strong)]" href={`/users/${row._id}`}>
                {row.name || "Unnamed"}
              </Link>
            )}
            mobileCardMeta={(row) => row.email}
            mobileCardFooter={(row) => (
              <StatusBadge label={row.blocked ? "Blocked" : "Active"} variant={row.blocked ? "error" : "success"} size="sm" />
            )}
            columns={[
              {
                key: "name",
                label: "Name",
                emphasize: true,
                width: "22%",
                render: (value, row) => (
                  <Link
                    className="font-semibold text-[color:var(--admin-text)] transition-colors hover:text-[color:var(--admin-accent-strong)]"
                    href={`/users/${row._id}`}
                  >
                    {value || "Unnamed"}
                  </Link>
                ),
              },
              {
                key: "email",
                label: "Email",
                truncate: true,
                width: "24%",
              },
              {
                key: "subscriptionStatus",
                label: "Plan",
                width: "12%",
                render: (value) => <StatusBadge label={value || "free"} variant="info" />,
              },
              {
                key: "authProvider",
                label: "Source",
                width: "12%",
                render: (value) => (
                  <span className="capitalize">{formatSource(value)}</span>
                ),
              },
              {
                key: "blocked",
                label: "Status",
                width: "12%",
                render: (value) => (
                  <StatusBadge
                    label={value ? "Blocked" : "Active"}
                    variant={value ? "error" : "success"}
                  />
                ),
              },
              {
                key: "onboardingCompleted",
                label: "Onboarding",
                width: "12%",
                render: (value) => (
                  <StatusBadge
                    label={value ? "Completed" : "Pending"}
                    variant={value ? "success" : "warning"}
                  />
                ),
              },
              {
                key: "lastLoginAt",
                label: "Last login",
                align: "right",
                width: "16%",
                render: (value) => formatDate(value),
              },
            ]}
          />
          {pagination ? (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
