import { useEffect, useState } from "react";
import { ClipboardList, RefreshCw } from "lucide-react";

import { TechnicianQueueFilters } from "../components/TechnicianQueueFilters";
import { TechnicianTicketCard } from "../components/TechnicianTicketCard";
import { useTechnicianTickets } from "../hooks/useTechnicianTickets";

import type {
  TicketPriority,
  TicketStatus,
} from "../../tickets/types/ticket.types";

export function TechnicianQueuePage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [priority, setPriority] = useState<TicketPriority | "">("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [now] = useState(() => Date.now());

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  const ticketsQuery = useTechnicianTickets({
    limit: 20,
    sort: "newest",
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
  });

  const tickets =
    ticketsQuery.data?.pages.flatMap(
      (page) => page.data.items,
    ) ?? [];

  const isInitialLoading =
    ticketsQuery.isPending && tickets.length === 0;

  const isError =
    ticketsQuery.isError && tickets.length === 0;

  const isRefreshing =
    ticketsQuery.isFetching && !ticketsQuery.isPending;

  const hasNextPage = ticketsQuery.hasNextPage;

  const hasFilters =
    search.trim().length > 0 ||
    status !== "" ||
    priority !== "";

  function handleRetry() {
    void ticketsQuery.refetch();
  }

  function handleLoadMore() {
    if (
      !ticketsQuery.hasNextPage ||
      ticketsQuery.isFetchingNextPage
    ) {
      return;
    }

    void ticketsQuery.fetchNextPage();
  }

  function handleClearFilters() {
    setSearch("");
    setStatus("");
    setPriority("");
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="border-b border-slate-800/80 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
          Technician Workspace
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Ticket Queue
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Review tickets assigned to you and manage your active service
          workload.
        </p>
      </header>

      <TechnicianQueueFilters
        search={search}
        status={status}
        priority={priority}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onPriorityChange={setPriority}
        onClear={handleClearFilters}
      />

      {isInitialLoading ? (
        <div
          className="mt-6 space-y-3"
          aria-label="Loading ticket queue"
          aria-busy="true"
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl border border-slate-800/80 bg-slate-900/50"
            />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6"
        >
          <h2 className="text-sm font-semibold text-rose-200">
            Ticket queue couldn&apos;t be loaded
          </h2>

          <p className="mt-2 text-sm leading-6 text-rose-200/70">
            We couldn&apos;t retrieve your assigned tickets. Please try
            again.
          </p>

          <button
            type="button"
            onClick={handleRetry}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3.5 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/15 focus:outline-none focus:ring-2 focus:ring-rose-400/70"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Try again
          </button>
        </div>
      ) : null}

      {!isInitialLoading && !isError ? (
        <>
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300"
              >
                <ClipboardList size={17} />
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  Assigned tickets
                </p>

                <p className="text-xs text-slate-500">
                  {tickets.length} loaded
                </p>
              </div>
            </div>

            {isRefreshing ? (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <RefreshCw
                  size={13}
                  className="animate-spin"
                  aria-hidden="true"
                />
                Refreshing
              </div>
            ) : null}
          </div>

          {tickets.length === 0 ? (
            <div
              role="status"
              aria-live="polite"
              className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-900/50 px-6 py-12 text-center"
            >
              <div
                aria-hidden="true"
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-500"
              >
                <ClipboardList size={20} />
              </div>

              <h2 className="mt-4 text-sm font-semibold text-white">
                {hasFilters
                  ? "No tickets match your filters"
                  : "No assigned tickets"}
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {hasFilters
                  ? "Try changing your search or filter criteria."
                  : "Tickets assigned to you will appear here when they are ready for technician action."}
              </p>

              {hasFilters ? (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-5 inline-flex items-center rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {tickets.map((ticket) => (
                <TechnicianTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  now={now}
                />
              ))}
            </div>
          )}

          {hasNextPage ? (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                disabled={ticketsQuery.isFetchingNextPage}
                onClick={handleLoadMore}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ticketsQuery.isFetchingNextPage
                  ? "Loading..."
                  : "Load more"}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}