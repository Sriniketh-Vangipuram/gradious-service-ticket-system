import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Monitor,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  XCircle,
} from "lucide-react";

import { useAuth } from "../../../auth/hooks/useAuth";
import { SoftwareFilters } from "../components/SoftwareFilters";
import { CreateSoftwareDialog } from "../components/CreateSoftwareDialog";
import { EditSoftwareDialog } from "../components/EditSoftwareDialog";
import { SoftwareStatusConfirmationDialog } from "../components/SoftwareStatusConfirmationDialog";
import { useSoftware } from "../hooks/useSoftware";
import type {
  Software,
  SoftwareFilters as SoftwareFiltersType,
} from "../types/software.types";

const DEFAULT_LIMIT = 10;

export function SoftwarePage() {
  const { user } = useAuth();

  const isAdmin = user?.role === "ADMIN";

  const [filters, setFilters] =
    useState<SoftwareFiltersType>({
      page: 1,
      limit: DEFAULT_LIMIT,
    });

  const [createDialogOpen, setCreateDialogOpen] =
    useState(false);

  const [editingSoftware, setEditingSoftware] =
    useState<Software | null>(null);

  const [
    statusConfirmationSoftware,
    setStatusConfirmationSoftware,
  ] = useState<Software | null>(null);

  const softwareQuery = useSoftware(filters);

  const software =
    softwareQuery.data?.data?.data ?? [];

  const pagination =
    softwareQuery.data?.data?.pagination;

  const totalPages =
    pagination?.totalPages ?? 1;

  const currentPage =
    pagination?.page ?? filters.page ?? 1;

  const total =
    pagination?.total ?? 0;

  const hasPreviousPage =
    currentPage > 1;

  const hasNextPage =
    currentPage < totalPages;

  const visibleRange = useMemo(() => {
    if (total === 0) {
      return "0 results";
    }

    const limit =
      pagination?.limit ??
      filters.limit ??
      DEFAULT_LIMIT;

    const start =
      (currentPage - 1) * limit + 1;

    const end = Math.min(
      currentPage * limit,
      total,
    );

    return `${start}-${end} of ${total}`;
  }, [
    currentPage,
    filters.limit,
    pagination?.limit,
    total,
  ]);

  const handleFiltersChange = (
    nextFilters: SoftwareFiltersType,
  ) => {
    setFilters(nextFilters);
  };

  const handlePreviousPage = () => {
    if (!hasPreviousPage) {
      return;
    }

    setFilters((current) => ({
      ...current,
      page: currentPage - 1,
    }));
  };

  const handleNextPage = () => {
    if (!hasNextPage) {
      return;
    }

    setFilters((current) => ({
      ...current,
      page: currentPage + 1,
    }));
  };

  const handleRefresh = () => {
    void softwareQuery.refetch();
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-indigo-400 shadow-lg shadow-black/10">
              <Monitor className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Software
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Manage the software catalog used for service
                requests.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={softwareQuery.isFetching}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                softwareQuery.isFetching
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() =>
                setCreateDialogOpen(true)
              }
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              <Plus className="h-4 w-4" />
              Add Software
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <SoftwareFilters
        filters={filters}
        onChange={handleFiltersChange}
      />

      {/* Error */}
      {softwareQuery.isError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

            <div>
              <h2 className="text-sm font-semibold text-red-300">
                Unable to load software
              </h2>

              <p className="mt-1 text-sm text-red-400/90">
                Something went wrong while loading the
                software catalog.
              </p>

              <button
                type="button"
                onClick={handleRefresh}
                className="mt-3 text-sm font-medium text-red-300 underline underline-offset-4 hover:text-red-200"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl shadow-black/10">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b border-slate-800 bg-slate-950/70">
              <tr>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Software
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Vendor
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Version
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  License
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tickets
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>

                {isAdmin && (
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80">
              {/* Loading */}
              {softwareQuery.isLoading && (
                <>
                  {Array.from({ length: 5 }).map(
                    (_, index) => (
                      <tr key={index}>
                        <td
                          colSpan={
                            isAdmin ? 7 : 6
                          }
                          className="px-5 py-5"
                        >
                          <div className="h-5 animate-pulse rounded bg-slate-800" />
                        </td>
                      </tr>
                    ),
                  )}
                </>
              )}

              {/* Empty */}
              {!softwareQuery.isLoading &&
                !softwareQuery.isError &&
                software.length === 0 && (
                  <tr>
                    <td
                      colSpan={isAdmin ? 7 : 6}
                      className="px-6 py-16 text-center"
                    >
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-500">
                        <Monitor className="h-5 w-5" />
                      </div>

                      <h3 className="mt-4 text-sm font-semibold text-white">
                        No software found
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Try changing your filters or add
                        a new software product.
                      </p>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() =>
                            setCreateDialogOpen(true)
                          }
                          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
                        >
                          <Plus className="h-4 w-4" />
                          Add Software
                        </button>
                      )}
                    </td>
                  </tr>
                )}

              {/* Rows */}
              {!softwareQuery.isLoading &&
                !softwareQuery.isError &&
                software.map((item) => (
                  <tr
                    key={item.id}
                    className="transition hover:bg-slate-800/30"
                  >
                    {/* Software */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                          <Monitor className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {item.name}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            ID #{item.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Vendor */}
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-300">
                        {item.vendor || "—"}
                      </span>
                    </td>

                    {/* Version */}
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-slate-300">
                        {item.version || "—"}
                      </span>
                    </td>

                    {/* License */}
                    <td className="px-5 py-4">
                      {item.licenseRequired ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
                          <ShieldCheck className="h-4 w-4" />
                          Required
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-slate-500">
                          Not required
                        </span>
                      )}
                    </td>

                    {/* Tickets */}
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-slate-300">
                        {item._count?.tickets ?? 0}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      {item.isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-400">
                          <XCircle className="h-3.5 w-3.5" />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    {isAdmin && (
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingSoftware(
                                item,
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setStatusConfirmationSoftware(
                                item,
                              )
                            }
                            className={
                              item.isActive
                                ? "inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
                                : "inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/10"
                            }
                          >
                            {item.isActive ? (
                              <>
                                <ShieldOff className="h-3.5 w-3.5" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Reactivate
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!softwareQuery.isLoading &&
          !softwareQuery.isError &&
          total > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-medium text-slate-300">
                  {visibleRange}
                </span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePreviousPage}
                  disabled={!hasPreviousPage}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <span className="px-2 text-sm text-slate-500">
                  Page{" "}
                  <span className="font-medium text-slate-300">
                    {currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-slate-300">
                    {totalPages}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={!hasNextPage}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
      </div>

      {/* Create */}
      {isAdmin && (
        <CreateSoftwareDialog
          open={createDialogOpen}
          onClose={() =>
            setCreateDialogOpen(false)
          }
        />
      )}

      {/* Edit */}
      {isAdmin && (
        <EditSoftwareDialog
          open={Boolean(editingSoftware)}
          software={editingSoftware}
          onClose={() =>
            setEditingSoftware(null)
          }
        />
      )}

      {/* Status */}
      {isAdmin && (
        <SoftwareStatusConfirmationDialog
          open={Boolean(
            statusConfirmationSoftware,
          )}
          software={
            statusConfirmationSoftware
          }
          onClose={() =>
            setStatusConfirmationSoftware(
              null,
            )
          }
        />
      )}
    </div>
  );
}