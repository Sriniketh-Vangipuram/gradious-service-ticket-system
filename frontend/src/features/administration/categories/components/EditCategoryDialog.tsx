import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { useCategoryMutations } from "../hooks/useCategoryMutations";
import type {
  Category,
  UpdateCategoryInput,
} from "../types/category.types";

interface EditCategoryDialogProps {
  open: boolean;
  category: Category | null;
  onClose: () => void;
}

interface EditCategoryFormValues {
  name: string;
  code: string;
  description: string;
}

export function EditCategoryDialog({
  open,
  category,
  onClose,
}: EditCategoryDialogProps) {
  const { updateCategoryMutation } = useCategoryMutations();

  const {
    reset: resetUpdateCategoryMutation,
  } = updateCategoryMutation;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditCategoryFormValues>({
    defaultValues: {
      name: "",
      code: "",
      description: "",
    },
  });

  useEffect(() => {
    if (!open || !category) {
      return;
    }

    reset({
      name: category.name,
      code: category.code,
      description: category.description ?? "",
    });

    resetUpdateCategoryMutation();
  }, [
    open,
    category,
    reset,
    resetUpdateCategoryMutation,
  ]);

  const onSubmit = async (
    values: EditCategoryFormValues,
  ) => {
    if (!category) {
      return;
    }

    const payload: UpdateCategoryInput = {
      name: values.name.trim(),
      code: values.code.trim().toUpperCase(),
      description: values.description.trim() || null,
    };

    try {
      await updateCategoryMutation.mutateAsync({
        categoryId: category.id,
        payload,
      });

      onClose();
    } catch {
      // Mutation error is displayed below.
    }
  };

  if (!open || !category) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-category-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <div>
            <h2
              id="edit-category-title"
              className="text-lg font-semibold text-white"
            >
              Edit Category
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Update the category information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={updateCategoryMutation.isPending}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-5 px-6 py-6">
            {/* Name */}
            <div>
              <label
                htmlFor="edit-category-name"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Category name
              </label>

              <input
                id="edit-category-name"
                type="text"
                {...register("name", {
                  required: "Category name is required.",
                  minLength: {
                    value: 2,
                    message:
                      "Category name must be at least 2 characters.",
                  },
                  maxLength: {
                    value: 100,
                    message:
                      "Category name cannot exceed 100 characters.",
                  },
                })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />

              {errors.name && (
                <p className="mt-1.5 text-sm text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Code */}
            <div>
              <label
                htmlFor="edit-category-code"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Category code
              </label>

              <input
                id="edit-category-code"
                type="text"
                {...register("code", {
                  required: "Category code is required.",
                  minLength: {
                    value: 2,
                    message:
                      "Category code must be at least 2 characters.",
                  },
                  maxLength: {
                    value: 50,
                    message:
                      "Category code cannot exceed 50 characters.",
                  },
                })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm uppercase text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />

              {errors.code && (
                <p className="mt-1.5 text-sm text-red-400">
                  {errors.code.message}
                </p>
              )}

              <p className="mt-1.5 text-xs text-slate-500">
                The code will be stored in uppercase.
              </p>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="edit-category-description"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Description
              </label>

              <textarea
                id="edit-category-description"
                rows={4}
                {...register("description", {
                  maxLength: {
                    value: 500,
                    message:
                      "Description cannot exceed 500 characters.",
                  },
                })}
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />

              {errors.description && (
                <p className="mt-1.5 text-sm text-red-400">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Server error */}
            {updateCategoryMutation.isError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {updateCategoryMutation.error instanceof Error
                  ? updateCategoryMutation.error.message
                  : "Failed to update category. Please try again."}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={updateCategoryMutation.isPending}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={updateCategoryMutation.isPending}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateCategoryMutation.isPending
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}