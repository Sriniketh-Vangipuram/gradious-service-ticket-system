import { useState } from "react";
import { X } from "lucide-react";

import type { AdministrationUser } from "../types/user.types";
import type { UpdateUserProfileRequest } from "../api/userService";
import { useCenters } from "../../centers/hooks/useCenters";
import { useLabs } from "../../labs/hooks/useLabs";

interface EditUserDialogProps {
  user: AdministrationUser | null;
  onClose: () => void;
  onSave: (
    payload: UpdateUserProfileRequest & {
      primaryCenterId: number;
      labId?: number;
    },
  ) => void;
  isSaving: boolean;
}

export function EditUserDialog({
  user,
  onClose,
  onSave,
  isSaving,
}: EditUserDialogProps) {
  const [fullName, setFullName] = useState(
    user?.fullName ?? "",
  );

  const [email, setEmail] = useState(
    user?.email ?? "",
  );

  const [primaryCenterId, setPrimaryCenterId] =
    useState<number | undefined>(
      user?.center?.id,
    );

  const [labId, setLabId] =
    useState<number | undefined>(
      user?.lab?.id,
    );

  const centersQuery = useCenters();

  const centers =
    centersQuery.data?.data?.data ?? [];

  const labsQuery = useLabs(
    primaryCenterId !== undefined
      ? {
          centerId: primaryCenterId,
          isActive: true,
          page: 1,
          limit: 100,
        }
      : undefined,
  );

  const labs =
    labsQuery.data?.data?.data ?? [];

  if (!user) {
    return null;
  }

  const isLabAssignable =
    user.role === "EMPLOYEE" ||
    user.role === "TECHNICIAN";

  const selectedLabBelongsToCenter =
    labId !== undefined &&
    labs.some((lab) => lab.id === labId);

  const effectiveLabId =
    selectedLabBelongsToCenter
      ? labId
      : undefined;

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (primaryCenterId === undefined) {
      return;
    }

    onSave({
      fullName: fullName.trim(),
      email: email.trim(),
      primaryCenterId,
      labId: isLabAssignable
        ? effectiveLabId
        : undefined,
    });
  }

  function handleCenterChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const nextCenterId = event.target.value
      ? Number(event.target.value)
      : undefined;

    setPrimaryCenterId(nextCenterId);

    /*
     * A lab belongs to exactly one center.
     * When the center changes, the previously
     * selected lab must no longer be submitted.
     */
    setLabId(undefined);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
              User Management
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Edit user
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Update profile, primary center and lab assignment.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          {/* Full name */}
          <div>
            <label
              htmlFor="edit-user-name"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Full name
            </label>

            <input
              id="edit-user-name"
              value={fullName}
              onChange={(event) =>
                setFullName(event.target.value)
              }
              required
              minLength={2}
              maxLength={120}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="edit-user-email"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Email
            </label>

            <input
              id="edit-user-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
              maxLength={255}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500"
            />
          </div>

          {/* Role */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Role
            </label>

            <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-300">
              {user.role === "CENTER_MANAGER"
                ? "Center Manager"
                : user.role === "TECHNICIAN"
                  ? "Technician"
                  : user.role === "EMPLOYEE"
                    ? "Employee"
                    : "Administrator"}
            </div>
          </div>

          {/* Primary center */}
          <div>
            <label
              htmlFor="edit-user-center"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Primary center
            </label>

            <select
              id="edit-user-center"
              value={primaryCenterId ?? ""}
              onChange={handleCenterChange}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="" disabled>
                Select primary center
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

            <p className="mt-1.5 text-xs text-slate-500">
              Changing the primary center will also authorize
              the user for that center.
            </p>
          </div>

          {/* Lab */}
          {isLabAssignable && (
            <div>
              <label
                htmlFor="edit-user-lab"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Assigned lab
              </label>

              <select
                id="edit-user-lab"
                value={effectiveLabId ?? ""}
                onChange={(event) =>
                  setLabId(
                    event.target.value
                      ? Number(event.target.value)
                      : undefined,
                  )
                }
                disabled={
                  primaryCenterId === undefined ||
                  labsQuery.isLoading ||
                  labsQuery.isError
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {primaryCenterId === undefined
                    ? "Select a center first"
                    : labsQuery.isLoading
                      ? "Loading labs..."
                      : labsQuery.isError
                        ? "Unable to load labs"
                        : "Select lab"}
                </option>

                {labs.map((lab) => (
                  <option
                    key={lab.id}
                    value={lab.id}
                  >
                    {lab.name} ({lab.code})
                  </option>
                ))}
              </select>

              <p className="mt-1.5 text-xs text-slate-500">
                Only active labs belonging to the selected
                primary center are available.
              </p>

              {labsQuery.isError && (
                <p className="mt-1.5 text-xs text-red-400">
                  Failed to load labs for this center.
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSaving ||
                fullName.trim().length < 2 ||
                email.trim().length === 0 ||
                primaryCenterId === undefined ||
                (isLabAssignable &&
                  effectiveLabId === undefined)
              }
              className="rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving
                ? "Saving..."
                : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}