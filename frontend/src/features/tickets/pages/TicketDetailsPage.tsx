import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileText,
  MapPin,
  MessageCircle,
  RefreshCw,
  UserRound,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import { ROUTES } from "../../../constants/routes";
import { TicketPriorityBadge } from "../components/TicketPriorityBadge";
import { TicketStatusBadge } from "../components/TicketStatusBadge";
import { useTicket } from "../hooks/useTickets";
import { TicketComments } from "../../comments/components/TicketComments";
import { useCurrentUser } from "../../auth/hooks/useCurrentUser";
import { canRespondToTicket } from "../ticket.permissions";
import { TicketLifecycleActions } from "../components/TicketLifecycleActions";

function formatDate(dateString: string | null): string {
  if (!dateString) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) {
    return "Not configured";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

function formatRequestType(
  requestType:
    | "INSTALLATION"
    | "UPDATE"
    | "UNINSTALLATION"
    | "LICENSE"
    | null,
): string {
  if (!requestType) {
    return "General service request";
  }

  return requestType.charAt(0) + requestType.slice(1).toLowerCase();
}

export function TicketDetailsPage() {
  const { ticketId } = useParams<{ ticketId: string }>();

  const parsedTicketId = ticketId ? Number(ticketId) : NaN;
  const isValidTicketId =
    Number.isInteger(parsedTicketId) && parsedTicketId > 0;

  const ticketQuery = useTicket(
    isValidTicketId ? parsedTicketId : null,
  );
  
  const { data: currentUserResponse } = useCurrentUser();

  const currentUser = currentUserResponse?.data.user;
  
  if (!isValidTicketId) {
    return (
      <section className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <h1 className="text-lg font-semibold text-red-200">
              Invalid ticket
            </h1>

            <p className="mt-2 text-sm leading-6 text-red-300/70">
              The ticket identifier in the URL is not valid.
            </p>

            <Link
              to={ROUTES.app.tickets}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Back to my tickets
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (ticketQuery.isLoading) {
    return (
      <section
        className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8"
        aria-label="Loading ticket"
        aria-busy="true"
      >
        <div className="mx-auto max-w-5xl animate-pulse space-y-5">
          <div className="h-4 w-32 rounded bg-slate-800" />

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6">
            <div className="h-4 w-32 rounded bg-slate-800" />
            <div className="mt-4 h-8 w-2/3 rounded bg-slate-800" />
            <div className="mt-4 h-4 w-full rounded bg-slate-800" />
            <div className="mt-2 h-4 w-5/6 rounded bg-slate-800" />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="h-48 rounded-2xl border border-slate-800/80 bg-slate-900/60" />
            <div className="h-48 rounded-2xl border border-slate-800/80 bg-slate-900/60" />
            <div className="h-48 rounded-2xl border border-slate-800/80 bg-slate-900/60" />
          </div>
        </div>
      </section>
    );
  }

  if (ticketQuery.isError || !ticketQuery.data?.data.ticket) {
    return (
      <section className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <h1 className="text-lg font-semibold text-red-200">
              We couldn't load this ticket
            </h1>

            <p className="mt-2 text-sm leading-6 text-red-300/70">
              {ticketQuery.error instanceof Error
                ? ticketQuery.error.message
                : "The ticket may not exist or you may not have access to it."}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => ticketQuery.refetch()}
                disabled={ticketQuery.isFetching}
                className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-400/70"
              >
                <RefreshCw
                  size={16}
                  className={ticketQuery.isFetching ? "animate-spin" : ""}
                  aria-hidden="true"
                />
                Retry
              </button>

              <Link
                to={ROUTES.app.tickets}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Back to my tickets
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const ticket = ticketQuery.data.data.ticket;

  return (
    <section className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          to={ROUTES.app.tickets}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to my tickets
        </Link>

        <div className="mt-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-medium text-indigo-300">
                  {ticket.ticketNumber}
                </span>

                <TicketStatusBadge status={ticket.status} />

                <TicketPriorityBadge priority={ticket.priority} />
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {ticket.title}
              </h1>

              <p className="mt-3 text-sm leading-7 text-slate-400">
                {ticket.description}
              </p>
            </div>

            {ticketQuery.isFetching && (
              <div
                className="inline-flex shrink-0 items-center gap-2 text-xs text-slate-500"
                aria-live="polite"
              >
                <RefreshCw
                  size={14}
                  className="animate-spin"
                  aria-hidden="true"
                />
                Refreshing
              </div>
            )}
          </div>
        </div>

        {ticket.status === "WAITING_FOR_USER" ? (
            <section
              aria-labelledby="response-required-heading"
              className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 sm:p-6"
            >
              <div className="flex items-start gap-3">
                <div
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300"
                >
                  <MessageCircle size={18} />
                </div>

                <div className="min-w-0">
                  <h2
                    id="response-required-heading"
                    className="text-sm font-semibold text-amber-200"
                  >
                    Your response is required
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-amber-200/70">
                    The service desk is waiting for additional information from you.
                    Reply in the conversation below to continue this request.
                  </p>
                </div>
              </div>
            </section>
          ) : null}

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5">
            <div className="flex items-center gap-2 text-slate-300">
              <FileText size={17} aria-hidden="true" />
              <h2 className="text-sm font-semibold">Request details</h2>
            </div>

            <dl className="mt-5 space-y-4">
              <div>
                <dt className="text-xs text-slate-500">Request type</dt>
                <dd className="mt-1 text-sm font-medium text-slate-200">
                  {formatRequestType(ticket.requestType)}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-slate-500">Category ID</dt>
                <dd className="mt-1 text-sm font-medium text-slate-200">
                  {ticket.categoryId}
                </dd>
              </div>

              {ticket.softwareId !== null && (
                <div>
                  <dt className="text-xs text-slate-500">Software ID</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-200">
                    {ticket.softwareId}
                  </dd>
                </div>
              )}
            </dl>
          </article>

          <article className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5">
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin size={17} aria-hidden="true" />
              <h2 className="text-sm font-semibold">Service location</h2>
            </div>

            <dl className="mt-5 space-y-4">
              <div>
                <dt className="text-xs text-slate-500">Center</dt>
                <dd className="mt-1 text-sm font-medium text-slate-200">
                  {ticket.center.name}
                </dd>
                <dd className="mt-1 text-xs text-slate-500">
                  {ticket.center.code}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-slate-500">Lab</dt>
                <dd className="mt-1 text-sm font-medium text-slate-200">
                  {ticket.lab.name}
                </dd>
                <dd className="mt-1 text-xs text-slate-500">
                  {ticket.lab.code}
                </dd>
              </div>
            </dl>
          </article>

          <article className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5">
            <div className="flex items-center gap-2 text-slate-300">
              <UserRound size={17} aria-hidden="true" />
              <h2 className="text-sm font-semibold">Assignment</h2>
            </div>

            <dl className="mt-5 space-y-4">
              <div>
                <dt className="text-xs text-slate-500">Requester</dt>
                <dd className="mt-1 text-sm font-medium text-slate-200">
                  {ticket.requester.fullName}
                </dd>
                <dd className="mt-1 break-all text-xs text-slate-500">
                  {ticket.requester.email}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-slate-500">Assigned technician</dt>
                <dd className="mt-1 text-sm font-medium text-slate-200">
                  {ticket.assignee
                    ? ticket.assignee.fullName
                    : "Not assigned yet"}
                </dd>

                {ticket.assignee && (
                  <dd className="mt-1 break-all text-xs text-slate-500">
                    {ticket.assignee.email}
                  </dd>
                )}
              </div>
            </dl>
          </article>
        </div>

        <article className="mt-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock3 size={17} aria-hidden="true" />
            <h2 className="text-sm font-semibold">Service-level targets</h2>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">
                First response target
              </p>
              <p className="mt-1 text-sm font-medium text-slate-200">
                {formatDuration(ticket.firstResponseTargetMinutes)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Resolution target
              </p>
              <p className="mt-1 text-sm font-medium text-slate-200">
                {formatDuration(ticket.resolutionTargetMinutes)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                First response due
              </p>
              <p className="mt-1 text-sm font-medium text-slate-200">
                {formatDate(ticket.firstResponseDueAt)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Resolution due
              </p>
              <p className="mt-1 text-sm font-medium text-slate-200">
                {formatDate(ticket.resolutionDueAt)}
              </p>
            </div>
          </div>
        </article>

        <article className="mt-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-slate-300">
            <CalendarDays size={17} aria-hidden="true" />
            <h2 className="text-sm font-semibold">Timeline</h2>
          </div>

          <dl className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-slate-500">Created</dt>
              <dd className="mt-1 text-sm font-medium text-slate-200">
                {formatDate(ticket.createdAt)}
              </dd>
            </div>

            <div>
              <dt className="text-xs text-slate-500">Last updated</dt>
              <dd className="mt-1 text-sm font-medium text-slate-200">
                {formatDate(ticket.updatedAt)}
              </dd>
            </div>

            <div>
              <dt className="text-xs text-slate-500">Resolved</dt>
              <dd className="mt-1 text-sm font-medium text-slate-200">
                {formatDate(ticket.resolvedAt)}
              </dd>
            </div>

            <div>
              <dt className="text-xs text-slate-500">Closed</dt>
              <dd className="mt-1 text-sm font-medium text-slate-200">
                {formatDate(ticket.closedAt)}
              </dd>
            </div>
          </dl>
        </article>

        {currentUser ? (
          <div className="mt-5">
            <TicketLifecycleActions
              ticket={ticket}
              currentUser={currentUser}
            />
          </div>
        ) : null}
        
        <TicketComments
          ticketId={ticket.id}
          canRespond={
            currentUser
              ? canRespondToTicket(currentUser,ticket)
              : false
          }
          isResponseRequired={ticket.status==="WAITING_FOR_USER"}
        />
      </div>
    </section>
  );
}