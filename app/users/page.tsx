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
  createdAt?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const loadUsers = async (page: number = currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getUsers({
        search,
        page,
        limit: itemsPerPage,
      });
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
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200"
          placeholder="Search name or email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <button
          className="bg-[#A84C34] text-white px-4 py-2 rounded-lg text-sm"
          onClick={handleSearch}
        >
          Search
        </button>
      </FilterBar>

      {loading ? (
        <TableSkeleton rows={10} columns={6} />
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
