import type { TicketStatus } from "../types/ticket.types";

interface TicketStatusBadgeProps {
  status: TicketStatus;
}

const statusConfig: Record<
  TicketStatus,
  {
    label: string;
    className: string;
  }
> = {
  OPEN: {
    label: "Open",
    className:
      "border-sky-500/20 bg-sky-500/10 text-sky-300",
  },

  TRIAGED: {
    label: "Triaged",
    className:
      "border-violet-500/20 bg-violet-500/10 text-violet-300",
  },

  ASSIGNED: {
    label: "Assigned",
    className:
      "border-indigo-500/20 bg-indigo-500/10 text-indigo-300",
  },

  IN_PROGRESS: {
    label: "In Progress",
    className:
      "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },

  WAITING_FOR_USER: {
    label: "Waiting for You",
    className:
      "border-orange-500/20 bg-orange-500/10 text-orange-300",
  },

  RESOLVED: {
    label: "Resolved",
    className:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  },

  CLOSED: {
    label: "Closed",
    className:
      "border-slate-500/20 bg-slate-500/10 text-slate-300",
  },

  CANCELLED: {
    label: "Cancelled",
    className:
      "border-red-500/20 bg-red-500/10 text-red-300",
  },
};

export function TicketStatusBadge({
  status,
}: TicketStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1",
        "text-xs font-medium whitespace-nowrap",
        config.className,
      ].join(" ")}
    >
      <span
        className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current"
        aria-hidden="true"
      />

      {config.label}
    </span>
  );
}