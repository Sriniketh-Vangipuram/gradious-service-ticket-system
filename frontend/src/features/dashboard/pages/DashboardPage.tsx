import {
  ArrowRight,
  Plus,
  Ticket as TicketIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo } from "react";

import { ROUTES } from "../../../constants/routes";
import { TicketList } from "../../tickets/components/TicketList";
import { useTickets } from "../../tickets/hooks/useTickets";

export function DashboardPage() {
  const {
    data,
    isLoading,
    isError,
    isFetching,
  } = useTickets({
    sort: "newest",
    limit: 5,
  });

  const recentTickets = useMemo(
    () =>
      data?.pages.flatMap(
        (page) => page.data.items,
      ) ?? [],
    [data],
  );

  return (
    <section className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/30 p-6 shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
                Employee workspace
              </p>

              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Your service desk
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
                Submit IT service requests, track their progress,
                and stay informed about support activity.
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
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
              <TicketIcon
                size={19}
                aria-hidden="true"
              />
            </div>

            <p className="mt-5 text-sm font-medium text-slate-400">
              Recent requests
            </p>

            <p className="mt-1 text-2xl font-semibold text-white">
              {isLoading ? "—" : recentTickets.length}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Latest tickets visible in your workspace
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5">
            <p className="text-sm font-medium text-slate-400">
              Service desk
            </p>

            <p className="mt-2 text-lg font-semibold text-white">
              Track every request
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Open a ticket to review its current status,
              support activity, and conversation.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5">
            <p className="text-sm font-medium text-slate-400">
              Need assistance?
            </p>

            <p className="mt-2 text-lg font-semibold text-white">
              Submit a request
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create a new IT service request whenever you
              need support.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
                Activity
              </p>

              <h2 className="mt-2 text-xl font-semibold text-white">
                Recent tickets
              </h2>
            </div>

            <Link
              to={ROUTES.app.tickets}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-300 transition hover:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
            >
              View all
              <ArrowRight
                size={15}
                aria-hidden="true"
              />
            </Link>
          </div>

          {isError ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
              <p className="text-sm font-medium text-red-200">
                Recent tickets couldn't be loaded.
              </p>

              <p className="mt-1 text-sm text-red-300/70">
                Please open My Tickets to try again.
              </p>
            </div>
          ) : (
            <TicketList
              tickets={recentTickets}
              isLoading={isLoading}
              isFetchingNextPage={false}
              hasNextPage={false}
            />
          )}

          {isFetching && !isLoading && (
            <p className="mt-3 text-center text-xs text-slate-600">
              Updating recent activity...
            </p>
          )}
        </div>
      </div>
    </section>
  );
}