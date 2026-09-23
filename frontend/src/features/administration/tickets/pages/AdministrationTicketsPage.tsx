import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

import { useDebouncedValue } from "../../../../hooks/useDebouncedValue";
import { useTickets } from "../../../tickets/hooks/useTickets";
import { AdministrationTicketFilters } from "../components/AdministrationTicketFilters";
import type { AdministrationTicketFilterValues } from "../components/AdministrationTicketFilters";
import { AdministrationTicketList } from "../components/AdministrationTicketList";

const DEFAULT_FILTERS: AdministrationTicketFilterValues = {
  search: "",
  status: undefined,
  priority: undefined,
  sort: "newest",
};

export function AdministrationTicketsPage() {
  const [filters, setFilters] =
    useState<AdministrationTicketFilterValues>(
      DEFAULT_FILTERS,
    );

  const debouncedSearch = useDebouncedValue(
    filters.search,
    400,
  );

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      status: filters.status,
      priority: filters.priority,
      sort: filters.sort,
      limit: 20,
    }),
    [
      debouncedSearch,
      filters.status,
      filters.priority,
      filters.sort,
    ],
  );

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useTickets(queryParams);

  const tickets = useMemo(
    () =>
      data?.pages.flatMap(
        (page) => page.data.items,
      ) ?? [],
    [data],
  );

  const hasSearchOrFilters =
    filters.search.trim().length > 0 ||
    filters.status !== undefined ||
    filters.priority !== undefined;

  return (
    <section className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-slate-800/80 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
            Administration
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Ticket Operations
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Review service requests, monitor operational activity,
            and manage tickets across your authorized service scope.
          </p>
        </header>

        <div className="mt-8">
          <AdministrationTicketFilters
            value={filters}
            onChange={setFilters}
          />
        </div>

        <div className="mt-5">
          {isError ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-red-200">
                    We couldn't load the ticket operations view
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-red-300/70">
                    {error instanceof Error
                      ? error.message
                      : "Something went wrong while loading tickets."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void refetch();
                  }}
                  disabled={isFetching}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-red-400/20 bg-red-500/10 px-3.5 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-400/70"
                >
                  <RefreshCw
                    size={15}
                    aria-hidden="true"
                  />
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <AdministrationTicketList
              tickets={tickets}
              isLoading={isLoading}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              onLoadMore={() => {
                void fetchNextPage();
              }}
            />
          )}
        </div>

        {!isLoading &&
        !isError &&
        tickets.length === 0 &&
        hasSearchOrFilters ? (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
            >
              Clear filters
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}