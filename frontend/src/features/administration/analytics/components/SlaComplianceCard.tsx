import type {
  SlaComplianceResult,
} from "../types/analytics.types";

interface SlaComplianceCardProps {
  data?: SlaComplianceResult;
  isLoading: boolean;
  isError: boolean;
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

function MetricSkeleton() {
  return (
    <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-800" />
  );
}

export function SlaComplianceCard({
  data,
  isLoading,
  isError,
}: SlaComplianceCardProps) {
  if (isError) {
    return (
      <section className="rounded-2xl border border-red-900/60 bg-red-950/20 p-5">
        <h2 className="text-sm font-semibold text-red-300">
          SLA Compliance
        </h2>

        <p className="mt-2 text-xs text-red-400/80">
          Unable to load SLA compliance data.
        </p>
      </section>
    );
  }

  const complianceRate =
    data?.complianceRate ?? 0;

  const totalCompleted =
    data?.totalCompleted ?? 0;

  const met =
    data?.met ?? 0;

  const breached =
    data?.breached ?? 0;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-white">
          SLA Compliance
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Completed SLA cycles within the selected reporting scope.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs font-medium text-slate-500">
            Compliance Rate
          </p>

          {isLoading ? (
            <div className="mt-3">
              <MetricSkeleton />
            </div>
          ) : (
            <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
              {formatPercentage(
                complianceRate,
              )}
            </p>
          )}

          <p className="mt-2 text-xs text-slate-600">
            Based on met versus breached SLA cycles.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs font-medium text-slate-500">
            Completed Cycles
          </p>

          {isLoading ? (
            <div className="mt-3">
              <MetricSkeleton />
            </div>
          ) : (
            <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
              {totalCompleted.toLocaleString()}
            </p>
          )}

          <p className="mt-2 text-xs text-slate-600">
            Cancelled tickets are excluded.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Met
            </span>

            <span className="text-xs font-medium text-slate-300">
              {isLoading
                ? "—"
                : met.toLocaleString()}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            {!isLoading && (
              <div
                className="h-full rounded-full bg-slate-400 transition-all"
                style={{
                  width:
                    totalCompleted > 0
                      ? `${(met / totalCompleted) * 100}%`
                      : "0%",
                }}
              />
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Breached
            </span>

            <span className="text-xs font-medium text-slate-300">
              {isLoading
                ? "—"
                : breached.toLocaleString()}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            {!isLoading && (
              <div
                className="h-full rounded-full bg-slate-600 transition-all"
                style={{
                  width:
                    totalCompleted > 0
                      ? `${(breached / totalCompleted) * 100}%`
                      : "0%",
                }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}