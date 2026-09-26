import { useState } from "react";
import { Check, X } from "lucide-react";

import { CenterFilters } from "../components/CenterFilters";
import { CenterFormDialog } from "../components/CenterFormDialog";
import { CenterList } from "../components/CenterList";

import { ConfirmationDialog } from "../../../../components/ui/ConfirmationDialog";

import {
  useCreateCenter,
  useUpdateCenter,
  useUpdateCenterStatus,
} from "../hooks/useCenterMutations";

import { useCenters } from "../hooks/useCenters";

import { useAuth } from "../../../auth/hooks/useAuth";

import type {
  Center,
  CenterFilters as CenterFilterParams,
  CreateCenterInput,
  UpdateCenterInput,
} from "../types/center.types";

type CenterFiltersState = Omit<
  CenterFilterParams,
  "page" | "limit"
>;

type StatusDialogState = {
  center: Center;
  nextStatus: boolean;
} | null;

export function AdministrationCentersPage() {
  /* ------------------------------------------------------------------------ */
  /* Local UI state                                                           */
  /* ------------------------------------------------------------------------ */

  const [filters, setFilters] =
    useState<CenterFiltersState>({});

  const [page, setPage] = useState(1);

  const limit = 20;

  const [formOpen, setFormOpen] = useState(false);

  const [editingCenter, setEditingCenter] =
    useState<Center | null>(null);

  const [statusDialog, setStatusDialog] =
    useState<StatusDialogState>(null);

  const [serverError, setServerError] =
    useState<string | null>(null);

  /* ------------------------------------------------------------------------ */
  /* Queries                                                                  */
  /* ------------------------------------------------------------------------ */

  const centersQuery = useCenters({
    ...filters,
    page,
    limit,
  });

  const {user} = useAuth();

  const isAdmin = user?.role === "ADMIN";


  /* ------------------------------------------------------------------------ */
  /* Mutations                                                                */
  /* ------------------------------------------------------------------------ */

  const createCenterMutation = useCreateCenter();

  const updateCenterMutation = useUpdateCenter();

  const updateCenterStatusMutation = useUpdateCenterStatus();

  /* ------------------------------------------------------------------------ */
  /* Derived data                                                             */
  /* ------------------------------------------------------------------------ */

  const centers =
    centersQuery.data?.data.data ?? [];

  const pagination =
    centersQuery.data?.data.pagination;

  /* ------------------------------------------------------------------------ */
  /* Filter handlers                                                          */
  /* ------------------------------------------------------------------------ */

  const handleFiltersChange = (
    nextFilters: CenterFiltersState,
  ) => {
    setFilters(nextFilters);
    setPage(1);
  };

  /* ------------------------------------------------------------------------ */
  /* Center form handlers                                                     */
  /* ------------------------------------------------------------------------ */

  const handleCreate = () => {
    setServerError(null);
    setEditingCenter(null);
    setFormOpen(true);
  };

  const handleEdit = (center: Center) => {
    setServerError(null);
    setEditingCenter(center);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    if (
      createCenterMutation.isPending ||
      updateCenterMutation.isPending
    ) {
      return;
    }

    setFormOpen(false);
    setEditingCenter(null);
    setServerError(null);
  };

  const handleSubmit = async (
    values: CreateCenterInput | UpdateCenterInput,
  ) => {
    setServerError(null);

    try {
      if (editingCenter) {
        await updateCenterMutation.mutateAsync({
          centerId: editingCenter.id,
          payload: values,
        });
      } else {
        await createCenterMutation.mutateAsync(
          values as CreateCenterInput,
        );
      }

      setFormOpen(false);
      setEditingCenter(null);
      setPage(1);
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Status confirmation                                                      */
  /* ------------------------------------------------------------------------ */

  const handleToggleStatus = (center: Center) => {
    setServerError(null);

    setStatusDialog({
      center,
      nextStatus: !center.isActive,
    });
  };

  const handleCloseStatusDialog = () => {
    if (
      updateCenterStatusMutation.isPending
    ) {
      return;
    }

    setStatusDialog(null);
  };

  const handleConfirmStatusChange = async () => {
    if (!statusDialog) {
      return;
    }

    setServerError(null);

    try {
      await updateCenterStatusMutation.mutateAsync({
        centerId: statusDialog.center.id,
        payload: {
          isActive: statusDialog.nextStatus,
        },
      });

      setStatusDialog(null);
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Loading state                                                            */
  /* ------------------------------------------------------------------------ */

  const isInitialLoading =
    centersQuery.isLoading;

  /* ------------------------------------------------------------------------ */
  /* Mutation state                                                           */
  /* ------------------------------------------------------------------------ */

  const isFormSubmitting =
    createCenterMutation.isPending ||
    updateCenterMutation.isPending;

  const isActivating =
    statusDialog?.nextStatus === true;

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                        */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-400">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            Centers
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Manage service centers, their status, and
            center identification codes.
          </p>
        </div>


        {isAdmin && (
        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          + Create center
        </button>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Global server error                                                */}
      {/* ------------------------------------------------------------------ */}

      {serverError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          <p>{serverError}</p>

          <button
            type="button"
            onClick={() => setServerError(null)}
            className="shrink-0 text-red-400 transition hover:text-red-300"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Filters                                                            */}
      {/* ------------------------------------------------------------------ */}

      <CenterFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Query error                                                        */}
      {/* ------------------------------------------------------------------ */}

      {centersQuery.isError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <p>
            {getErrorMessage(centersQuery.error)}
          </p>

          <button
            type="button"
            onClick={() => centersQuery.refetch()}
            className="mt-2 font-medium text-red-300 underline underline-offset-2 hover:text-red-200"
          >
            Try again
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Results                                                            */}
      {/* ------------------------------------------------------------------ */}

      <CenterList
        centers={centers}
        isLoading={isInitialLoading}
        onEdit={isAdmin ? handleEdit:undefined}
        onToggleStatus={
          isAdmin? handleToggleStatus : undefined}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Pagination                                                         */}
      {/* ------------------------------------------------------------------ */}

      {pagination &&
        pagination.totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing page {pagination.page} of{" "}
              {pagination.totalPages}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={
                  page === 1 ||
                  centersQuery.isFetching
                }
                onClick={() =>
                  setPage(
                    (currentPage) =>
                      currentPage - 1,
                  )
                }
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={
                  page >= pagination.totalPages ||
                  centersQuery.isFetching
                }
                onClick={() =>
                  setPage(
                    (currentPage) =>
                      currentPage + 1,
                  )
                }
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

      {/* ------------------------------------------------------------------ */}
      {/* Create / Edit dialog                                               */}
      {/* ------------------------------------------------------------------ */}
      {isAdmin && (
      <CenterFormDialog
        open={formOpen}
        center={editingCenter}
        isSubmitting={isFormSubmitting}
        serverError={serverError}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
      />
  )}

      {/* ------------------------------------------------------------------ */}
      {/* Activate / Deactivate confirmation                                 */}
      {/* ------------------------------------------------------------------ */}

      <ConfirmationDialog
        open={Boolean(statusDialog)}
        title={
          isActivating
            ? "Activate center?"
            : "Deactivate center?"
        }
        description={
          isActivating ? (
            <>
              You are about to activate{" "}
              <span className="font-medium text-white">
                {statusDialog?.center.name}
              </span>{" "}
              ({statusDialog?.center.code}).
              <p className="mt-3">
                This will make the center available
                for active business operations.
              </p>
            </>
          ) : (
            <>
              You are about to deactivate{" "}
              <span className="font-medium text-white">
                {statusDialog?.center.name}
              </span>{" "}
              ({statusDialog?.center.code}).
              <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-amber-300">
                Deactivating the center prevents it
                from being used for new business
                operations. Existing users, labs,
                tickets, and historical relationships
                remain intact.
              </div>
            </>
          )
        }
        confirmLabel={
          isActivating
            ? "Activate center"
            : "Deactivate center"
        }
        loadingLabel={
          isActivating
            ? "Activating..."
            : "Deactivating..."
        }
        isLoading={
          updateCenterStatusMutation.isPending
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
        onCancel={handleCloseStatusDialog}
        onConfirm={handleConfirmStatusChange}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Error helper                                                               */
/* -------------------------------------------------------------------------- */

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}