import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import type {
  TicketVolumeResult,
  TicketStatus,
} from "../types/analytics.types";

interface TicketVolumeChartProps {
  data?: TicketVolumeResult;

  isLoading: boolean;

  isError: boolean;
}

interface ChartItem {
  status: string;

  count: number;
}

const STATUS_LABELS: Record<
  TicketStatus,
  string
> = {
  OPEN: "Open",
  TRIAGED: "Triaged",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  WAITING_FOR_USER: "Waiting for User",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

function formatStatus(
  status: TicketStatus,
): string {
  return STATUS_LABELS[status] ?? status;
}

function ChartSkeleton() {
  return (
    <div className="h-[320px] w-full animate-pulse rounded-xl bg-slate-950/60" />
  );
}

export function TicketVolumeChart({
  data,
  isLoading,
  isError,
}: TicketVolumeChartProps) {
  if (isError) {
    return (
      <section className="rounded-2xl border border-red-900/60 bg-red-950/20 p-5">
        <h2 className="text-sm font-semibold text-red-300">
          Ticket Volume
        </h2>

        <p className="mt-2 text-xs text-red-400/80">
          Unable to load ticket volume data.
        </p>
      </section>
    );
  }

  const chartData: ChartItem[] =
    data?.byStatus.map((item) => ({
      status: formatStatus(item.status),
      count: item.count,
    })) ?? [];

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white">
            Ticket Volume
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Tickets grouped by their current status.
          </p>
        </div>

        {data && (
          <div className="text-right">
            <p className="text-lg font-semibold text-white">
              {data.total.toLocaleString()}
            </p>

            <p className="text-[11px] text-slate-500">
              Total tickets
            </p>
          </div>
        )}
      </div>

      {isLoading ? (
        <ChartSkeleton />
      ) : chartData.length === 0 ? (
        <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
          <p className="text-sm text-slate-500">
            No ticket data available for the selected filters.
          </p>
        </div>
      ) : (
        <div className="h-[320px] w-full">
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
                left: 20,
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
                dataKey="status"
                width={105}
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
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}