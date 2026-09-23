import { Plus, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";

import { ROUTES } from "../../../constants/routes";
import { TicketFilters } from "../components/TicketFilters";
import type { TicketFilterValues } from "../components/TicketFilters";
import { TicketList } from "../components/TicketList";
import { useTickets } from "../hooks/useTickets";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";


const DEFAULT_FILTERS: TicketFilterValues = {
  search: "",
  status: undefined,
  priority: undefined,
  sort: "newest",
};

export function TicketsPage() {
  const [filters, setFilters] =
    useState<TicketFilterValues>(DEFAULT_FILTERS);

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
    [debouncedSearch,filters.status,filters.priority,filters.sort,],
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

  return (
    <section className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
              Service requests
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              My Tickets
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Track your IT service requests, monitor their progress,
              and review support activity.
            </p>
          </div>

          <Link
            to={ROUTES.app.createTicket}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
          >
            <Plus
              size={17}
              aria-hidden="true"
            />
            Create ticket
          </Link>
        </div>

        <div className="mt-8">
          <TicketFilters
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
                    We couldn't load your tickets
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-red-300/70">
                    {error instanceof Error
                      ? error.message
                      : "Something went wrong while loading your tickets."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => refetch()}
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
            <TicketList
              tickets={tickets}
              isLoading={isLoading}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              onLoadMore={() => fetchNextPage()}
            />
          )}
        </div>
      </div>
    </section>
  );
}