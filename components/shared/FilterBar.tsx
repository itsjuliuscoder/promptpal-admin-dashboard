"use client";

import React from "react";

interface FilterBarProps {
  searchSlot?: React.ReactNode;
  filterSlot?: React.ReactNode;
  actionSlot?: React.ReactNode;
  children?: React.ReactNode;
}

export default function FilterBar({
  searchSlot,
  filterSlot,
  actionSlot,
  children,
}: FilterBarProps) {
  if (children) {
    return <div className="admin-toolbar">{children}</div>;
  }

  return (
    <div className="admin-toolbar">
      {searchSlot ? <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_auto] lg:items-start">{searchSlot}{actionSlot ? <div className="flex flex-wrap gap-3 lg:justify-end">{actionSlot}</div> : null}</div> : null}
      {filterSlot ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{filterSlot}</div> : null}
      {!searchSlot && actionSlot ? <div className="flex flex-wrap gap-3">{actionSlot}</div> : null}
    </div>
  );
}
