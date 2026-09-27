import type {
  AnalyticsOverview,
} from "../types/analytics.types";

interface AnalyticsOverviewCardsProps {
  data?: AnalyticsOverview;

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

function formatPercentage(
  value: number,
): string {
  return `${value.toFixed(1)}%`;
}

function MetricSkeleton() {
  return (
    <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-800" />
  );
}

interface MetricCardProps {
  label: string;

  value: string;

  description: string;

  isLoading: boolean;
}

function MetricCard({
  label,
  value,
  description,
  isLoading,
}: MetricCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-400">
          {label}
        </p>

        <div className="h-2 w-2 rounded-full bg-slate-500" />
      </div>

      {isLoading ? (
        <MetricSkeleton />
      ) : (
        <p className="text-2xl font-semibold tracking-tight text-white">
          {value}
        </p>
      )}

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </article>
  );
}

export function AnalyticsOverviewCards({
  data,
  isLoading,
  isError,
}: AnalyticsOverviewCardsProps) {
  if (isError) {
    return (
      <section className="rounded-2xl border border-red-900/60 bg-red-950/20 p-5">
        <p className="text-sm font-medium text-red-300">
          Unable to load analytics overview.
        </p>

        <p className="mt-1 text-xs text-red-400/80">
          The detailed analytics sections may still be available
          if their individual requests succeed.
        </p>
      </section>
    );
  }

  const totalTickets =
    data?.ticketVolume.total ?? 0;

  const slaCompliance =
    data?.slaCompliance.complianceRate ?? 0;

  const averageResponseTime =
    data?.responseTime.averageMinutes ?? null;

  const averageResolutionTime =
    data?.resolutionTime.averageMinutes ?? null;

  const resolutionRate =
    data?.resolutionRate.resolutionRate ?? 0;

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-white">
          Overview
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Key service performance metrics for the selected period.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total Tickets"
          value={totalTickets.toLocaleString()}
          description="Tickets created within the selected scope."
          isLoading={isLoading}
        />

        <MetricCard
          label="SLA Compliance"
          value={formatPercentage(slaCompliance)}
          description={
            data
              ? `${data.slaCompliance.met.toLocaleString()} met · ${data.slaCompliance.breached.toLocaleString()} breached`
              : "Completed SLA cycles"
          }
          isLoading={isLoading}
        />

        <MetricCard
          label="Avg. First Response"
          value={formatMinutes(
            averageResponseTime,
          )}
          description={
            data
              ? `${data.responseTime.sampleSize.toLocaleString()} response samples`
              : "Tickets with a first response"
          }
          isLoading={isLoading}
        />

        <MetricCard
          label="Avg. Resolution"
          value={formatMinutes(
            averageResolutionTime,
          )}
          description={
            data
              ? `${data.resolutionTime.sampleSize.toLocaleString()} resolved tickets`
              : "Tickets with a resolution timestamp"
          }
          isLoading={isLoading}
        />

        <MetricCard
          label="Resolution Rate"
          value={formatPercentage(resolutionRate)}
          description={
            data
              ? `${data.resolutionRate.resolvedTickets.toLocaleString()} of ${data.resolutionRate.totalTickets.toLocaleString()} tickets resolved`
              : "Tickets resolved within the selected period"
          }
          isLoading={isLoading}
        />
      </div>
    </section>
  );
}