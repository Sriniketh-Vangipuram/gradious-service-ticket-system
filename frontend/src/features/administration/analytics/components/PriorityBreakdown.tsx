import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import type {
  PriorityBreakdownResult,
  TicketPriority,
} from "../types/analytics.types";

interface PriorityBreakdownProps {
  data?: PriorityBreakdownResult[];

  isLoading: boolean;

  isError: boolean;
}

const PRIORITY_LABELS: Record<
  TicketPriority,
  string
> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const PRIORITY_STYLES: Record<
  TicketPriority,
  string
> = {
  LOW: "#64748b",
  MEDIUM: "#94a3b8",
  HIGH: "#cbd5e1",
  CRITICAL: "#f8fafc",
};

function ChartSkeleton() {
  return (
    <div className="h-[300px] w-full animate-pulse rounded-xl bg-slate-950/60" />
  );
}

export function PriorityBreakdown({
  data,
  isLoading,
  isError,
}: PriorityBreakdownProps) {
  if (isError) {
    return (
      <section className="rounded-2xl border border-red-900/60 bg-red-950/20 p-5">
        <h2 className="text-sm font-semibold text-red-300">
          Priority Breakdown
        </h2>

        <p className="mt-2 text-xs text-red-400/80">
          Unable to load priority data.
        </p>
      </section>
    );
  }

  const chartData =
    data?.map((item) => ({
      priority: item.priority,
      name: PRIORITY_LABELS[item.priority],
      count: item.count,
    })) ?? [];

  const total = chartData.reduce(
    (sum, item) => sum + item.count,
    0,
  );

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-white">
          Priority Breakdown
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Ticket distribution by priority.
        </p>
      </div>

      {isLoading ? (
        <ChartSkeleton />
      ) : chartData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
          <p className="text-sm text-slate-500">
            No priority data available for the selected filters.
          </p>
        </div>
      ) : (
        <div className="grid h-[300px] grid-cols-1 items-center gap-4 sm:grid-cols-2">
          <div className="h-full min-h-[240px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="58%"
                  outerRadius="78%"
                  paddingAngle={3}
                >
                  {chartData.map(
                    (entry) => (
                      <Cell
                        key={entry.priority}
                        fill={
                          PRIORITY_STYLES[
                            entry.priority
                          ]
                        }
                      />
                    ),
                  )}
                </Pie>

                <Tooltip
                  contentStyle={{
                    backgroundColor:
                      "#0f172a",
                    border:
                      "1px solid #334155",
                    borderRadius:
                      "12px",
                    color:
                      "#f8fafc",
                  }}
                  formatter={(
                    value,
                  ) => [
                    Number(
                      value,
                    ).toLocaleString(),
                    "Tickets",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {chartData.map(
              (item) => {
                const percentage =
                  total > 0
                    ? (
                        (item.count /
                          total) *
                        100
                      ).toFixed(1)
                    : "0.0";

                return (
                  <div
                    key={
                      item.priority
                    }
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            PRIORITY_STYLES[
                              item.priority
                            ],
                        }}
                      />

                      <span className="text-sm text-slate-300">
                        {item.name}
                      </span>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        {item.count.toLocaleString()}
                      </p>

                      <p className="text-[11px] text-slate-500">
                        {percentage}%
                      </p>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}
    </section>
  );
}