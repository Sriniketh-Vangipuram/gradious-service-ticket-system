import type {
  TimeMetricResult,
} from "../types/analytics.types";

interface TimeMetricCardProps {
  title: string;
  description: string;
  data?: TimeMetricResult;
  isLoading: boolean;
  isError: boolean;
}

function formatMinutes(
  minutes: number | null,
): string {
  if (minutes === null) {
    return "—";
  }

  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }

  const hours = minutes / 60;

  if (hours < 24) {
    return `${hours.toFixed(1)} hrs`;
  }

  const days = hours / 24;

  return `${days.toFixed(1)} days`;
}

function MetricSkeleton() {
  return (
    <div className="h-8 w-28 animate-pulse rounded-lg bg-slate-800" />
  );
}

export function TimeMetricCard({
  title,
  description,
  data,
  isLoading,
  isError,
}: TimeMetricCardProps) {
  if (isError) {
    return (
      <section className="rounded-2xl border border-red-900/60 bg-red-950/20 p-5">
        <h2 className="text-sm font-semibold text-red-300">
          {title}
        </h2>

        <p className="mt-2 text-xs text-red-400/80">
          Unable to load this metric.
        </p>
      </section>
    );
  }

  const averageMinutes =
    data?.averageMinutes ?? null;

  const sampleSize =
    data?.sampleSize ?? 0;

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

      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5">
        <p className="text-xs font-medium text-slate-500">
          Average Time
        </p>

        {isLoading ? (
          <div className="mt-3">
            <MetricSkeleton />
          </div>
        ) : (
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {formatMinutes(
              averageMinutes,
            )}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
          <span className="text-xs text-slate-500">
            Samples
          </span>

          <span className="text-sm font-medium text-slate-300">
            {isLoading
              ? "—"
              : sampleSize.toLocaleString()}
          </span>
        </div>
      </div>
    </section>
  );
}