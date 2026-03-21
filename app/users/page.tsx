"use client";

import React, { useEffect, useState } from "react";
import { adminService } from "@/lib/services/adminService";
import DataTable from "@/components/shared/DataTable";
import FilterBar from "@/components/shared/FilterBar";
import StatusBadge from "@/components/shared/StatusBadge";
import Pagination from "@/components/shared/Pagination";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton, { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import ErrorState from "@/components/shared/ErrorState";
import Link from "next/link";

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

const selectClass =
  "border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200";

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

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Users"
        description="Manage and monitor all PromptPal users"
      />
      <FilterBar>
        <input
          className={selectClass}
          placeholder="Search name or email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSearch();
          }}
        />
        <select
          className={selectClass}
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
        >
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="team_starter">Team Starter</option>
          <option value="team_pro">Team Pro</option>
          <option value="trial">Trial</option>
        </select>
        <select
          className={selectClass}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
        <select
          className={selectClass}
          value={onboardingFilter}
          onChange={(e) => setOnboardingFilter(e.target.value)}
        >
          <option value="">All Onboarding</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
        </select>
        <input
          type="date"
          className={selectClass}
          title="Signup date from"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <input
          type="date"
          className={selectClass}
          title="Signup date to"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
        <button
          className="bg-[#A84C34] text-white px-4 py-2 rounded-lg text-sm"
          onClick={handleSearch}
        >
          Search
        </button>
        <button
          className="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
          onClick={handleReset}
        >
          Reset
        </button>
      </FilterBar>

      {loading ? (
        <TableSkeleton rows={10} columns={7} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadUsers(1)} />
      ) : (
        <>
          <DataTable
            rows={users}
            columns={[
              {
                key: "name",
                label: "Name",
                render: (value, row) => (
                  <Link className="text-[#A84C34]" href={`/users/${row._id}`}>
                    {value || "Unnamed"}
                  </Link>
                ),
              },
              { key: "email", label: "Email" },
              {
                key: "subscriptionStatus",
                label: "Plan",
                render: (value) => value || "free",
              },
              {
                key: "authProvider",
                label: "Signup Source",
                render: (value) => value || "local",
              },
              {
                key: "blocked",
                label: "Status",
                render: (value) => (
                  <StatusBadge label={value ? "Blocked" : "Active"} />
                ),
              },
              {
                key: "onboardingCompleted",
                label: "Onboarding",
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
                render: (value) =>
                  value
                    ? new Date(value).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })
                    : "Never",
              },
            ]}
          />
          {pagination && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
