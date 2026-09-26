import { useState } from "react";
import { X } from "lucide-react";

import type { AdministrationUser } from "../types/user.types";
import type { CreateUserRequest } from "../api/userService";

import { useCenters } from "../../centers/hooks/useCenters";

interface CreateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateUserRequest) => void;
  isSaving: boolean;
}

const ROLE_OPTIONS: Array<{
  value: AdministrationUser["role"];
  label: string;
}> = [
  {
    value: "EMPLOYEE",
    label: "Employee",
  },
  {
    value: "TECHNICIAN",
    label: "Technician",
  },
  {
    value: "CENTER_MANAGER",
    label: "Center Manager",
  },
  {
    value: "ADMIN",
    label: "Administrator",
  },
];

export function CreateUserDialog({
  isOpen,
  onClose,
  onSave,
  isSaving,
}: CreateUserDialogProps) {
  const [form, setForm] = useState<CreateUserRequest>({
    fullName: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
  });

  const centersQuery = useCenters();

  /*
   * useCenters() returns:
   *
   * {
   *   data: Center[],
   *   pagination: {...}
   * }
   *
   * Therefore:
   * centersQuery.data = API response
   * centersQuery.data.data = Center[]
   */
  const centers = centersQuery.data?.data.data ?? [];

  const requiresPrimaryCenter =
    form.role === "TECHNICIAN" ||
    form.role === "CENTER_MANAGER";

  function updateField<K extends keyof CreateUserRequest>(
    key: K,
    value: CreateUserRequest[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  /*
   * Role changes are handled directly here rather than
   * using useEffect + setState.
   *
   * This avoids the React hooks set-state-in-effect
   * lint error.
   */
  function handleRoleChange(
    role: AdministrationUser["role"],
  ) {
    setForm((current) => ({
      ...current,
      role,

      /*
       * Only Technician and Center Manager support
       * primary center assignment.
       *
       * If Admin/Employee is selected, clear the
       * previously selected center.
       */
      primaryCenterId:
        role === "TECHNICIAN" ||
        role === "CENTER_MANAGER"
          ? current.primaryCenterId
          : undefined,
    }));
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    /*
     * Frontend guard.
     *
     * Backend also validates this, so this is only
     * a UX-level validation.
     */
    if (
      requiresPrimaryCenter &&
      form.primaryCenterId === undefined
    ) {
      return;
    }

    const payload: CreateUserRequest = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,

      /*
       * Only send primaryCenterId for roles that support it.
       */
      ...(requiresPrimaryCenter &&
      form.primaryCenterId !== undefined
        ? {
            primaryCenterId: form.primaryCenterId,
          }
        : {}),
    };

    onSave(payload);
  }

  if (!isOpen) {
    return null;
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
              Create user
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Create an account and assign its system role.
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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          {/* Full Name */}
          <div>
            <label
              htmlFor="create-user-name"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Full name
            </label>

            <input
              id="create-user-name"
              value={form.fullName}
              onChange={(event) =>
                updateField(
                  "fullName",
                  event.target.value,
                )
              }
              required
              minLength={2}
              maxLength={120}
              placeholder="Enter full name"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="create-user-email"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Email
            </label>

            <input
              id="create-user-email"
              type="email"
              value={form.email}
              onChange={(event) =>
                updateField(
                  "email",
                  event.target.value,
                )
              }
              required
              placeholder="user@example.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500"
            />
          </div>

          {/* Temporary Password */}
          <div>
            <label
              htmlFor="create-user-password"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Temporary password
            </label>

            <input
              id="create-user-password"
              type="password"
              value={form.password}
              onChange={(event) =>
                updateField(
                  "password",
                  event.target.value,
                )
              }
              required
              minLength={8}
              maxLength={128}
              placeholder="Minimum 8 characters"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500"
            />
          </div>

          {/* Role */}
          <div>
            <label
              htmlFor="create-user-role"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Role
            </label>

            <select
              id="create-user-role"
              value={form.role}
              onChange={(event) =>
                handleRoleChange(
                  event.target
                    .value as AdministrationUser["role"],
                )
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
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

          {/* Primary Center */}
          {requiresPrimaryCenter && (
            <div>
              <label
                htmlFor="create-user-center"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Primary center
              </label>

              <select
                id="create-user-center"
                value={form.primaryCenterId ?? ""}
                onChange={(event) =>
                  updateField(
                    "primaryCenterId",
                    event.target.value
                      ? Number(event.target.value)
                      : undefined,
                  )
                }
                required
                disabled={
                  centersQuery.isLoading ||
                  centersQuery.isError
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {centersQuery.isLoading
                    ? "Loading centers..."
                    : centersQuery.isError
                      ? "Unable to load centers"
                      : "Select primary center"}
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
                This center will become the user's primary
                center and authorized center.
              </p>

              {centersQuery.isError && (
                <p className="mt-2 text-xs text-red-400">
                  Failed to load centers. Please try again.
                </p>
              )}
            </div>
          )}

          {/* Role-specific information */}
          {requiresPrimaryCenter && (
            <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
              <p className="text-xs leading-5 text-slate-400">
                {form.role === "CENTER_MANAGER"
                  ? "Center managers must be assigned to a primary center. They will initially be authorized for this center."
                  : "Technicians must be assigned to a primary center. They will initially be authorized for this center."}
              </p>
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
                (requiresPrimaryCenter &&
                  form.primaryCenterId === undefined)
              }
              className="rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving
                ? "Creating..."
                : "Create user"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}