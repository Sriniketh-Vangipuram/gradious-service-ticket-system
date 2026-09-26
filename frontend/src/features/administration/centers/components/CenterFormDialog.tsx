import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import type {
  Center,
  CreateCenterInput,
  UpdateCenterInput,
} from "../types/center.types";

const centerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Center name must be at least 2 characters")
    .max(100, "Center name cannot exceed 100 characters"),

  code: z
    .string()
    .trim()
    .min(2, "Center code must be at least 2 characters")
    .max(30, "Center code cannot exceed 30 characters")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Center code can contain only letters, numbers, hyphens and underscores",
    ),
});

type CenterFormValues = z.infer<typeof centerFormSchema>;

type CenterFormDialogProps = {
  open: boolean;
  center?: Center | null;
  isSubmitting?: boolean;
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (
    values: CreateCenterInput | UpdateCenterInput,
  ) => void;
};

export function CenterFormDialog({
  open,
  center,
  isSubmitting = false,
  serverError,
  onClose,
  onSubmit,
}: CenterFormDialogProps) {
  const isEditMode = Boolean(center);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CenterFormValues>({
    resolver: zodResolver(centerFormSchema),
    defaultValues: {
      name: "",
      code: "",
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      name: center?.name ?? "",
      code: center?.code ?? "",
    });
  }, [open, center, reset]);

  if (!open) {
    return null;
  }

  const submitHandler = (values: CenterFormValues) => {
    onSubmit({
      name: values.name.trim(),
      code: values.code.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="center-dialog-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5">
          <div>
            <h2
              id="center-dialog-title"
              className="text-lg font-semibold text-white"
            >
              {isEditMode ? "Edit center" : "Create center"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isEditMode
                ? "Update the center information below."
                : "Add a new service center to the system."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(submitHandler)}
          className="space-y-5 px-6 py-6"
        >
          {/* Server error */}
          {serverError && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              {serverError}
            </div>
          )}

          {/* Name */}
          <div>
            <label
              htmlFor="center-name"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Center name
            </label>

            <input
              id="center-name"
              type="text"
              autoComplete="off"
              placeholder="e.g. Hyderabad Central"
              {...register("name")}
              disabled={isSubmitting}
              className={[
                "w-full rounded-lg border bg-slate-950 px-3 py-2.5 text-sm text-white",
                "outline-none transition placeholder:text-slate-600",
                "focus:ring-1",
                errors.name
                  ? "border-red-500/60 focus:border-red-500 focus:ring-red-500"
                  : "border-slate-700 focus:border-indigo-500 focus:ring-indigo-500",
              ].join(" ")}
            />

            {errors.name && (
              <p className="mt-1.5 text-xs text-red-400">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Code */}
          <div>
            <label
              htmlFor="center-code"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Center code
            </label>

            <input
              id="center-code"
              type="text"
              autoComplete="off"
              placeholder="e.g. HYD-01"
              {...register("code")}
              disabled={isSubmitting}
              className={[
                "w-full rounded-lg border bg-slate-950 px-3 py-2.5 text-sm text-white",
                "font-mono uppercase outline-none transition placeholder:font-sans placeholder:text-slate-600",
                "focus:ring-1",
                errors.code
                  ? "border-red-500/60 focus:border-red-500 focus:ring-red-500"
                  : "border-slate-700 focus:border-indigo-500 focus:ring-indigo-500",
              ].join(" ")}
            />

            {errors.code && (
              <p className="mt-1.5 text-xs text-red-400">
                {errors.code.message}
              </p>
            )}

            <p className="mt-1.5 text-xs text-slate-600">
              Use letters, numbers, hyphens or underscores.
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                  ? "Save changes"
                  : "Create center"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}