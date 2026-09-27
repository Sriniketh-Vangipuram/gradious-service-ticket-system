import type { CategoryFilters } from "../types/category.types";

interface CategoryFiltersProps {
  filters: CategoryFilters;
  onChange: (filters: CategoryFilters) => void;
  onReset: () => void;
}

export function CategoryFilters({
  filters,
  onChange,
  onReset,
}: CategoryFiltersProps) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.isActive !== undefined;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px_auto]">
        {/* Search */}
        <div>
          <label
            htmlFor="category-search"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Search categories
          </label>

          <input
            id="category-search"
            type="text"
            value={filters.search ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                search: event.target.value || undefined,
                page: 1,
              })
            }
            placeholder="Search by name or code..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Status */}
        <div>
          <label
            htmlFor="category-status"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Status
          </label>

          <select
            id="category-status"
            value={
              filters.isActive === undefined
                ? "all"
                : filters.isActive
                  ? "active"
                  : "inactive"
            }
            onChange={(event) => {
              const value = event.target.value;

              onChange({
                ...filters,
                isActive:
                  value === "all"
                    ? undefined
                    : value === "active",
                page: 1,
              });
            }}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Reset */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="w-full rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}