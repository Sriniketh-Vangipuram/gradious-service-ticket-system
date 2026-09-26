import { useState } from "react";
import { X } from "lucide-react";

import type { AdministrationUser } from "../types/user.types";
import type { UpdateUserProfileRequest } from "../api/userService";
import { useCenters } from "../../centers/hooks/useCenters";

interface EditUserDialogProps {
  user: AdministrationUser | null;
  onClose: () => void;
  onSave: (
    payload: UpdateUserProfileRequest & {
      primaryCenterId: number;
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

  const centersQuery = useCenters();

  const centers = centersQuery.data?.data?.data ?? [];

  if (!user) {
    return null;
  }

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
    });
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
              Update profile and primary center assignment.
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
                value={primaryCenterId ?? ""}
                onChange={(event) =>
                  setPrimaryCenterId(
                    event.target.value
                      ? Number(event.target.value)
                      : undefined,
                  )
                }
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
                primaryCenterId === undefined
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