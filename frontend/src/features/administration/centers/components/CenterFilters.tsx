import type { ChangeEvent } from "react";

type CenterFiltersProps = {
  filters: {
    search?: string;
    isActive?: boolean;
  };

  onFiltersChange: (filters: {
    search?: string;
    isActive?: boolean;
  }) => void;
};

export function CenterFilters({
  filters,
  onFiltersChange,
}: CenterFiltersProps) {
  const handleSearchChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    onFiltersChange({
      ...filters,
      search: event.target.value || undefined,
    });
  };

  const handleStatusChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = event.target.value;

    onFiltersChange({
      ...filters,
      isActive:
        value === ""
          ? undefined
          : value === "active",
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Search */}
        <div className="md:col-span-2">
          <label
            htmlFor="center-search"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Search
          </label>

          <input
            id="center-search"
            type="search"
            value={filters.search ?? ""}
            onChange={handleSearchChange}
            placeholder="Search by center name or code..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Status */}
        <div>
          <label
            htmlFor="center-status"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Status
          </label>

          <select
            id="center-status"
            value={
              filters.isActive === undefined
                ? ""
                : filters.isActive
                  ? "active"
                  : "inactive"
            }
            onChange={handleStatusChange}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {(filters.search ||
        filters.isActive !== undefined) && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleClearFilters}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}