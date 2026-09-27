import { useMemo, useState } from "react";

import { useAuth } from "../../../auth/hooks/useAuth";
import { CategoryFilters } from "../components/CategoryFilters";
import { CategoryStatusConfirmationDialog } from "../components/CategoryStatusConfirmationDialog";
import { CreateCategoryDialog } from "../components/CreateCategoryDialog";
import { EditCategoryDialog } from "../components/EditCategoryDialog";
import { useCategories } from "../hooks/useCategories";
import type { Category, CategoryFilters as CategoryFilterState } from "../types/category.types";

export function CategoriesPage() {
  const { user } = useAuth();

  const isAdmin = user?.role === "ADMIN";

  const [filters, setFilters] =
    useState<CategoryFilterState>({
      page: 1,
      limit: 10,
    });

  const [isCreateDialogOpen, setIsCreateDialogOpen] =
    useState(false);

  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [statusCategory, setStatusCategory] =
    useState<Category | null>(null);

  const categoriesQuery = useCategories(filters);

  const categories =
    categoriesQuery.data?.data?.data ?? [];

  const pagination =
    categoriesQuery.data?.data?.pagination;

  const totalPages = pagination?.totalPages ?? 1;

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1,
      );
    }

    const currentPage = filters.page ?? 1;

    const start = Math.max(
      1,
      Math.min(
        currentPage - 2,
        totalPages - 4,
      ),
    );

    return Array.from(
      { length: 5 },
      (_, index) => start + index,
    );
  }, [filters.page, totalPages]);

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
    });
  };

  const handlePreviousPage = () => {
    setFilters((current) => ({
      ...current,
      page: Math.max(1, (current.page ?? 1) - 1),
    }));
  };

  const handleNextPage = () => {
    setFilters((current) => ({
      ...current,
      page: Math.min(
        totalPages,
        (current.page ?? 1) + 1,
      ),
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((current) => ({
      ...current,
      page,
    }));
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
  };

  const handleStatusChange = (category: Category) => {
    setStatusCategory(category);
  };

  const isInitialLoading =
    categoriesQuery.isLoading;

  const isRefreshing =
    categoriesQuery.isFetching &&
    !categoriesQuery.isLoading;

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/* Page Header                                                       */}
      {/* ---------------------------------------------------------------- */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Categories
            </h1>

            {isRefreshing && (
              <span className="text-xs text-slate-500">
                Refreshing...
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-slate-400">
            Manage the service categories used for
            ticket classification.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() =>
              setIsCreateDialogOpen(true)
            }
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/10 transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <span className="mr-2 text-lg leading-none">
              +
            </span>
            Create Category
          </button>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Filters                                                           */}
      {/* ---------------------------------------------------------------- */}

      <CategoryFilters
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* ---------------------------------------------------------------- */}
      {/* Error                                                             */}
      {/* ---------------------------------------------------------------- */}

      {categoriesQuery.isError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4">
          <p className="text-sm font-medium text-red-300">
            Failed to load categories.
          </p>

          <p className="mt-1 text-sm text-red-400/80">
            Please try again.
          </p>

          <button
            type="button"
            onClick={() =>
              categoriesQuery.refetch()
            }
            className="mt-3 rounded-lg border border-red-400/20 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
          >
            Retry
          </button>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Table                                                             */}
      {/* ---------------------------------------------------------------- */}

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Category
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Code
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Description
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tickets
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>

                {isAdmin && (
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {/* Initial loading */}
              {isInitialLoading &&
                Array.from({ length: 5 }).map(
                  (_, index) => (
                    <tr key={index}>
                      <td
                        colSpan={isAdmin ? 6 : 5}
                        className="px-6 py-5"
                      >
                        <div className="h-5 animate-pulse rounded bg-slate-800" />
                      </td>
                    </tr>
                  ),
                )}

              {/* Empty */}
              {!isInitialLoading &&
                !categoriesQuery.isError &&
                categories.length === 0 && (
                  <tr>
                    <td
                      colSpan={isAdmin ? 6 : 5}
                      className="px-6 py-16 text-center"
                    >
                      <div className="mx-auto max-w-md">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-500">
                          #
                        </div>

                        <h3 className="mt-4 text-sm font-semibold text-white">
                          No categories found
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Try changing your search or
                          status filters.
                        </p>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() =>
                              setIsCreateDialogOpen(
                                true,
                              )
                            }
                            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                          >
                            Create Category
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

              {/* Data */}
              {!isInitialLoading &&
                !categoriesQuery.isError &&
                categories.map((category) => (
                  <tr
                    key={category.id}
                    className="transition hover:bg-slate-800/30"
                  >
                    {/* Category */}
                    <td className="whitespace-nowrap px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {category.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          ID #{category.id}
                        </p>
                      </div>
                    </td>

                    {/* Code */}
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-semibold tracking-wide text-slate-300">
                        {category.code}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="max-w-sm px-6 py-4">
                      <p
                        className="truncate text-sm text-slate-400"
                        title={
                          category.description ??
                          undefined
                        }
                      >
                        {category.description ||
                          "No description"}
                      </p>
                    </td>

                    {/* Tickets */}
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-sm font-medium text-slate-300">
                        {category._count?.tickets ?? 0}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={
                          category.isActive
                            ? "inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400"
                            : "inline-flex items-center rounded-full border border-slate-600/30 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-400"
                        }
                      >
                        <span
                          className={
                            category.isActive
                              ? "mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400"
                              : "mr-1.5 h-1.5 w-1.5 rounded-full bg-slate-500"
                          }
                        />

                        {category.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    {isAdmin && (
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(category)
                            }
                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(
                                category,
                              )
                            }
                            className={
                              category.isActive
                                ? "rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
                                : "rounded-lg border border-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/10"
                            }
                          >
                            {category.isActive
                              ? "Deactivate"
                              : "Reactivate"}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Pagination                                                        */}
        {/* ---------------------------------------------------------------- */}

        {!isInitialLoading &&
          !categoriesQuery.isError &&
          categories.length > 0 &&
          pagination && (
            <div className="flex flex-col gap-4 border-t border-slate-800 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-medium text-slate-300">
                  {(pagination.page - 1) *
                    pagination.limit +
                    1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-slate-300">
                  {Math.min(
                    pagination.page *
                      pagination.limit,
                    pagination.total,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-slate-300">
                  {pagination.total}
                </span>{" "}
                categories
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePreviousPage}
                  disabled={pagination.page <= 1}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() =>
                      handlePageChange(page)
                    }
                    className={
                      page === pagination.page
                        ? "rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
                        : "rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
                    }
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={
                    pagination.page >= totalPages
                  }
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Dialogs                                                           */}
      {/* ---------------------------------------------------------------- */}

      {isAdmin && (
        <>
          <CreateCategoryDialog
            open={isCreateDialogOpen}
            onClose={() =>
              setIsCreateDialogOpen(false)
            }
          />

          <EditCategoryDialog
            open={Boolean(editingCategory)}
            category={editingCategory}
            onClose={() =>
              setEditingCategory(null)
            }
          />

          <CategoryStatusConfirmationDialog
            open={Boolean(statusCategory)}
            category={statusCategory}
            onClose={() =>
              setStatusCategory(null)
            }
          />
        </>
      )}
    </div>
  );
}