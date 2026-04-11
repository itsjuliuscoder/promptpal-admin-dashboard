"use client";

import React, { useState, useMemo } from "react";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";
import EmptyState from "@/components/shared/EmptyState";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  emphasize?: boolean;
  truncate?: boolean;
  mobileHidden?: boolean;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  columns: Array<Column<T>>;
  rows: T[];
  emptyMessage?: string;
  emptyTitle?: string;
  stickyHeader?: boolean;
  rowKey?: (row: T, index: number) => string;
  mobileCardTitle?: (row: T) => React.ReactNode;
  mobileCardMeta?: (row: T) => React.ReactNode;
  mobileCardFooter?: (row: T) => React.ReactNode;
}

type SortDirection = "asc" | "desc" | null;

export default function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  emptyMessage = "No data available.",
  emptyTitle,
  stickyHeader = true,
  rowKey,
  mobileCardTitle,
  mobileCardMeta,
  mobileCardFooter,
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

  const visibleMobileColumns = columns.filter((column) => !column.mobileHidden);

  const getAlignClass = (align?: Column<T>["align"]) => {
    if (align === "right") return "text-right";
    if (align === "center") return "text-center";
    return "text-left";
  };

  const renderValue = (column: Column<T>, row: T) => {
    const value = (row as any)[column.key];
    return column.render ? column.render(value, row) : String(value ?? "");
  };

  if (sortedRows.length === 0) {
    return (
      <div className="admin-table-shell">
        <EmptyState title={emptyTitle} message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className="admin-table-shell">
      <div className="grid gap-3 p-3 md:hidden">
        {sortedRows.map((row, index) => {
          const key = rowKey ? rowKey(row, index) : (row as any).id ? String((row as any).id) : `row-${index}`;
          return (
            <article key={key} className="rounded-[1rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-panel)] p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[color:var(--admin-text)]">
                    {mobileCardTitle ? mobileCardTitle(row) : renderValue(columns[0], row)}
                  </div>
                  {mobileCardMeta ? (
                    <div className="mt-1 text-xs text-[color:var(--admin-text-soft)]">{mobileCardMeta(row)}</div>
                  ) : null}
                </div>
                {mobileCardFooter ? <div className="shrink-0">{mobileCardFooter(row)}</div> : null}
              </div>
              <dl className="grid gap-3">
                {visibleMobileColumns.slice(1).map((column) => (
                  <div key={String(column.key)} className="flex items-start justify-between gap-4 border-t border-[color:var(--admin-border)] pt-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--admin-text-faint)]">
                      {column.label}
                    </dt>
                    <dd className="max-w-[65%] text-right text-sm text-[color:var(--admin-text-soft)]">
                      {renderValue(column, row)}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          );
        })}
      </div>

      <div className="admin-table-scroll hidden md:block">
        <table className="min-w-full text-sm" aria-label="Data table">
          <thead
            className="bg-[color:var(--admin-panel-muted)] text-[color:var(--admin-text-faint)]"
          >
            <tr>
              {columns.map((column) => {
                const isSortable = column.sortable !== false;
                const isSorted = sortColumn === column.key;
                return (
                  <th
                    key={String(column.key)}
                    className={`${stickyHeader ? "sticky top-0 z-10" : ""} ${getAlignClass(column.align)} ${column.headerClassName ?? ""} px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                      isSortable ? "cursor-pointer select-none transition-colors hover:text-[color:var(--admin-text-soft)]" : ""
                    }`}
                    onClick={() => isSortable && handleSort(column.key)}
                    style={{ width: column.width }}
                  >
                    <div
                      className={`flex items-center gap-2 ${
                        column.align === "right"
                          ? "justify-end"
                          : column.align === "center"
                            ? "justify-center"
                            : "justify-start"
                      }`}
                    >
                      <span>{column.label}</span>
                      {isSortable ? (
                        <span className="text-[color:var(--admin-text-faint)]">
                          {isSorted && sortDirection === "asc" ? <FiChevronUp size={15} /> : null}
                          {isSorted && sortDirection === "desc" ? <FiChevronDown size={15} /> : null}
                          {!isSorted ? (
                            <span className="opacity-40">
                              <FiChevronUp size={15} />
                            </span>
                          ) : null}
                        </span>
                      ) : null}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-[color:var(--admin-panel)] text-[color:var(--admin-text-soft)]">
            {sortedRows.map((row, index) => {
              const key = rowKey ? rowKey(row, index) : (row as any).id ? String((row as any).id) : `row-${index}`;
              return (
                <tr
                  key={key}
                  className="border-t border-[color:var(--admin-border)] transition-colors hover:bg-[color:var(--admin-panel-muted)]"
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={`${getAlignClass(column.align)} ${column.cellClassName ?? ""} ${
                        column.truncate ? "max-w-[240px] truncate" : ""
                      } ${column.emphasize ? "font-semibold text-[color:var(--admin-text)]" : ""} px-5 py-4 align-top`}
                    >
                      {renderValue(column, row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
