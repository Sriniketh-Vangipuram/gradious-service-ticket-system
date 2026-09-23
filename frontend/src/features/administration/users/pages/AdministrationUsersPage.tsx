import { useMemo, useState } from "react";

import { UserFilters } from "../components/UserFilters";
import {
  type ListUsersParams,
} from "../api/userService";
import { useUsers } from "../hooks/useUsers";
import { UserList } from "../components/UserList";
import type { AdministrationUser } from "../types/user.types";
import { UserSpecializationDialog } from "../components/UserSpecializationDialog";
import { toast } from "sonner";
import { useUpdateUserSpecializations } from "../hooks/useUserMutations";

export default function AdministrationUsersPage() {
  const [filters, setFilters] = useState<
    Omit<ListUsersParams, "cursor" | "limit">
  >({});

  const queryParams = useMemo<ListUsersParams>(
    () => ({
      ...filters,
      limit: 20,
    }),
    [filters],
  );

  const [selectedTechnician, setSelectedTechnician] =
    useState<AdministrationUser | null>(null);

  const usersQuery = useUsers(queryParams);

  const updateSpecializationsMutation = useUpdateUserSpecializations();

  const users = useMemo(
    () =>
      usersQuery.data?.pages.flatMap(
        (page) => page.data,
      ) ?? [],
    [usersQuery.data],
  );

  return (
    <section className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div>
        <p className="text-sm font-medium text-slate-400">
          Administration
        </p>

        <h1 className="mt-1 text-2xl font-semibold text-white">
          User Management
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Manage users, roles, center access, lab assignments,
          and technician specializations.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Filters                                                            */}
      {/* ------------------------------------------------------------------ */}

      <UserFilters
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Loading                                                             */}
      {/* ------------------------------------------------------------------ */}

      {usersQuery.isLoading && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center text-sm text-slate-400">
          Loading users...
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Error                                                               */}
      {/* ------------------------------------------------------------------ */}

      {usersQuery.isError && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6">
          <p className="text-sm font-medium text-red-400">
            Failed to load users.
          </p>

          <p className="mt-1 text-sm text-slate-400">
            Please try again.
          </p>

          <button
            type="button"
            onClick={() => usersQuery.refetch()}
            className="mt-4 rounded-lg border border-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* User count                                                          */}
      {/* ------------------------------------------------------------------ */}

      {!usersQuery.isLoading && !usersQuery.isError && (
        <>
          <UserList
            users={users}
            onManageSpecializations={(user) => {
              setSelectedTechnician(user);
            }}
          />

          {usersQuery.hasNextPage && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => usersQuery.fetchNextPage()}
                disabled={usersQuery.isFetchingNextPage}
                className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {usersQuery.isFetchingNextPage
                  ? "Loading more..."
                  : "Load more users"}
              </button>
            </div>
          )}
        </>
      )}
      <UserSpecializationDialog
      key={selectedTechnician?.id}
      user={selectedTechnician}
      onClose={() => setSelectedTechnician(null)}
      onSave={(specializations) => {
        if (!selectedTechnician) {
          return;
        }

        updateSpecializationsMutation.mutate(
          {
            userId: selectedTechnician.id,
            specializations,
          },
          {
            onSuccess: () => {
              toast.success(
                "Technician specializations updated.",
              );

              setSelectedTechnician(null);
            },
            onError: () => {
              toast.error(
                "Failed to update technician specializations.",
              );
            },
          },
        );
      }}
      isSaving = {updateSpecializationsMutation.isPending}
    />
    </section>
  );
}