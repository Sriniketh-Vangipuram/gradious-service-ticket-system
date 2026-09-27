import type {
  AnalyticsGranularity,
  TicketPriority,
} from "../types/analytics.types";

interface AnalyticsFiltersProps {
  from: string;

  to: string;

  centerId?: number;

  categoryId?: number;

  priority?: TicketPriority;

  granularity: AnalyticsGranularity;

  centers: Array<{
    id: number;
    name: string;
    code: string;
  }>;

  categories: Array<{
    id: number;
    name: string;
    code?: string;
  }>;

  isLoadingCenters?: boolean;

  isLoadingCategories?: boolean;

  onChange: (
    updates: {
      from?: string;
      to?: string;
      centerId?: number;
      categoryId?: number;
      priority?: TicketPriority;
      granularity?: AnalyticsGranularity;
    },
  ) => void;

  onReset: () => void;
}

export function AnalyticsFilters({
  from,
  to,
  centerId,
  categoryId,
  priority,
  granularity,
  centers,
  categories,
  isLoadingCenters = false,
  isLoadingCategories = false,
  onChange,
  onReset,
}: AnalyticsFiltersProps) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-white">
          Analytics Filters
        </h2>

        <p className="text-xs text-slate-400">
          Adjust the reporting scope used across the analytics dashboard.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* ---------------------------------------------------------------- */}
        {/* From Date                                                        */}
        {/* ---------------------------------------------------------------- */}

        <div className="space-y-2">
          <label
            htmlFor="analytics-from"
            className="text-xs font-medium text-slate-300"
          >
            From
          </label>

          <input
            id="analytics-from"
            type="date"
            value={from}
            max={to}
            onChange={(event) =>
              onChange({
                from: event.target.value,
              })
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-700"
          />
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* To Date                                                          */}
        {/* ---------------------------------------------------------------- */}

        <div className="space-y-2">
          <label
            htmlFor="analytics-to"
            className="text-xs font-medium text-slate-300"
          >
            To
          </label>

          <input
            id="analytics-to"
            type="date"
            value={to}
            min={from}
            onChange={(event) =>
              onChange({
                to: event.target.value,
              })
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-700"
          />
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Center                                                            */}
        {/* ---------------------------------------------------------------- */}

        <div className="space-y-2">
          <label
            htmlFor="analytics-center"
            className="text-xs font-medium text-slate-300"
          >
            Center
          </label>

          <select
            id="analytics-center"
            value={centerId ?? ""}
            disabled={isLoadingCenters}
            onChange={(event) => {
              const value = event.target.value;

              onChange({
                centerId:
                  value === ""
                    ? undefined
                    : Number(value),
              });
            }}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">
              {isLoadingCenters
                ? "Loading centers..."
                : "All centers"}
            </option>

            {centers.map((center) => (
              <option
                key={center.id}
                value={center.id}
              >
                {center.name} ({center.code})
              </option>
            ))}
          </select>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Category                                                          */}
        {/* ---------------------------------------------------------------- */}

        <div className="space-y-2">
          <label
            htmlFor="analytics-category"
            className="text-xs font-medium text-slate-300"
          >
            Category
          </label>

          <select
            id="analytics-category"
            value={categoryId ?? ""}
            disabled={isLoadingCategories}
            onChange={(event) => {
              const value = event.target.value;

              onChange({
                categoryId:
                  value === ""
                    ? undefined
                    : Number(value),
              });
            }}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">
              {isLoadingCategories
                ? "Loading categories..."
                : "All categories"}
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

        {/* ---------------------------------------------------------------- */}
        {/* Priority                                                          */}
        {/* ---------------------------------------------------------------- */}

        <div className="space-y-2">
          <label
            htmlFor="analytics-priority"
            className="text-xs font-medium text-slate-300"
          >
            Priority
          </label>

          <select
            id="analytics-priority"
            value={priority ?? ""}
            onChange={(event) => {
              const value = event.target.value;

              onChange({
                priority:
                  value === ""
                    ? undefined
                    : (value as TicketPriority),
              });
            }}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-700"
          >
            <option value="">
              All priorities
            </option>

            <option value="LOW">
              Low
            </option>

            <option value="MEDIUM">
              Medium
            </option>

            <option value="HIGH">
              High
            </option>

            <option value="CRITICAL">
              Critical
            </option>
          </select>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Trend Granularity                                                 */}
        {/* ---------------------------------------------------------------- */}

        <div className="space-y-2">
          <label
            htmlFor="analytics-granularity"
            className="text-xs font-medium text-slate-300"
          >
            Trend interval
          </label>

          <select
            id="analytics-granularity"
            value={granularity}
            onChange={(event) =>
              onChange({
                granularity:
                  event.target
                    .value as AnalyticsGranularity,
              })
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-700"
          >
            <option value="day">
              Daily
            </option>

            <option value="week">
              Weekly
            </option>

            <option value="month">
              Monthly
            </option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Actions                                                            */}
      {/* ------------------------------------------------------------------ */}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
        >
          Reset filters
        </button>
      </div>
    </section>
  );
}