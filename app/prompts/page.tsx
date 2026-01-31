"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import DataTable from "@/components/shared/DataTable";
import FilterBar from "@/components/shared/FilterBar";
import Pagination from "@/components/shared/Pagination";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton, { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import ErrorState from "@/components/shared/ErrorState";
import { adminService } from "@/lib/services/adminService";

interface PromptRow {
  _id: string;
  title: string;
  visibility: string;
  isTemplate: boolean;
  updatedAt: string;
  userId?: {
    _id: string;
    name?: string;
    email?: string;
  } | null;
}

export default function AdminPromptsPage() {
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadPrompts = async (page: number = currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getPrompts({ 
        search, 
        page, 
        limit: itemsPerPage 
      });
      setPrompts(response.data || []);
      
      // Update pagination metadata
      if (response.pagination) {
        setTotalPages(response.pagination.totalPages || 1);
        setTotal(response.pagination.total || 0);
      }
    } catch (err) {
      console.error("Failed to load prompts", err);
      setError("Failed to load prompts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = () => {
    if (currentPage === 1) {
      // If already on page 1, reload directly
      loadPrompts(1);
    } else {
      // Otherwise, change page which will trigger useEffect
      setCurrentPage(1);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Prompts"
        description="View and manage all prompts and templates"
      />
      <FilterBar>
        <input
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200"
          placeholder="Search prompts"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button
          className="bg-[#A84C34] text-white px-4 py-2 rounded-lg text-sm"
          onClick={handleSearch}
        >
          Search
        </button>
      </FilterBar>

      {loading ? (
        <TableSkeleton rows={10} columns={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadPrompts(1)} />
      ) : (
        <>
          <DataTable
            rows={prompts}
            columns={[
              {
                key: "title",
                label: "Title",
                render: (value, row) => (
                  <Link className="text-[#A84C34]" href={`/prompts/${row._id}`}>
                    {value}
                  </Link>
                ),
              },
              { key: "visibility", label: "Visibility" },
              {
                key: "isTemplate",
                label: "Type",
                render: (value) => (value ? "Template" : "Prompt"),
              },
              {
                key: "userId",
                label: "Created By",
                render: (value, row) => {
                  if (!row.userId || !row.userId._id) {
                    return <span className="text-gray-500">Deleted User</span>;
                  }
                  const displayName = row.userId.name || row.userId.email || "Unknown";
                  return (
                    <Link 
                      className="text-[#A84C34] hover:underline" 
                      href={`/users/${row.userId._id}`}
                    >
                      {displayName}
                    </Link>
                  );
                },
              },
              { key: "updatedAt", label: "Updated" },
            ]}
          />
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
