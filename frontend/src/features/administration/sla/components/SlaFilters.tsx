import type {
  SlaMonitoringStatus,
  SlaTicketFilters,
  TicketPriority,
  TicketStatus,
} from "../types/sla.types";

interface SlaFilterOption {
  id: number;
  name: string;
}

interface SlaFiltersProps {
  filters: SlaTicketFilters;

  centers: SlaFilterOption[];
  categories: SlaFilterOption[];
  assignees: SlaFilterOption[];

  onChange: (
    filters: SlaTicketFilters,
  ) => void;

  onReset: () => void;
}

const priorities: TicketPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

const ticketStatuses: TicketStatus[] = [
  "OPEN",
  "TRIAGED",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_FOR_USER",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
];

const monitoringStatuses: SlaMonitoringStatus[] = [
  "PENDING",
  "AT_RISK",
  "OVERDUE",
  "PAUSED",
  "MET",
  "BREACHED",
  "CANCELLED",
];

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

export function SlaFilters({
  filters,
  centers,
  categories,
  assignees,
  onChange,
  onReset,
}: SlaFiltersProps) {
  const updateFilter = (
    key: keyof SlaTicketFilters,
    value: unknown,
  ) => {
    onChange({
      ...filters,
      [key]: value,
      cursor: undefined,
    });
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">
            SLA Filters
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Filter tickets by SLA and ownership state.
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-slate-400 transition hover:text-white"
        >
          Reset filters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Center */}
        <div>
          <label
            htmlFor="sla-center"
            className="mb-1.5 block text-xs font-medium text-slate-400"
          >
            Center
          </label>

          <select
            id="sla-center"
            value={filters.centerId ?? ""}
            onChange={(event) =>
              updateFilter(
                "centerId",
                event.target.value
                  ? Number(event.target.value)
                  : undefined,
              )
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-slate-500"
          >
            <option value="">All centers</option>

            {centers.map((center) => (
              <option
                key={center.id}
                value={center.id}
              >
                {center.name}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label
            htmlFor="sla-priority"
            className="mb-1.5 block text-xs font-medium text-slate-400"
          >
            Priority
          </label>

          <select
            id="sla-priority"
            value={filters.priority ?? ""}
            onChange={(event) =>
              updateFilter(
                "priority",
                event.target.value
                  ? (event.target
                      .value as TicketPriority)
                  : undefined,
              )
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-slate-500"
          >
            <option value="">All priorities</option>

            {priorities.map((priority) => (
              <option
                key={priority}
                value={priority}
              >
                {formatLabel(priority)}
              </option>
            ))}
          </select>
        </div>

        {/* Ticket Status */}
        <div>
          <label
            htmlFor="sla-ticket-status"
            className="mb-1.5 block text-xs font-medium text-slate-400"
          >
            Ticket Status
          </label>

          <select
            id="sla-ticket-status"
            value={filters.ticketStatus ?? ""}
            onChange={(event) =>
              updateFilter(
                "ticketStatus",
                event.target.value
                  ? (event.target
                      .value as TicketStatus)
                  : undefined,
              )
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-slate-500"
          >
            <option value="">
              All ticket statuses
            </option>

            {ticketStatuses.map((status) => (
              <option
                key={status}
                value={status}
              >
                {formatLabel(status)}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="sla-category"
            className="mb-1.5 block text-xs font-medium text-slate-400"
          >
            Category
          </label>

          <select
            id="sla-category"
            value={filters.categoryId ?? ""}
            onChange={(event) =>
              updateFilter(
                "categoryId",
                event.target.value
                  ? Number(event.target.value)
                  : undefined,
              )
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-slate-500"
          >
            <option value="">
              All categories
            </option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Assignee */}
        <div>
          <label
            htmlFor="sla-assignee"
            className="mb-1.5 block text-xs font-medium text-slate-400"
          >
            Assignee
          </label>

          <select
            id="sla-assignee"
            value={filters.assigneeId ?? ""}
            onChange={(event) =>
              updateFilter(
                "assigneeId",
                event.target.value
                  ? Number(event.target.value)
                  : undefined,
              )
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-slate-500"
          >
            <option value="">
              All assignees
            </option>

            {assignees.map((assignee) => (
              <option
                key={assignee.id}
                value={assignee.id}
              >
                {assignee.name}
              </option>
            ))}
          </select>
        </div>

        {/* First Response */}
        <div>
          <label
            htmlFor="sla-first-response"
            className="mb-1.5 block text-xs font-medium text-slate-400"
          >
            First Response SLA
          </label>

          <select
            id="sla-first-response"
            value={
              filters.firstResponseStatus ?? ""
            }
            onChange={(event) =>
              updateFilter(
                "firstResponseStatus",
                event.target.value
                  ? (event.target
                      .value as SlaMonitoringStatus)
                  : undefined,
              )
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-slate-500"
          >
            <option value="">
              All response states
            </option>

            {monitoringStatuses
              .filter(
                (status) =>
                  status !== "PAUSED" &&
                  status !== "BREACHED" &&
                  status !== "CANCELLED",
              )
              .map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {formatLabel(status)}
                </option>
              ))}
          </select>
        </div>

        {/* Resolution */}
        <div>
          <label
            htmlFor="sla-resolution"
            className="mb-1.5 block text-xs font-medium text-slate-400"
          >
            Resolution SLA
          </label>

          <select
            id="sla-resolution"
            value={
              filters.resolutionStatus ?? ""
            }
            onChange={(event) =>
              updateFilter(
                "resolutionStatus",
                event.target.value
                  ? (event.target
                      .value as SlaMonitoringStatus)
                  : undefined,
              )
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-slate-500"
          >
            <option value="">
              All resolution states
            </option>

            {monitoringStatuses.map((status) => (
              <option
                key={status}
                value={status}
              >
                {formatLabel(status)}
              </option>
            ))}
          </select>
        </div>

        {/* Paused */}
        <div>
          <label
            htmlFor="sla-paused"
            className="mb-1.5 block text-xs font-medium text-slate-400"
          >
            Paused
          </label>

          <select
            id="sla-paused"
            value={
              filters.paused === undefined
                ? ""
                : String(filters.paused)
            }
            onChange={(event) => {
              const value =
                event.target.value;

              updateFilter(
                "paused",
                value === ""
                  ? undefined
                  : value === "true",
              );
            }}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-slate-500"
          >
            <option value="">All tickets</option>
            <option value="true">
              Paused only
            </option>
            <option value="false">
              Not paused
            </option>
          </select>
        </div>
      </div>
    </div>
  );
}