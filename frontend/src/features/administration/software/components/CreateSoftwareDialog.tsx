import { useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  useForm,
  type SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useSoftwareMutations } from "../hooks/useSoftwareMutations";

interface CreateSoftwareDialogProps {
  open: boolean;
  onClose: () => void;
}

const createSoftwareSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Software name must be at least 2 characters.")
    .max(150, "Software name cannot exceed 150 characters."),

  vendor: z
    .string()
    .trim()
    .max(120, "Vendor cannot exceed 120 characters."),

  version: z
    .string()
    .trim()
    .max(60, "Version cannot exceed 60 characters."),

  licenseRequired: z.boolean(),
});

type CreateSoftwareFormValues = z.infer<
  typeof createSoftwareSchema
>;

export function CreateSoftwareDialog({
  open,
  onClose,
}: CreateSoftwareDialogProps) {
  const {
    createSoftwareMutation,
  } = useSoftwareMutations();

  const {
    reset: resetCreateSoftwareMutation,
  } = createSoftwareMutation;

  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<CreateSoftwareFormValues>({
    resolver: zodResolver(
      createSoftwareSchema,
    ),
    defaultValues: {
      name: "",
      vendor: "",
      version: "",
      licenseRequired: false,
    },
  });

  useEffect(() => {
    if (!open) {
      reset();
      resetCreateSoftwareMutation();
    }
  }, [
    open,
    reset,
    resetCreateSoftwareMutation,
  ]);

  if (!open) {
    return null;
  }

  const onSubmit: SubmitHandler<
    CreateSoftwareFormValues
  > = async (values) => {
    try {
      await createSoftwareMutation.mutateAsync({
        name: values.name.trim(),
        vendor:
          values.vendor.trim() || null,
        version:
          values.version.trim() || null,
        licenseRequired:
          values.licenseRequired,
      });

      onClose();
    } catch {
      // Mutation error is rendered below.
    }
  };

  const mutationError =
    createSoftwareMutation.error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-software-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2
              id="create-software-title"
              className="text-lg font-semibold text-white"
            >
              Add Software
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Add a software product to the service catalog.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={
              createSoftwareMutation.isPending ||
              isSubmitting
            }
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 p-6"
        >
          {/* Mutation error */}
          {mutationError && (
            <div className="flex gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

              <div>
                <p className="text-sm font-medium text-red-300">
                  Unable to create software
                </p>

                <p className="mt-1 text-sm text-red-400/90">
                  {mutationError instanceof Error
                    ? mutationError.message
                    : "Something went wrong. Please try again."}
                </p>
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label
              htmlFor="software-name"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Software Name
              <span className="ml-1 text-red-400">
                *
              </span>
            </label>

            <input
              id="software-name"
              type="text"
              autoFocus
              placeholder="e.g. Microsoft Office"
              {...register("name")}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />

            {errors.name && (
              <p className="mt-1.5 text-xs text-red-400">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Vendor */}
          <div>
            <label
              htmlFor="software-vendor"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Vendor
            </label>

            <input
              id="software-vendor"
              type="text"
              placeholder="e.g. Microsoft"
              {...register("vendor")}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />

            {errors.vendor && (
              <p className="mt-1.5 text-xs text-red-400">
                {errors.vendor.message}
              </p>
            )}
          </div>

          {/* Version */}
          <div>
            <label
              htmlFor="software-version"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Version
            </label>

            <input
              id="software-version"
              type="text"
              placeholder="e.g. 2024"
              {...register("version")}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />

            {errors.version && (
              <p className="mt-1.5 text-xs text-red-400">
                {errors.version.message}
              </p>
            )}
          </div>

          {/* License */}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-slate-700">
            <input
              type="checkbox"
              {...register("licenseRequired")}
              className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />

            <span>
              <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                License required
              </span>

              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Mark this software as requiring a valid license for installation.
              </span>
            </span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={
                createSoftwareMutation.isPending ||
                isSubmitting
              }
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                createSoftwareMutation.isPending ||
                isSubmitting
              }
              className="rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createSoftwareMutation.isPending ||
              isSubmitting
                ? "Creating..."
                : "Create Software"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}