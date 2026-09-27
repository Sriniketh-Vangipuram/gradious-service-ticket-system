import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { z } from "zod";

import { useCenters } from "../../centers/hooks/useCenters";
import { useUpdateLab } from "../hooks/useLabMutations";

import type { Lab } from "../types/lab.types";

const editLabSchema = z.object({
  centerId: z
    .string()
    .min(1, "Center is required."),

  name: z
    .string()
    .trim()
    .min(
      2,
      "Lab name must be at least 2 characters.",
    )
    .max(
      120,
      "Lab name cannot exceed 120 characters.",
    ),

  code: z
    .string()
    .trim()
    .min(
      2,
      "Lab code must be at least 2 characters.",
    )
    .max(
      30,
      "Lab code cannot exceed 30 characters.",
    )
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Lab code can contain only letters, numbers, hyphens, and underscores.",
    ),
});

type EditLabFormValues = z.infer<
  typeof editLabSchema
>;

interface EditLabDialogProps {
  open: boolean;
  lab: Lab | null;
  onClose: () => void;
}

export default function EditLabDialog({
  open,
  lab,
  onClose,
}: EditLabDialogProps) {
  const updateLabMutation = useUpdateLab();

  const {
    reset: resetUpdateLabMutation,
  } = updateLabMutation;

  const centersQuery = useCenters({
    page: 1,
    limit: 100,
    isActive: true,
  });

  const centers =
    centersQuery.data?.data?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<EditLabFormValues>({
    resolver: zodResolver(
      editLabSchema,
    ),
    defaultValues: {
      centerId: "",
      name: "",
      code: "",
    },
  });

  /*
   * Populate the form whenever
   * the selected lab changes.
   */
  useEffect(() => {
    if (!open || !lab) {
      return;
    }

    reset({
      centerId: String(lab.centerId),
      name: lab.name,
      code: lab.code,
    });

    resetUpdateLabMutation();
  }, [
    open,
    lab,
    reset,
    resetUpdateLabMutation,
  ]);

  if (!open || !lab) {
    return null;
  }

  const onSubmit = async (
    values: EditLabFormValues,
  ) => {
    try {
      await updateLabMutation.mutateAsync({
        labId: lab.id,
        payload: {
          centerId: Number(
            values.centerId,
          ),
          name: values.name.trim(),
          code: values.code
            .trim()
            .toUpperCase(),
        },
      });

      reset();
      onClose();
    } catch {
      // Mutation error is displayed below.
    }
  };

  const isBusy =
    isSubmitting ||
    updateLabMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-lab-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2
              id="edit-lab-title"
              className="text-lg font-semibold text-white"
            >
              Edit Lab
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Update the lab details or move it
              to another center.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
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
          {/* Center */}
          <div>
            <label
              htmlFor="edit-lab-center"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Center
            </label>

            <select
              id="edit-lab-center"
              {...register("centerId")}
              disabled={
                isBusy ||
                centersQuery.isLoading
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 outline-none transition focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                Select center
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

            {errors.centerId && (
              <p className="mt-1.5 text-xs text-red-400">
                {errors.centerId.message}
              </p>
            )}

            {centersQuery.isError && (
              <p className="mt-1.5 text-xs text-red-400">
                Failed to load centers.
              </p>
            )}
          </div>

          {/* Lab name */}
          <div>
            <label
              htmlFor="edit-lab-name"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Lab Name
            </label>

            <input
              id="edit-lab-name"
              type="text"
              {...register("name")}
              disabled={isBusy}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            />

            {errors.name && (
              <p className="mt-1.5 text-xs text-red-400">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Lab code */}
          <div>
            <label
              htmlFor="edit-lab-code"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Lab Code
            </label>

            <input
              id="edit-lab-code"
              type="text"
              {...register("code")}
              disabled={isBusy}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm uppercase text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            />

            {errors.code && (
              <p className="mt-1.5 text-xs text-red-400">
                {errors.code.message}
              </p>
            )}

            <p className="mt-1.5 text-xs text-slate-600">
              Lab codes must be unique within
              their center.
            </p>
          </div>

          {/* Server error */}
          {updateLabMutation.isError && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              Failed to update lab. The lab code
              may already exist in this center.
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isBusy}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBusy
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}