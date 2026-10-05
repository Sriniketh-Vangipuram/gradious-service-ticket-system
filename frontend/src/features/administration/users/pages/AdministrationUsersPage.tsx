import { useMemo, useState } from "react";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import { UserFilters } from "../components/UserFilters";
import { UserList } from "../components/UserList";
import { CreateUserDialog } from "../components/CreateUserDialog";
import { EditUserDialog } from "../components/EditUserDialog";
import { UserSpecializationDialog } from "../components/UserSpecializationDialog";
import { UserStatusConfirmationDialog } from "../components/UserStatusConfirmationDialog";

import type {
  CreateUserRequest,
  ListUsersParams,
} from "../api/userService";

import {
  useCreateUser,
  useUpdateUserPrimaryCenter,
  useUpdateUserProfile,
  useUpdateUserSpecializations,
  useUpdateUserStatus,
  useUpdateUserLab,
} from "../hooks/useUserMutations";

import { useUsers } from "../hooks/useUsers";

import type { AdministrationUser } from "../types/user.types";

export default function AdministrationUsersPage() {
  /* ---------------------------------------------------------------------- */
  /* Filters                                                                */
  /* ---------------------------------------------------------------------- */

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

  /* ---------------------------------------------------------------------- */
  /* User query                                                             */
  /* ---------------------------------------------------------------------- */

  const usersQuery = useUsers(queryParams);

  const users = useMemo(
    () =>
      usersQuery.data?.pages.flatMap(
        (page) => page.data,
      ) ?? [],
    [usersQuery.data],
  );

  /* ---------------------------------------------------------------------- */
  /* Create user                                                            */
  /* ---------------------------------------------------------------------- */

  const [
    isCreateUserOpen,
    setIsCreateUserOpen,
  ] = useState(false);

  const createUserMutation =
    useCreateUser();

  /* ---------------------------------------------------------------------- */
  /* Edit user                                                              */
  /* ---------------------------------------------------------------------- */

  const [
    selectedUser,
    setSelectedUser,
  ] = useState<AdministrationUser | null>(
    null,
  );

  const updateProfileMutation =
    useUpdateUserProfile();

  const updatePrimaryCenterMutation =
    useUpdateUserPrimaryCenter();

  const updateLabMutation =
    useUpdateUserLab();

  /* ---------------------------------------------------------------------- */
  /* User status                                                             */
  /* ---------------------------------------------------------------------- */

  const [
    statusDialogUser,
    setStatusDialogUser,
  ] = useState<AdministrationUser | null>(
    null,
  );

  const updateStatusMutation =
    useUpdateUserStatus();

  /* ---------------------------------------------------------------------- */
  /* Technician specializations                                             */
  /* ---------------------------------------------------------------------- */

  const [
    selectedTechnician,
    setSelectedTechnician,
  ] = useState<AdministrationUser | null>(
    null,
  );

  const updateSpecializationsMutation =
    useUpdateUserSpecializations();

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <section className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-white">
            User Management
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Manage users, roles, center access, lab
            assignments, and technician specializations.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setIsCreateUserOpen(true)
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
        >
          <Plus size={17} />

          Create user
        </button>
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
            onClick={() =>
              usersQuery.refetch()
            }
            className="mt-4 rounded-lg border border-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Users                                                               */}
      {/* ------------------------------------------------------------------ */}

      {!usersQuery.isLoading &&
        !usersQuery.isError && (
          <>
            <UserList
              users={users}
              onManageSpecializations={(
                user,
              ) => {
                setSelectedTechnician(user);
              }}
              onEdit={(user) => {
                setSelectedUser(user);
              }}
              onToggleStatus={(user) => {
                setStatusDialogUser(user);
              }}
            />

            {usersQuery.hasNextPage && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    usersQuery.fetchNextPage()
                  }
                  disabled={
                    usersQuery.isFetchingNextPage
                  }
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

      {/* ------------------------------------------------------------------ */}
      {/* Create user dialog                                                  */}
      {/* ------------------------------------------------------------------ */}

      <CreateUserDialog
        isOpen={isCreateUserOpen}
        onClose={() => {
          if (
            !createUserMutation.isPending
          ) {
            setIsCreateUserOpen(false);
          }
        }}
        onSave={(
          payload: CreateUserRequest,
        ) => {
          createUserMutation.mutate(
            payload,
            {
              onSuccess: () => {
                toast.success(
                  "User created successfully.",
                );

                setIsCreateUserOpen(false);
              },

              onError: (error) => {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Failed to create user.",
                );
              },
            },
          );
        }}
        isSaving={
          createUserMutation.isPending
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* Edit user dialog                                                    */}
      {/* ------------------------------------------------------------------ */}

      <EditUserDialog
        key={selectedUser?.id}
        user={selectedUser}
        onClose={() => {
          if (
            !updateProfileMutation.isPending &&
            !updatePrimaryCenterMutation.isPending &&
            !updateLabMutation.isPending
          ) {
            setSelectedUser(null);
          }
        }}
        onSave={async ({
          fullName,
          email,
          primaryCenterId,
          labId,
        }) => {
          if (!selectedUser) {
            return;
          }

          try {
            await updateProfileMutation.mutateAsync(
              {
                userId: selectedUser.id,
                payload: {
                  fullName,
                  email,
                },
              },
            );

            if (
              selectedUser.center?.id !==
              primaryCenterId
            ) {
              await updatePrimaryCenterMutation.mutateAsync(
                {
                  userId: selectedUser.id,
                  payload: {
                    centerId:
                      primaryCenterId,
                  },
                },
              );
            }

            if (
              (
                selectedUser.role === "EMPLOYEE" ||
                selectedUser.role === "TECHNICIAN"
              ) &&
              labId !== undefined
            ) {
              await updateLabMutation.mutateAsync({
                userId: selectedUser.id,
                payload: {
                  labId,
                },
              });
            }

            toast.success(
              "User updated successfully.",
            );

            setSelectedUser(null);
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to update user.",
            );
          }
        }}
        isSaving={
          updateProfileMutation.isPending ||
          updatePrimaryCenterMutation.isPending ||
          updateLabMutation.isPending
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* User status confirmation                                            */}
      {/* ------------------------------------------------------------------ */}

      <UserStatusConfirmationDialog
        user={statusDialogUser}
        onClose={() => {
          if (
            !updateStatusMutation.isPending
          ) {
            setStatusDialogUser(null);
          }
        }}
        onConfirm={() => {
          if (!statusDialogUser) {
            return;
          }

          const nextStatus =
            !statusDialogUser.isActive;

          updateStatusMutation.mutate(
            {
              userId:
                statusDialogUser.id,
              payload: {
                isActive: nextStatus,
              },
            },
            {
              onSuccess: () => {
                toast.success(
                  nextStatus
                    ? "User reactivated successfully."
                    : "User deactivated successfully.",
                );

                setStatusDialogUser(null);
              },

              onError: (error) => {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Failed to update user status.",
                );
              },
            },
          );
        }}
        isLoading={
          updateStatusMutation.isPending
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* Technician specialization dialog                                   */}
      {/* ------------------------------------------------------------------ */}

      <UserSpecializationDialog
        key={selectedTechnician?.id}
        user={selectedTechnician}
        onClose={() =>
          setSelectedTechnician(null)
        }
        onSave={(specializations) => {
          if (!selectedTechnician) {
            return;
          }

          updateSpecializationsMutation.mutate(
            {
              userId:
                selectedTechnician.id,
              specializations,
            },
            {
              onSuccess: () => {
                toast.success(
                  "Technician specializations updated.",
                );

                setSelectedTechnician(null);
              },

              onError: (error) => {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Failed to update technician specializations.",
                );
              },
            },
          );
        }}
        isSaving={
          updateSpecializationsMutation.isPending
        }
      />
    </section>
  );
}