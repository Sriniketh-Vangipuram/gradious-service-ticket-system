import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  PauseCircle,
  ShieldAlert,
  Timer,
} from "lucide-react";

import type {
  FirstResponseMonitoring,
  ResolutionMonitoring,
  SlaMonitoringStatus,
  SlaTicketMonitoringItem,
} from "../types/sla.types";

interface SlaTicketTableProps {
  tickets: SlaTicketMonitoringItem[];
  isLoading?: boolean;
  onTicketClick: (ticketId: number) => void;
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function formatMinutes(
  minutes: number | null,
) {
  if (minutes === null) {
    return "—";
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

function StatusBadge({
  status,
}: {
  status: SlaMonitoringStatus;
}) {
  const styles: Record<
    SlaMonitoringStatus,
    string
  > = {
    PENDING:
      "border-slate-700 bg-slate-800/70 text-slate-300",

    AT_RISK:
      "border-amber-500/20 bg-amber-500/10 text-amber-400",

    OVERDUE:
      "border-red-500/20 bg-red-500/10 text-red-400",

    PAUSED:
      "border-orange-500/20 bg-orange-500/10 text-orange-400",

    MET:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",

    BREACHED:
      "border-red-500/20 bg-red-500/10 text-red-400",

    CANCELLED:
      "border-slate-700 bg-slate-800/70 text-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-medium ${styles[status]}`}
    >
      {formatLabel(status)}
    </span>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: SlaTicketMonitoringItem["priority"];
}) {
  const styles = {
    LOW: "text-slate-400",
    MEDIUM: "text-blue-400",
    HIGH: "text-amber-400",
    CRITICAL: "text-red-400",
  };

  return (
    <span
      className={`text-xs font-semibold ${styles[priority]}`}
    >
      {formatLabel(priority)}
    </span>
  );
}

function SlaMetric({
  label,
  monitoring,
}: {
  label: string;
  monitoring:
    | FirstResponseMonitoring
    | ResolutionMonitoring;
}) {
  const status = monitoring.status;

  let icon = (
    <Clock3 className="h-3.5 w-3.5" />
  );

  if (status === "AT_RISK") {
    icon = (
      <Timer className="h-3.5 w-3.5" />
    );
  }

  if (
    status === "OVERDUE" ||
    status === "BREACHED"
  ) {
    icon = (
      <AlertCircle className="h-3.5 w-3.5" />
    );
  }

  if (status === "PAUSED") {
    icon = (
      <PauseCircle className="h-3.5 w-3.5" />
    );
  }

  if (status === "MET") {
    icon = (
      <CheckCircle2 className="h-3.5 w-3.5" />
    );
  }

  return (
    <div className="min-w-[150px]">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] text-slate-500">
        {icon}
        <span>{label}</span>
      </div>

      <div className="flex items-center gap-2">
        <StatusBadge status={status} />

        {monitoring.remainingBusinessMinutes !==
          null && (
          <span className="text-[11px] text-slate-500">
            {formatMinutes(
              monitoring.remainingBusinessMinutes,
            )}{" "}
            left
          </span>
        )}
      </div>
    </div>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 6 }).map(
        (_, index) => (
          <tr key={index}>
            <td
              colSpan={7}
              className="px-5 py-4"
            >
              <div className="h-12 animate-pulse rounded-lg bg-slate-800/60" />
            </td>
          </tr>
        ),
      )}
    </>
  );
}

export function SlaTicketTable({
  tickets,
  isLoading = false,
  onTicketClick,
}: SlaTicketTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/50">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Ticket
              </th>

              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Priority
              </th>

              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Center / Category
              </th>

              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Requester
              </th>

              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Assignee
              </th>

              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                SLA
              </th>

              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Ticket Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800">
            {isLoading && (
              <LoadingRows />
            )}

            {!isLoading &&
              tickets.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center"
                  >
                    <div className="flex flex-col items-center">
                      <ShieldAlert className="mb-3 h-8 w-8 text-slate-600" />

                      <p className="text-sm font-medium text-slate-300">
                        No SLA tickets found
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Try changing or resetting your filters.
                      </p>
                    </div>
                  </td>
                </tr>
              )}

            {!isLoading &&
              tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="group transition hover:bg-slate-800/30"
                >
                  {/* Ticket */}
                  <td className="px-5 py-4 align-top">
                    <button
                      type="button"
                      onClick={() =>
                        onTicketClick(ticket.id)
                      }
                      className="text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-sky-400 group-hover:text-sky-300">
                          {ticket.ticketNumber}
                        </span>

                        <ExternalLink className="h-3 w-3 text-slate-600 transition group-hover:text-slate-400" />
                      </div>

                      <p className="mt-1 max-w-[260px] truncate text-sm font-medium text-slate-200">
                        {ticket.title}
                      </p>
                    </button>
                  </td>

                  {/* Priority */}
                  <td className="px-5 py-4 align-top">
                    <PriorityBadge
                      priority={ticket.priority}
                    />

                    <p className="mt-1 text-[11px] text-slate-500">
                      {formatLabel(
                        ticket.status,
                      )}
                    </p>
                  </td>

                  {/* Center / Category */}
                  <td className="px-5 py-4 align-top">
                    <p className="text-xs font-medium text-slate-300">
                      {ticket.center.name}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500">
                      {ticket.category.name}
                    </p>
                  </td>

                  {/* Requester */}
                  <td className="px-5 py-4 align-top">
                    <p className="text-xs text-slate-300">
                      {ticket.requester.fullName}
                    </p>
                  </td>

                  {/* Assignee */}
                  <td className="px-5 py-4 align-top">
                    <p className="text-xs text-slate-300">
                      {ticket.assignee?.fullName ??
                        "Unassigned"}
                    </p>
                  </td>

                  {/* SLA */}
                  <td className="px-5 py-4 align-top">
                    <div className="space-y-3">
                      <SlaMetric
                        label="First response"
                        monitoring={
                          ticket.firstResponse
                        }
                      />

                      <SlaMetric
                        label="Resolution"
                        monitoring={
                          ticket.resolution
                        }
                      />
                    </div>
                  </td>

                  {/* Ticket status */}
                  <td className="px-5 py-4 align-top">
                    <span className="inline-flex rounded-full border border-slate-700 bg-slate-800/70 px-2 py-1 text-[11px] font-medium text-slate-300">
                      {formatLabel(
                        ticket.status,
                      )}
                    </span>

                    <p className="mt-2 text-[10px] text-slate-600">
                      Resolution due:{" "}
                      {formatDate(
                        ticket.resolution.dueAt,
                      )}
                    </p>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}