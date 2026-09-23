import type { ListUsersParams } from "../api/userService";
import type { TechnicianSpecialization } from "../types/user.types";

interface UserFiltersProps {
  filters: Omit<ListUsersParams, "cursor" | "limit">;
  onFiltersChange: (
    filters: Omit<ListUsersParams, "cursor" | "limit">,
  ) => void;
}

const ROLE_OPTIONS = [
  { value: "ALL", label: "All roles" },
  { value: "EMPLOYEE", label: "Employees" },
  { value: "TECHNICIAN", label: "Technicians" },
  { value: "CENTER_MANAGER", label: "Center managers" },
  { value: "ADMIN", label: "Administrators" },
] as const;

const SPECIALIZATION_OPTIONS: Array<{
  value: TechnicianSpecialization;
  label: string;
}> = [
  { value: "SOFTWARE", label: "Software" },
  { value: "HARDWARE", label: "Hardware" },
  { value: "NETWORK", label: "Network" },
];

export function UserFilters({
  filters,
  onFiltersChange,
}: UserFiltersProps) {
  function updateFilter<K extends keyof typeof filters>(
    key: K,
    value: (typeof filters)[K],
  ) {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  }

  function clearFilters() {
    onFiltersChange({});
  }

  const hasFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== "",
  );

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {/* Search --------------------------------------------------------- */}

        <div className="xl:col-span-2">
          <label
            htmlFor="user-search"
            className="mb-1.5 block text-xs font-medium text-slate-400"
          >
            Search
          </label>

          <input
            id="user-search"
            type="search"
            value={filters.search ?? ""}
            onChange={(event) =>
              updateFilter(
                "search",
                event.target.value || undefined,
              )
            }
            placeholder="Name or email..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-slate-500"
          />
        </div>

        {/* Role ----------------------------------------------------------- */}

        <div>
          <label
            htmlFor="user-role"
            className="mb-1.5 block text-xs font-medium text-slate-400"
          >
            Role
          </label>

          <select
            id="user-role"
            value={filters.role ?? "ALL"}
            onChange={(event) => {
              const value = event.target.value;

              updateFilter(
                "role",
                value === "ALL"
                  ? undefined
                  : (value as ListUsersParams["role"]),
              );
            }}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-slate-500"
          >
            {ROLE_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status --------------------------------------------------------- */}

        <div>
          <label
            htmlFor="user-status"
            className="mb-1.5 block text-xs font-medium text-slate-400"
          >
            Status
          </label>

          <select
            id="user-status"
            value={
              filters.isActive === undefined
                ? "ALL"
                : filters.isActive
                  ? "ACTIVE"
                  : "INACTIVE"
            }
            onChange={(event) => {
              const value = event.target.value;

              updateFilter(
                "isActive",
                value === "ALL"
                  ? undefined
                  : value === "ACTIVE",
              );
            }}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-slate-500"
          >
            <option value="ALL">All users</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {/* Specialization ------------------------------------------------- */}

        <div>
          <label
            htmlFor="user-specialization"
            className="mb-1.5 block text-xs font-medium text-slate-400"
          >
            Technician specialization
          </label>

          <select
            id="user-specialization"
            value={filters.specialization ?? "ALL"}
            onChange={(event) => {
              const value = event.target.value;

              updateFilter(
                "specialization",
                value === "ALL"
                  ? undefined
                  : (value as TechnicianSpecialization),
              );
            }}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-slate-500"
          >
            <option value="ALL">All specializations</option>

            {SPECIALIZATION_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Footer ----------------------------------------------------------- */}

      <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
        <p className="text-xs text-slate-500">
          Filter users by identity, role, status, or technician
          specialization.
        </p>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-medium text-slate-300 transition hover:text-white"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}