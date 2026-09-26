import type { Center } from "../types/center.types";

type CenterCardProps = {
  center: Center;
  onEdit?: (center: Center) => void;
  onToggleStatus?: (center: Center) => void;
};

export function CenterCard({
  center,
  onEdit,
  onToggleStatus,
}: CenterCardProps) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-slate-700 hover:bg-slate-900">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-white">
            {center.name}
          </h3>

          <p className="mt-1 font-mono text-xs text-slate-500">
            {center.code}
          </p>
        </div>

        {/* Status */}
        <span
          className={[
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
            center.isActive
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-slate-700/50 text-slate-400",
          ].join(" ")}
        >
          {center.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Metadata */}
      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
        <div>
          <p className="text-xs text-slate-500">
            Created
          </p>

          <p className="mt-1 text-sm text-slate-300">
            {formatDate(center.createdAt)}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">
            Last updated
          </p>

          <p className="mt-1 text-sm text-slate-300">
            {formatDate(center.updatedAt)}
          </p>
        </div>
      </div>

      {/* Actions */}
      {(onEdit || onToggleStatus) && (
        <div className="mt-5 flex items-center justify-end gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(center)}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            >
              Edit
            </button>
          )}

          {onToggleStatus && (
            <button
              type="button"
              onClick={() => onToggleStatus(center)}
              className={[
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                center.isActive
                  ? "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
              ].join(" ")}
            >
              {center.isActive
                ? "Deactivate"
                : "Activate"}
            </button>
          )}
        </div>
      )}
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}