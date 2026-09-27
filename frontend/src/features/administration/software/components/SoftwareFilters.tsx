import { useState } from "react";
import {
  Filter,
  RotateCcw,
  Search,
} from "lucide-react";

import type { SoftwareFilters } from "../types/software.types";

interface SoftwareFiltersProps {
  filters: SoftwareFilters;
  onChange: (filters: SoftwareFilters) => void;
}

export function SoftwareFilters({
  filters,
  onChange,
}: SoftwareFiltersProps) {
  const [search, setSearch] = useState(
    filters.search ?? "",
  );

  const [vendor, setVendor] = useState(
    filters.vendor ?? "",
  );

  const updateFilters = (
    updates: Partial<SoftwareFilters>,
  ) => {
    onChange({
      ...filters,
      ...updates,
      page: 1,
    });
  };

  const handleApply = () => {
    updateFilters({
      search: search.trim() || undefined,
      vendor: vendor.trim() || undefined,
    });
  };

  const handleReset = () => {
    setSearch("");
    setVendor("");

    onChange({
      page: 1,
      limit: filters.limit ?? 10,
    });
  };

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.vendor) ||
    filters.isActive !== undefined ||
    filters.licenseRequired !== undefined;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-black/10">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
            <Filter className="h-4 w-4" />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">
              Filters
            </h2>

            <p className="text-xs text-slate-500">
              Search and refine the software catalog
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {/* Search */}
          <div className="xl:col-span-2">
            <label
              htmlFor="software-search"
              className="mb-1.5 block text-xs font-medium text-slate-400"
            >
              Software
            </label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                id="software-search"
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleApply();
                  }
                }}
                placeholder="Search software..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Vendor */}
          <div>
            <label
              htmlFor="software-vendor"
              className="mb-1.5 block text-xs font-medium text-slate-400"
            >
              Vendor
            </label>

            <input
              id="software-vendor"
              type="text"
              value={vendor}
              onChange={(event) =>
                setVendor(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleApply();
                }
              }}
              placeholder="e.g. Microsoft"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="software-status"
              className="mb-1.5 block text-xs font-medium text-slate-400"
            >
              Status
            </label>

            <select
              id="software-status"
              value={
                filters.isActive === undefined
                  ? "all"
                  : filters.isActive
                    ? "active"
                    : "inactive"
              }
              onChange={(event) => {
                const value = event.target.value;

                updateFilters({
                  isActive:
                    value === "all"
                      ? undefined
                      : value === "active",
                });
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">
                All statuses
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>
          </div>

          {/* License */}
          <div>
            <label
              htmlFor="software-license"
              className="mb-1.5 block text-xs font-medium text-slate-400"
            >
              License
            </label>

            <select
              id="software-license"
              value={
                filters.licenseRequired === undefined
                  ? "all"
                  : filters.licenseRequired
                    ? "required"
                    : "not-required"
              }
              onChange={(event) => {
                const value = event.target.value;

                updateFilters({
                  licenseRequired:
                    value === "all"
                      ? undefined
                      : value === "required",
                });
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">
                All
              </option>

              <option value="required">
                License required
              </option>

              <option value="not-required">
                No license required
              </option>
            </select>
          </div>

          {/* Apply */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleApply}
              className="w-full rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Apply Filters
            </button>
          </div>

          {/* Reset */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasActiveFilters}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}