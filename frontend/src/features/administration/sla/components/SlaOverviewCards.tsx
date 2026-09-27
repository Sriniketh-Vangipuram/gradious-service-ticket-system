import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  PauseCircle,
  ShieldAlert,
  Timer,
  XCircle,
} from "lucide-react";

import type {
  SlaOverview,
} from "../types/sla.types";

interface SlaOverviewCardsProps {
  overview: SlaOverview;
  isLoading?: boolean;
}

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone:
    | "neutral"
    | "warning"
    | "danger"
    | "success";
}

function MetricCard({
  label,
  value,
  icon,
  tone,
}: MetricCardProps) {
  const toneClasses = {
    neutral:
      "border-slate-800 bg-slate-900/70 text-slate-200",

    warning:
      "border-amber-500/20 bg-amber-500/5 text-amber-400",

    danger:
      "border-red-500/20 bg-red-500/5 text-red-400",

    success:
      "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
  };

  return (
    <div
      className={`rounded-xl border p-4 ${toneClasses[tone]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold text-white">
            {value}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950/60">
          {icon}
        </div>
      </div>
    </div>
  );
}

function OverviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {children}
      </div>
    </section>
  );
}

function LoadingCard() {
  return (
    <div className="h-[92px] animate-pulse rounded-xl border border-slate-800 bg-slate-900/70" />
  );
}

export function SlaOverviewCards({
  overview,
  isLoading = false,
}: SlaOverviewCardsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <OverviewSection title="Ticket SLA">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </OverviewSection>

        <OverviewSection title="First Response SLA">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </OverviewSection>

        <OverviewSection title="Resolution SLA">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </OverviewSection>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OverviewSection title="Ticket SLA">
        <MetricCard
          label="Active"
          value={overview.tickets.active}
          icon={<Clock3 className="h-4 w-4" />}
          tone="neutral"
        />

        <MetricCard
          label="Paused"
          value={overview.tickets.paused}
          icon={<PauseCircle className="h-4 w-4" />}
          tone="warning"
        />

        <MetricCard
          label="Due Soon"
          value={overview.tickets.dueSoon}
          icon={<Timer className="h-4 w-4" />}
          tone="warning"
        />

        <MetricCard
          label="Overdue"
          value={overview.tickets.overdue}
          icon={<AlertCircle className="h-4 w-4" />}
          tone="danger"
        />
      </OverviewSection>

      <OverviewSection title="First Response SLA">
        <MetricCard
          label="Pending"
          value={overview.firstResponse.pending}
          icon={<Clock3 className="h-4 w-4" />}
          tone="neutral"
        />

        <MetricCard
          label="At Risk"
          value={overview.firstResponse.atRisk}
          icon={<ShieldAlert className="h-4 w-4" />}
          tone="warning"
        />

        <MetricCard
          label="Overdue"
          value={overview.firstResponse.overdue}
          icon={<AlertCircle className="h-4 w-4" />}
          tone="danger"
        />

        <MetricCard
          label="Met"
          value={overview.firstResponse.met}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="success"
        />
      </OverviewSection>

      <OverviewSection title="Resolution SLA">
        <MetricCard
          label="Pending"
          value={overview.resolution.pending}
          icon={<Clock3 className="h-4 w-4" />}
          tone="neutral"
        />

        <MetricCard
          label="At Risk"
          value={overview.resolution.atRisk}
          icon={<ShieldAlert className="h-4 w-4" />}
          tone="warning"
        />

        <MetricCard
          label="Paused"
          value={overview.resolution.paused}
          icon={<PauseCircle className="h-4 w-4" />}
          tone="warning"
        />

        <MetricCard
          label="Overdue"
          value={overview.resolution.overdue}
          icon={<AlertCircle className="h-4 w-4" />}
          tone="danger"
        />

        <MetricCard
          label="Met"
          value={overview.resolution.met}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="success"
        />

        <MetricCard
          label="Breached"
          value={overview.resolution.breached}
          icon={<ShieldAlert className="h-4 w-4" />}
          tone="danger"
        />

        <MetricCard
          label="Cancelled"
          value={overview.resolution.cancelled}
          icon={<XCircle className="h-4 w-4" />}
          tone="neutral"
        />
      </OverviewSection>
    </div>
  );
}