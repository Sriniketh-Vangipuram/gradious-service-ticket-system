import { AlertTriangle, Clock3 } from "lucide-react";

interface TechnicianSlaIndicatorProps {
  label: string;
  dueAt: string | null;
  now: number;
}

function formatDueDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function TechnicianSlaIndicator({
  label,
  dueAt,
  now,
}: TechnicianSlaIndicatorProps) {
  if (dueAt === null) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-slate-600">
        <Clock3 size={13} aria-hidden="true" />
        <span>{label}: Not applicable</span>
      </div>
    );
  }

  const isBreached = new Date(dueAt).getTime() <= now;

  return (
    <div
      className={[
        "inline-flex items-center gap-1.5 text-xs",
        isBreached ? "text-rose-300" : "text-slate-400",
      ].join(" ")}
      title={`${label} deadline: ${formatDueDate(dueAt)}`}
    >
      {isBreached ? (
        <AlertTriangle size={13} aria-hidden="true" />
      ) : (
        <Clock3 size={13} aria-hidden="true" />
      )}

      <span>
        {label}: {isBreached ? "Breached" : formatDueDate(dueAt)}
      </span>
    </div>
  );
}