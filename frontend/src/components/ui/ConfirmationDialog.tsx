import type { ReactNode } from "react";
import { X } from "lucide-react";

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;

  confirmLabel?: string;
  cancelLabel?: string;

  isLoading?: boolean;
  loadingLabel?: string;

  variant?: "danger" | "warning" | "primary";

  icon?: ReactNode;

  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
  loadingLabel = "Processing...",
  variant = "primary",
  icon,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  if (!open) {
    return null;
  }

  const confirmButtonClassName =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-500 focus:ring-red-500/50"
      : variant === "warning"
        ? "bg-amber-600 hover:bg-amber-500 focus:ring-amber-500/50"
        : "bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500/50";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        {/* ---------------------------------------------------------------- */}
        {/* Close button                                                     */}
        {/* ---------------------------------------------------------------- */}

        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          aria-label="Close confirmation dialog"
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X
            className="h-5 w-5"
            aria-hidden="true"
          />
        </button>

        {/* ---------------------------------------------------------------- */}
        {/* Icon                                                             */}
        {/* ---------------------------------------------------------------- */}

        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
            {icon}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Content                                                          */}
        {/* ---------------------------------------------------------------- */}

        <div className={icon ? "mt-5" : "pr-8"}>
          <h2
            id="confirmation-dialog-title"
            className="text-lg font-semibold text-white"
          >
            {title}
          </h2>

          <div
            id="confirmation-dialog-description"
            className="mt-2 text-sm leading-6 text-slate-400"
          >
            {description}
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Actions                                                          */}
        {/* ---------------------------------------------------------------- */}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${confirmButtonClassName}`}
          >
            {isLoading
              ? loadingLabel
              : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}