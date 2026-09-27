import { useEffect } from "react";
import { AlertCircle, X } from "lucide-react";
import {
  useForm,
  type SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useSoftwareMutations } from "../hooks/useSoftwareMutations";
import type { Software } from "../types/software.types";

interface EditSoftwareDialogProps {
  open: boolean;
  software: Software | null;
  onClose: () => void;
}

const editSoftwareSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      2,
      "Software name must be at least 2 characters.",
    )
    .max(
      150,
      "Software name cannot exceed 150 characters.",
    ),

  vendor: z
    .string()
    .trim()
    .max(
      120,
      "Vendor cannot exceed 120 characters.",
    ),

  version: z
    .string()
    .trim()
    .max(
      60,
      "Version cannot exceed 60 characters.",
    ),

  licenseRequired: z.boolean(),
});

type EditSoftwareFormValues = z.infer<
  typeof editSoftwareSchema
>;

export function EditSoftwareDialog({
  open,
  software,
  onClose,
}: EditSoftwareDialogProps) {
  const {
    updateSoftwareMutation,
  } = useSoftwareMutations();

  const {
    reset: resetUpdateSoftwareMutation,
  } = updateSoftwareMutation;

  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<EditSoftwareFormValues>({
    resolver: zodResolver(editSoftwareSchema),
    defaultValues: {
      name: "",
      vendor: "",
      version: "",
      licenseRequired: false,
    },
  });

  useEffect(() => {
    if (!open || !software) {
      return;
    }

    reset({
      name: software.name,
      vendor: software.vendor ?? "",
      version: software.version ?? "",
      licenseRequired:
        software.licenseRequired,
    });

    resetUpdateSoftwareMutation();
  }, [
    open,
    software,
    reset,
    resetUpdateSoftwareMutation,
  ]);

  if (!open || !software) {
    return null;
  }

  const onSubmit: SubmitHandler<
    EditSoftwareFormValues
  > = async (values) => {
    try {
      await updateSoftwareMutation.mutateAsync({
        softwareId: software.id,
        payload: {
          name: values.name.trim(),
          vendor:
            values.vendor.trim() || null,
          version:
            values.version.trim() || null,
          licenseRequired:
            values.licenseRequired,
        },
      });

      onClose();
    } catch {
      // Mutation error is rendered below.
    }
  };

  const mutationError =
    updateSoftwareMutation.error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-software-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2
              id="edit-software-title"
              className="text-lg font-semibold text-white"
            >
              Edit Software
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Update the software catalog information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={
              updateSoftwareMutation.isPending ||
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
                  Unable to update software
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
              htmlFor="edit-software-name"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Software Name
              <span className="ml-1 text-red-400">
                *
              </span>
            </label>

            <input
              id="edit-software-name"
              type="text"
              autoFocus
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
              htmlFor="edit-software-vendor"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Vendor
            </label>

            <input
              id="edit-software-vendor"
              type="text"
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
              htmlFor="edit-software-version"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Version
            </label>

            <input
              id="edit-software-version"
              type="text"
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
              <span className="text-sm font-medium text-slate-200">
                License required
              </span>

              <span className="mt-1 block text-xs leading-5 text-slate-500">
                This software requires a valid license for installation.
              </span>
            </span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={
                updateSoftwareMutation.isPending ||
                isSubmitting
              }
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                updateSoftwareMutation.isPending ||
                isSubmitting
              }
              className="rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateSoftwareMutation.isPending ||
              isSubmitting
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}