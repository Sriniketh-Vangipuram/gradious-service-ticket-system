import { useState } from "react";
import { X } from "lucide-react";

import type {
  AdministrationUser,
  TechnicianSpecialization,
} from "../types/user.types";

interface UserSpecializationDialogProps {
  user: AdministrationUser | null;
  onClose: () => void;
  onSave: (
    specializations: TechnicianSpecialization[],
  ) => void;
  isSaving?: boolean;
}

const SPECIALIZATION_OPTIONS: Array<{
  value: TechnicianSpecialization;
  label: string;
  description: string;
}> = [
  {
    value: "SOFTWARE",
    label: "Software",
    description:
      "Software installation, updates, configuration, and licensing.",
  },
  {
    value: "HARDWARE",
    label: "Hardware",
    description:
      "Hardware diagnostics, peripherals, and workstation issues.",
  },
  {
    value: "NETWORK",
    label: "Network",
    description:
      "Connectivity, network configuration, and infrastructure issues.",
  },
];

export function UserSpecializationDialog({
  user,
  onClose,
  onSave,
  isSaving = false,
}: UserSpecializationDialogProps) {
   

    const [selected, setSelected] = useState<
        TechnicianSpecialization[]
        >(() =>
        user?.specializations.map(
            ({ specialization }) => specialization,
        ) ?? [],
    );

  if (!user) {
    return null;
  }

  function toggleSpecialization(
    specialization: TechnicianSpecialization,
  ) {
    setSelected((current) =>
      current.includes(specialization)
        ? current.filter(
            (item) => item !== specialization,
          )
        : [...current, specialization],
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="specialization-dialog-title"
        className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="specialization-dialog-title"
              className="text-lg font-semibold text-white"
            >
              Manage specializations
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Assign technical areas to{" "}
              <span className="font-medium text-slate-200">
                {user.fullName}
              </span>
              .
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close dialog"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {SPECIALIZATION_OPTIONS.map((option) => {
            const checked = selected.includes(
              option.value,
            );

            return (
              <label
                key={option.value}
                className={`block cursor-pointer rounded-xl border p-4 transition ${
                  checked
                    ? "border-slate-600 bg-slate-900"
                    : "border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      toggleSpecialization(
                        option.value,
                      )
                    }
                    disabled={isSaving}
                    className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900"
                  />

                  <div>
                    <p className="text-sm font-medium text-white">
                      {option.label}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {option.description}
                    </p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
          <p className="text-xs text-slate-500">
            A technician can have multiple specializations.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => onSave(selected)}
              disabled={isSaving}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}