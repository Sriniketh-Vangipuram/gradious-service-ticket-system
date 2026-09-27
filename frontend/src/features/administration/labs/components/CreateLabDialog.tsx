import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { z } from "zod";

import { useCenters } from "../../centers/hooks/useCenters";
import { useCreateLab } from "../hooks/useLabMutations";

const createLabSchema = z.object({
  centerId: z
    .string()
    .min(1, "Center is required."),

  name: z
    .string()
    .trim()
    .min(2, "Lab name must be at least 2 characters.")
    .max(120, "Lab name cannot exceed 120 characters."),

  code: z
    .string()
    .trim()
    .min(2, "Lab code must be at least 2 characters.")
    .max(30, "Lab code cannot exceed 30 characters.")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Lab code can contain only letters, numbers, hyphens, and underscores.",
    ),
});

type CreateLabFormValues = z.infer<
  typeof createLabSchema
>;

interface CreateLabDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateLabDialog({
  open,
  onClose,
}: CreateLabDialogProps) {
  const createLabMutation = useCreateLab();

  const {
    reset: resetCreateLabMutation,
  } = createLabMutation;

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
  } = useForm<CreateLabFormValues>({
    resolver: zodResolver(
      createLabSchema,
    ),
    defaultValues: {
      centerId: "",
      name: "",
      code: "",
    },
  });

  useEffect(() => {
    if (!open) {
      reset();
      resetCreateLabMutation();
    }
  }, [
    open,
    reset,
    resetCreateLabMutation,
  ]);

  if (!open) {
    return null;
  }

  const onSubmit = async (
    values: CreateLabFormValues,
  ) => {
    try {
      await createLabMutation.mutateAsync({
        centerId: Number(values.centerId),
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
      });

      reset();
      onClose();
    } catch {
      // Mutation error is displayed below.
    }
  };

  const isBusy =
    isSubmitting ||
    createLabMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-lab-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2
              id="create-lab-title"
              className="text-lg font-semibold text-white"
            >
              Create Lab
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add a new lab to an active center.
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
              htmlFor="lab-center"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Center
            </label>

            <select
              id="lab-center"
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
              htmlFor="lab-name"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Lab Name
            </label>

            <input
              id="lab-name"
              type="text"
              placeholder="e.g. Main Computer Lab"
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
              htmlFor="lab-code"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Lab Code
            </label>

            <input
              id="lab-code"
              type="text"
              placeholder="e.g. LAB-001"
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
              The code must be unique within the selected center.
            </p>
          </div>

          {/* Server error */}
          {createLabMutation.isError && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              Failed to create lab. Please check
              the entered details and try again.
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
                ? "Creating..."
                : "Create Lab"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
