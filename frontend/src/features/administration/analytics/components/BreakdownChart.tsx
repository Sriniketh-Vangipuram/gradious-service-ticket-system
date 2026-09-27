import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  BreakdownResult,
} from "../types/analytics.types";

interface BreakdownChartProps {
  title: string;

  description: string;

  data?: BreakdownResult[];

  isLoading: boolean;

  isError: boolean;
}

function ChartSkeleton() {
  return (
    <div className="h-[300px] w-full animate-pulse rounded-xl bg-slate-950/60" />
  );
}

export function BreakdownChart({
  title,
  description,
  data,
  isLoading,
  isError,
}: BreakdownChartProps) {
  if (isError) {
    return (
      <section className="rounded-2xl border border-red-900/60 bg-red-950/20 p-5">
        <h2 className="text-sm font-semibold text-red-300">
          {title}
        </h2>

        <p className="mt-2 text-xs text-red-400/80">
          Unable to load this breakdown.
        </p>
      </section>
    );
  }

  const chartData =
    data?.map((item) => ({
      name: item.name,
      count: item.count,
    })) ?? [];

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-white">
          {title}
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>

      {isLoading ? (
        <ChartSkeleton />
      ) : chartData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
          <p className="text-sm text-slate-500">
            No data available for the selected filters.
          </p>
        </div>
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{
                top: 8,
                right: 20,
                left: 10,
                bottom: 8,
              }}
            >
              <CartesianGrid
                horizontal={false}
                strokeDasharray="3 3"
                stroke="#1e293b"
              />

              <XAxis
                type="number"
                allowDecimals={false}
                tick={{
                  fill: "#64748b",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{
                  fill: "#94a3b8",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                cursor={{
                  fill: "rgba(51, 65, 85, 0.18)",
                }}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "12px",
                  color: "#f8fafc",
                }}
                labelStyle={{
                  color: "#cbd5e1",
                }}
                formatter={(value) => [
                  Number(value).toLocaleString(),
                  "Tickets",
                ]}
              />

              <Bar
                dataKey="count"
                name="Tickets"
                fill="#94a3b8"
                radius={[
                  0,
                  6,
                  6,
                  0,
                ]}
                maxBarSize={26}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}