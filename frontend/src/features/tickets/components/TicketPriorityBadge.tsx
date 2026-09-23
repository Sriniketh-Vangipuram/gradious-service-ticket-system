import type { TicketPriority } from "../types/ticket.types";

interface TicketPriorityBadgeProps {
  priority: TicketPriority;
}

const priorityConfig: Record<
  TicketPriority,
  {
    label: string;
    className: string;
  }
> = {
  LOW: {
    label: "Low",
    className:
      "border-slate-500/20 bg-slate-500/10 text-slate-300",
  },

  MEDIUM: {
    label: "Medium",
    className:
      "border-sky-500/20 bg-sky-500/10 text-sky-300",
  },

  HIGH: {
    label: "High",
    className:
      "border-orange-500/20 bg-orange-500/10 text-orange-300",
  },

  CRITICAL: {
    label: "Critical",
    className:
      "border-red-500/20 bg-red-500/10 text-red-300",
  },
};

export function TicketPriorityBadge({
  priority,
}: TicketPriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1",
        "text-xs font-medium whitespace-nowrap",
        config.className,
      ].join(" ")}
    >
      {config.label}
    </span>
  );
}