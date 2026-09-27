import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  AnalyticsGranularity,
  TicketTrendPoint,
} from "../types/analytics.types";

interface TicketTrendChartProps {
  data?: TicketTrendPoint[];

  granularity: AnalyticsGranularity;

  isLoading: boolean;

  isError: boolean;
}

function formatPeriod(
  period: string,
  granularity: AnalyticsGranularity,
): string {
  if (granularity === "day") {
    const date = new Date(
      `${period}T00:00:00`,
    );

    if (Number.isNaN(date.getTime())) {
      return period;
    }

    return date.toLocaleDateString(
      undefined,
      {
        day: "2-digit",
        month: "short",
      },
    );
  }

  if (granularity === "month") {
    const [year, month] =
      period.split("-");

    const date = new Date(
      Number(year),
      Number(month) - 1,
      1,
    );

    if (Number.isNaN(date.getTime())) {
      return period;
    }

    return date.toLocaleDateString(
      undefined,
      {
        month: "short",
        year: "numeric",
      },
    );
  }

  return period;
}

function ChartSkeleton() {
  return (
    <div className="h-[340px] w-full animate-pulse rounded-xl bg-slate-950/60" />
  );
}

export function TicketTrendChart({
  data,
  granularity,
  isLoading,
  isError,
}: TicketTrendChartProps) {
  if (isError) {
    return (
      <section className="rounded-2xl border border-red-900/60 bg-red-950/20 p-5">
        <h2 className="text-sm font-semibold text-red-300">
          Ticket Trends
        </h2>

        <p className="mt-2 text-xs text-red-400/80">
          Unable to load ticket trend data.
        </p>
      </section>
    );
  }

  const chartData =
    data?.map((item) => ({
      period: item.period,
      label: formatPeriod(
        item.period,
        granularity,
      ),
      count: item.count,
    })) ?? [];

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-white">
          Ticket Trends
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Ticket creation volume over the selected period.
        </p>
      </div>

      {isLoading ? (
        <ChartSkeleton />
      ) : chartData.length === 0 ? (
        <div className="flex h-[340px] items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
          <p className="text-sm text-slate-500">
            No ticket trend data available for the selected filters.
          </p>
        </div>
      ) : (
        <div className="h-[340px] w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={chartData}
              margin={{
                top: 8,
                right: 20,
                left: 0,
                bottom: 8,
              }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="#1e293b"
              />

              <XAxis
                dataKey="label"
                tick={{
                  fill: "#64748b",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
                minTickGap={24}
              />

              <YAxis
                allowDecimals={false}
                tick={{
                  fill: "#64748b",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "12px",
                  color: "#f8fafc",
                }}
                labelStyle={{
                  color: "#cbd5e1",
                  marginBottom: "4px",
                }}
                formatter={(value) => [
                  Number(value).toLocaleString(),
                  "Tickets",
                ]}
              />

              <Line
                type="monotone"
                dataKey="count"
                name="Tickets"
                stroke="#94a3b8"
                strokeWidth={2}
                dot={{
                  r: 3,
                  strokeWidth: 1,
                  fill: "#0f172a",
                }}
                activeDot={{
                  r: 5,
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}