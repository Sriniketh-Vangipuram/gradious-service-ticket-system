import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { createTicketSchema } from "../schemas/ticket.schema";
import type { CreateTicketFormValues } from "../schemas/ticket.schema";
import type { TicketCategory } from "../types/catalog.types";
import { useEffect } from "react";
import type { TicketSoftware } from "../types/catalog.types";

interface CreateTicketFormProps {
  categories: TicketCategory[];
  software: TicketSoftware[];
  onSubmit: (values: CreateTicketFormValues) => void;
  isSubmitting?: boolean;
}

export function CreateTicketForm({
  categories,
  software,
  onSubmit,
  isSubmitting = false,
}: CreateTicketFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
    },
  });

  const selectedCategoryId = useWatch({
  control,
    name: "categoryId",
    });

        const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId,
    );

    const isSoftwareCategory = selectedCategory?.code === "SOFTWARE";

    useEffect(() => {
        if (!isSoftwareCategory) {
            setValue("softwareId", undefined);
            setValue("requestType", undefined);
        }
    }, [isSoftwareCategory, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label
          htmlFor="title"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Title
        </label>

        <input
          id="title"
          type="text"
          placeholder="Briefly describe the issue"
          {...register("title")}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
        />

        {errors.title && (
          <p className="mt-2 text-sm text-red-400">
            {errors.title.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Description
        </label>

        <textarea
          id="description"
          rows={6}
          placeholder="Describe the problem, what you were trying to do, and any relevant details..."
          {...register("description")}
          className="w-full resize-y rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
        />

        {errors.description && (
          <p className="mt-2 text-sm text-red-400">
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <label
            htmlFor="categoryId"
            className="mb-2 block text-sm font-medium text-slate-200"
        >
            Category
        </label>

        <select
            id="categoryId"
            {...register("categoryId", {
            setValueAs: (value) => Number(value),
            })}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500"
            defaultValue=""
        >
            <option value="" disabled>
            Select a category
            </option>

            {categories.map((category) => (
            <option key={category.id} value={category.id}>
                {category.name}
            </option>
            ))}
        </select>

        {errors.categoryId && (
            <p className="mt-2 text-sm text-red-400">
            {errors.categoryId.message}
            </p>
        )}
      </div>

        {isSoftwareCategory && (
        <div>
            <label
            htmlFor="softwareId"
            className="mb-2 block text-sm font-medium text-slate-200"
            >
            Software
            </label>

            <select
            id="softwareId"
            {...register("softwareId", {
                setValueAs: (value) =>
                value === "" ? undefined : Number(value),
            })}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500"
            defaultValue=""
            >
            <option value="" disabled>
                Select software
            </option>

            {software.map((item) => (
                <option key={item.id} value={item.id}>
                {item.name}
                {item.vendor ? ` — ${item.vendor}` : ""}
                </option>
            ))}
            </select>

            {errors.softwareId && (
            <p className="mt-2 text-sm text-red-400">
                {errors.softwareId.message}
            </p>
            )}
        </div>
        )}

        {isSoftwareCategory && (
        <div>
            <label
            htmlFor="requestType"
            className="mb-2 block text-sm font-medium text-slate-200"
            >
            Request Type
            </label>

            <select
            id="requestType"
            {...register("requestType")}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500"
            defaultValue=""
            >
            <option value="" disabled>
                Select request type
            </option>
            <option value="INSTALLATION">Installation</option>
            <option value="UPDATE">Update</option>
            <option value="UNINSTALLATION">Uninstallation</option>
            <option value="LICENSE">License</option>
            </select>

            {errors.requestType && (
            <p className="mt-2 text-sm text-red-400">
                {errors.requestType.message}
            </p>
            )}
        </div>
        )}

      <div>
        <label
          htmlFor="priority"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Priority
        </label>

        <select
          id="priority"
          {...register("priority")}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>

        {errors.priority && (
          <p className="mt-2 text-sm text-red-400">
            {errors.priority.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Creating ticket..." : "Create ticket"}
      </button>
    </form>
  );
}