import { ArrowUpRight, CalendarDays, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

import { ROUTES } from "../../../constants/routes";
import { TicketPriorityBadge } from "./TicketPriorityBadge";
import { TicketStatusBadge } from "./TicketStatusBadge";
import type { Ticket } from "../types/ticket.types";

interface TicketCardProps {
  ticket: Ticket;
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

export function TicketCard({
  ticket,
}: TicketCardProps) {
  return (
    <article className="group rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-sm transition hover:border-slate-700 hover:bg-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-medium text-indigo-300">
              {ticket.ticketNumber}
            </span>

            <TicketStatusBadge status={ticket.status} />

            <TicketPriorityBadge priority={ticket.priority} />
          </div>

          <Link
            to={ROUTES.app.ticket(ticket.id)}
            className="mt-3 block text-base font-semibold text-white transition hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
          >
            <span className="line-clamp-2">
              {ticket.title}
            </span>
          </Link>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
            {ticket.description}
          </p>
        </div>

        <Link
          to={ROUTES.app.ticket(ticket.id)}
          aria-label={`View ticket ${ticket.ticketNumber}`}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-slate-400 transition hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
        >
          <ArrowUpRight
            size={17}
            aria-hidden="true"
          />
        </Link>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-800/70 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays
              size={14}
              aria-hidden="true"
            />
            {formatDate(ticket.createdAt)}
          </span>

          <span className="inline-flex items-center gap-1.5">
            <UserRound
              size={14}
              aria-hidden="true"
            />
            {ticket.assignee
              ? ticket.assignee.fullName
              : "Unassigned"}
          </span>
        </div>

        <span className="text-slate-600">
          {ticket.center.code} · {ticket.lab.code}
        </span>
      </div>
    </article>
  );
}