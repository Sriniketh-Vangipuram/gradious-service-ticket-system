import type {
  TicketPriority,
  TicketStatus,
} from "../../tickets/types/ticket.types";

interface TechnicianQueueFiltersProps {
  search: string;
  status: TicketStatus | "";
  priority: TicketPriority | "";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: TicketStatus | "") => void;
  onPriorityChange: (value: TicketPriority | "") => void;
  onClear: () => void;
}

const statusOptions: Array<{
  value: TicketStatus;
  label: string;
}> = [
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "WAITING_FOR_USER", label: "Waiting for user" },
  { value: "RESOLVED", label: "Resolved" },
];

const priorityOptions: Array<{
  value: TicketPriority;
  label: string;
}> = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

export function TechnicianQueueFilters({
  search,
  status,
  priority,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onClear,
}: TechnicianQueueFiltersProps) {
  const hasFilters =
    search.trim().length > 0 ||
    status !== "" ||
    priority !== "";

  return (
    <section
      aria-label="Ticket queue filters"
      className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4"
    >
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
        <div>
          <label
            htmlFor="technician-ticket-search"
            className="mb-1.5 block text-xs font-medium text-slate-400"
          >
            Search
          </label>

          <input
            id="technician-ticket-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search ticket number or title..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="technician-ticket-status"
            className="mb-1.5 block text-xs font-medium text-slate-400"
          >
            Status
          </label>

          <select
            id="technician-ticket-status"
            value={status}
            onChange={(event) =>
              onStatusChange(event.target.value as TicketStatus | "")
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All statuses</option>

            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="technician-ticket-priority"
            className="mb-1.5 block text-xs font-medium text-slate-400"
          >
            Priority
          </label>

          <select
            id="technician-ticket-priority"
            value={priority}
            onChange={(event) =>
              onPriorityChange(
                event.target.value as TicketPriority | "",
              )
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All priorities</option>

            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            disabled={!hasFilters}
            onClick={onClear}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/70 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear filters
          </button>
        </div>
      </div>
    </section>
  );
}