import { Loader2 } from "lucide-react";

import type { Ticket } from "../../../tickets/types/ticket.types";
import { AdministrationTicketCard } from "./AdministrationTicketCard";

interface AdministrationTicketListProps {
  tickets: Ticket[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
}

export function AdministrationTicketList({
  tickets,
  isLoading = false,
  isFetchingNextPage = false,
  hasNextPage = false,
  onLoadMore,
}: AdministrationTicketListProps) {
  if (isLoading) {
    return (
      <div
        className="space-y-4"
        aria-label="Loading administration tickets"
        aria-busy="true"
      >
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5"
          >
            <div className="h-4 w-36 rounded bg-slate-800" />

            <div className="mt-4 h-5 w-3/4 rounded bg-slate-800" />

            <div className="mt-3 h-4 w-full rounded bg-slate-800" />
            <div className="mt-2 h-4 w-2/3 rounded bg-slate-800" />

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map(
                (_, detailIndex) => (
                  <div key={detailIndex}>
                    <div className="h-3 w-20 rounded bg-slate-800" />
                    <div className="mt-2 h-4 w-28 rounded bg-slate-800" />
                  </div>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-12 text-center">
        <h3 className="text-sm font-semibold text-slate-200">
          No tickets found
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          There are no service requests matching the current
          administration view.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <AdministrationTicketCard
          key={ticket.id}
          ticket={ticket}
        />
      ))}

      {hasNextPage && onLoadMore ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
          >
            {isFetchingNextPage ? (
              <Loader2
                size={16}
                className="animate-spin"
                aria-hidden="true"
              />
            ) : null}

            {isFetchingNextPage
              ? "Loading..."
              : "Load more tickets"}
          </button>
        </div>
      ) : null}
    </div>
  );
}