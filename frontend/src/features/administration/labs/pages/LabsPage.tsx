import { useMemo, useState } from "react";
import {
  Check,
  Edit3,
  FlaskConical,
  Plus,
  Power,
  Search,
  X,
} from "lucide-react";

import { useAuth } from "../../../auth/hooks/useAuth";
import { useCenters } from "../../centers/hooks/useCenters";

import CreateLabDialog from "../components/CreateLabDialog";
import EditLabDialog from "../components/EditLabDialog";

import {
  useLabs,
} from "../hooks/useLabs";

import {
  useUpdateLabStatus,
} from "../hooks/useLabMutations";

import type { Lab } from "../types/lab.types";

import {ConfirmationDialog} from "../../../../components/ui/ConfirmationDialog";

export default function LabsPage() {
  const { user } = useAuth();

  const isAdmin =
    user?.role === "ADMIN";

  /*
   * --------------------------------------------------------------------------
   * List filters
   * --------------------------------------------------------------------------
   */

  const [search, setSearch] =
    useState("");

  const [centerId, setCenterId] =
    useState<number | undefined>();

  const [isActive, setIsActive] =
    useState<boolean | undefined>();

  const [page, setPage] =
    useState(1);

  const limit = 10;

  /*
   * --------------------------------------------------------------------------
   * Dialog state
   * --------------------------------------------------------------------------
   */

  const [
    isCreateDialogOpen,
    setIsCreateDialogOpen,
  ] = useState(false);

  const [
    editingLab,
    setEditingLab,
  ] = useState<Lab | null>(null);

  const [
    statusDialog,
    setStatusDialog,
  ] = useState<Lab | null>(null);

  /*
   * --------------------------------------------------------------------------
   * Queries
   * --------------------------------------------------------------------------
   */

  const labsQuery = useLabs({
    search:
      search.trim() || undefined,
    centerId,
    isActive,
    page,
    limit,
  });

  const centersQuery = useCenters({
    page: 1,
    limit: 100,
    isActive: true,
  });

  const centers = useMemo(
    () =>
      centersQuery.data?.data?.data ??
      [],
    [centersQuery.data],
  );

  const labs =
    labsQuery.data?.data?.data ?? [];

  const pagination =
    labsQuery.data?.data?.pagination;

  /*
   * --------------------------------------------------------------------------
   * Mutations
   * --------------------------------------------------------------------------
   */

  const updateLabStatusMutation =
    useUpdateLabStatus();

  /*
   * --------------------------------------------------------------------------
   * Filter handlers
   * --------------------------------------------------------------------------
   */

  const handleSearchChange = (
    value: string,
  ) => {
    setSearch(value);
    setPage(1);
  };

  const handleCenterChange = (
    value: string,
  ) => {
    setCenterId(
      value
        ? Number(value)
        : undefined,
    );

    setPage(1);
  };

  const handleStatusFilterChange = (
    value: string,
  ) => {
    if (value === "") {
      setIsActive(undefined);
    } else {
      setIsActive(
        value === "true",
      );
    }

    setPage(1);
  };

  /*
   * --------------------------------------------------------------------------
   * Create
   * --------------------------------------------------------------------------
   */

  const handleCreateLab = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
  };

  /*
   * --------------------------------------------------------------------------
   * Edit
   * --------------------------------------------------------------------------
   */

  const handleEditLab = (
    lab: Lab,
  ) => {
    setEditingLab(lab);
  };

  const handleCloseEditDialog = () => {
    setEditingLab(null);
  };

  /*
   * --------------------------------------------------------------------------
   * Status
   * --------------------------------------------------------------------------
   */

  const handleOpenStatusDialog = (
    lab: Lab,
  ) => {
    setStatusDialog(lab);
  };

  const handleCloseStatusDialog = () => {
    if (
      updateLabStatusMutation.isPending
    ) {
      return;
    }

    setStatusDialog(null);
  };

  const handleConfirmStatusChange =
    async () => {
      if (!statusDialog) {
        return;
      }

      try {
        await updateLabStatusMutation.mutateAsync(
          {
            labId: statusDialog.id,
            payload: {
              isActive:
                !statusDialog.isActive,
            },
          },
        );

        setStatusDialog(null);
      } catch {
        /*
         * The mutation state remains available
         * to the confirmation dialog so the user
         * can retry.
         */
      }
    };

  const isActivating =
    statusDialog
      ? !statusDialog.isActive
      : false;

  /*
   * --------------------------------------------------------------------------
   * Render
   * --------------------------------------------------------------------------
   */

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900">
              <FlaskConical className="h-5 w-5 text-slate-300" />
            </div>

            <div>
              <h1 className="text-xl font-semibold text-white">
                Labs
              </h1>

              <p className="text-sm text-slate-400">
                Manage service labs across
                centers.
              </p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={
              handleCreateLab
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Create Lab
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Filters                                                            */}
      {/* ------------------------------------------------------------------ */}

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                handleSearchChange(
                  event.target.value,
                )
              }
              placeholder="Search labs..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500"
            />
          </div>

          {/* Center */}
          <select
            value={centerId ?? ""}
            onChange={(event) =>
              handleCenterChange(
                event.target.value,
              )
            }
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-indigo-500"
          >
            <option value="">
              All Centers
            </option>

            {centers.map((center) => (
              <option
                key={center.id}
                value={center.id}
              >
                {center.name} ({center.code})
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={
              isActive === undefined
                ? ""
                : String(isActive)
            }
            onChange={(event) =>
              handleStatusFilterChange(
                event.target.value,
              )
            }
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-indigo-500"
          >
            <option value="">
              All Statuses
            </option>

            <option value="true">
              Active
            </option>

            <option value="false">
              Inactive
            </option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Loading                                                            */}
      {/* ------------------------------------------------------------------ */}

      {labsQuery.isLoading && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-10 text-center text-sm text-slate-400">
          Loading labs...
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Error                                                              */}
      {/* ------------------------------------------------------------------ */}

      {labsQuery.isError && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6 text-sm text-red-300">
          Failed to load labs.
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Empty                                                              */}
      {/* ------------------------------------------------------------------ */}

      {!labsQuery.isLoading &&
        !labsQuery.isError &&
        labs.length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center">
            <FlaskConical className="mx-auto h-10 w-10 text-slate-600" />

            <h3 className="mt-4 text-sm font-medium text-slate-200">
              No labs found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your filters or
              create a new lab.
            </p>
          </div>
        )}

      {/* ------------------------------------------------------------------ */}
      {/* Labs table                                                         */}
      {/* ------------------------------------------------------------------ */}

      {!labsQuery.isLoading &&
        !labsQuery.isError &&
        labs.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="border-b border-slate-800 bg-slate-950/50">
                  <tr>
                    <th className="px-5 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Lab
                    </th>

                    <th className="px-5 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Code
                    </th>

                    <th className="px-5 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Center
                    </th>

                    <th className="px-5 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    {isAdmin && (
                      <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {labs.map((lab) => (
                    <tr
                      key={lab.id}
                      className="transition hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-200">
                          {lab.name}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-sm text-slate-400">
                          {lab.code}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm text-slate-300">
                          {lab.center.name}
                        </div>

                        <div className="text-xs text-slate-500">
                          {lab.center.code}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                            lab.isActive
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-slate-700/50 text-slate-400"
                          }`}
                        >
                          {lab.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      {isAdmin && (
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleEditLab(
                                  lab,
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleOpenStatusDialog(
                                  lab,
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800"
                            >
                              <Power className="h-3.5 w-3.5" />

                              {lab.isActive
                                ? "Deactivate"
                                : "Reactivate"}
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
            {pagination &&
              pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-800 px-5 py-4">
                  <p className="text-sm text-slate-500">
                    Page {pagination.page} of{" "}
                    {pagination.totalPages}
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() =>
                        setPage(
                          (current) =>
                            current - 1,
                        )
                      }
                      className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>

                    <button
                      type="button"
                      disabled={
                        page >=
                        pagination.totalPages
                      }
                      onClick={() =>
                        setPage(
                          (current) =>
                            current + 1,
                        )
                      }
                      className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
          </div>
        )}

      {/* ------------------------------------------------------------------ */}
      {/* Create Lab dialog                                                  */}
      {/* ------------------------------------------------------------------ */}

      <CreateLabDialog
        open={isCreateDialogOpen}
        onClose={
          handleCloseCreateDialog
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* Edit Lab dialog                                                    */}
      {/* ------------------------------------------------------------------ */}

      <EditLabDialog
        open={Boolean(editingLab)}
        lab={editingLab}
        onClose={
          handleCloseEditDialog
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* Activate / Deactivate confirmation                                 */}
      {/* ------------------------------------------------------------------ */}

      <ConfirmationDialog
        open={Boolean(statusDialog)}
        title={
          isActivating
            ? "Reactivate lab?"
            : "Deactivate lab?"
        }
        description={
          isActivating ? (
            <>
              You are about to reactivate{" "}
              <span className="font-medium text-white">
                {statusDialog?.name}
              </span>{" "}
              ({statusDialog?.code}).

              <p className="mt-3">
                This will make the lab available
                for active service operations.
              </p>
            </>
          ) : (
            <>
              You are about to deactivate{" "}
              <span className="font-medium text-white">
                {statusDialog?.name}
              </span>{" "}
              ({statusDialog?.code}).

              <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-amber-300">
                Deactivating the lab prevents it
                from being selected for new
                operations. Existing tickets and
                historical relationships remain
                intact.
              </div>
            </>
          )
        }
        confirmLabel={
          isActivating
            ? "Reactivate lab"
            : "Deactivate lab"
        }
        loadingLabel={
          isActivating
            ? "Reactivating..."
            : "Deactivating..."
        }
        isLoading={
          updateLabStatusMutation.isPending
        }
        variant={
          isActivating
            ? "primary"
            : "danger"
        }
        icon={
          isActivating ? (
            <Check
              className="h-6 w-6 text-emerald-400"
              aria-hidden="true"
            />
          ) : (
            <X
              className="h-6 w-6 text-red-400"
              aria-hidden="true"
            />
          )
        }
        onCancel={
          handleCloseStatusDialog
        }
        onConfirm={
          handleConfirmStatusChange
        }
      />
    </div>
  );
}