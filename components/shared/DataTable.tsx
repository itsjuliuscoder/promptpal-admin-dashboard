"use client";

import React, { useState, useMemo } from "react";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Array<Column<T>>;
  rows: T[];
  emptyMessage?: string;
}

type SortDirection = "asc" | "desc" | null;

export default function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  emptyMessage = "No data available.",
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (columnKey: keyof T | string) => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column || column.sortable === false) return;

    if (sortColumn === columnKey) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortColumn(columnKey as keyof T);
      setSortDirection("asc");
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortColumn || !sortDirection) return rows;

    return [...rows].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Compare values
      let comparison = 0;
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [rows, sortColumn, sortDirection]);

  return (
    <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
          <tr>
            {columns.map((column) => {
              const isSortable = column.sortable !== false;
              const isSorted = sortColumn === column.key;
              return (
                <th
                  key={String(column.key)}
                  className={`px-4 py-3 text-left font-medium ${
                    isSortable ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none" : ""
                  }`}
                  onClick={() => isSortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {isSortable && (
                      <span className="text-gray-400 dark:text-gray-500">
                        {isSorted && sortDirection === "asc" && <FiChevronUp size={16} />}
                        {isSorted && sortDirection === "desc" && <FiChevronDown size={16} />}
                        {!isSorted && <span className="opacity-30"><FiChevronUp size={16} /></span>}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-200">
          {sortedRows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          )}
          {sortedRows.map((row, index) => (
            <tr
              key={(row as any).id ? String((row as any).id) : `row-${index}`}
              className="border-t border-gray-200 dark:border-gray-800"
            >
              {columns.map((column) => (
                <td key={String(column.key)} className="px-4 py-3">
                  {column.render ? column.render((row as any)[column.key], row) : String((row as any)[column.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
