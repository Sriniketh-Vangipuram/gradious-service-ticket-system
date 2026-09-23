import { RotateCcw, Search } from "lucide-react";

import type {
  TicketPriority,
  TicketStatus,
} from "../types/ticket.types";
import type { TicketSort } from "../types/ticket-api.types";

export interface TicketFilterValues {
  search: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  sort: TicketSort;
}

interface TicketFiltersProps {
  value: TicketFilterValues;
  onChange: (value: TicketFilterValues) => void;
}

const statusOptions: {
  value: TicketStatus;
  label: string;
}[] = [
  { value: "OPEN", label: "Open" },
  { value: "TRIAGED", label: "Triaged" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "WAITING_FOR_USER", label: "Waiting for You" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const priorityOptions: {
  value: TicketPriority;
  label: string;
}[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

export function TicketFilters({
  value,
  onChange,
}: TicketFiltersProps) {
  const update = (
    changes: Partial<TicketFilterValues>,
  ) => {
    onChange({
      ...value,
      ...changes,
    });
  };

  const reset = () => {
    onChange({
      search: "",
      status: undefined,
      priority: undefined,
      sort: "newest",
    });
  };

  const hasActiveFilters =
    value.search.trim().length > 0 ||
    value.status !== undefined ||
    value.priority !== undefined ||
    value.sort !== "newest";

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            size={17}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            type="search"
            value={value.search}
            onChange={(event) =>
              update({
                search: event.target.value,
              })
            }
            placeholder="Search tickets..."
            aria-label="Search tickets"
            maxLength={100}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex">
          <select
            value={value.status ?? ""}
            onChange={(event) =>
              update({
                status:
                  (event.target.value ||
                    undefined) as TicketStatus | undefined,
              })
            }
            aria-label="Filter by status"
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-300 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All statuses</option>

            {statusOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={value.priority ?? ""}
            onChange={(event) =>
              update({
                priority:
                  (event.target.value ||
                    undefined) as TicketPriority | undefined,
              })
            }
            aria-label="Filter by priority"
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-300 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All priorities</option>

            {priorityOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={value.sort}
            onChange={(event) =>
              update({
                sort: event.target.value as TicketSort,
              })
            }
            aria-label="Sort tickets"
            className="col-span-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-300 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 sm:col-span-1"
          >
            <option value="newest">
              Newest first
            </option>

            <option value="oldest">
              Oldest first
            </option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:border-slate-600 hover:bg-slate-800 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
          >
            <RotateCcw
              size={15}
              aria-hidden="true"
            />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}