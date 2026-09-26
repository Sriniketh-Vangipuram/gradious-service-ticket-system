import type { Center } from "../types/center.types";
import { CenterCard } from "./CenterCard";

type CenterListProps = {
  centers: Center[];
  isLoading: boolean;
  onEdit?: (center: Center) => void;
  onToggleStatus?: (center: Center) => void;
};

export function CenterList({
  centers,
  isLoading,
  onEdit,
  onToggleStatus,
}: CenterListProps) {
  /* ------------------------------------------------------------------------ */
  /* Loading state                                                            */
  /* ------------------------------------------------------------------------ */

  if (isLoading) {
    return <CenterListSkeleton />;
  }

  /* ------------------------------------------------------------------------ */
  /* Empty state                                                              */
  /* ------------------------------------------------------------------------ */

  if (centers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-12 text-center">
        <h3 className="text-sm font-semibold text-white">
          No centers found
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          Try changing your search or filters.
        </p>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Results                                                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {centers.map((center) => (
          <CenterCard
            key={center.id}
            center={center}
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading skeleton                                                           */
/* -------------------------------------------------------------------------- */

function CenterListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map(
        (_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-xl border border-slate-800 bg-slate-900/70 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-slate-800" />

                <div className="h-3 w-20 rounded bg-slate-800" />
              </div>

              <div className="h-6 w-16 rounded-full bg-slate-800" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
              <div className="space-y-2">
                <div className="h-3 w-14 rounded bg-slate-800" />

                <div className="h-4 w-24 rounded bg-slate-800" />
              </div>

              <div className="space-y-2">
                <div className="h-3 w-20 rounded bg-slate-800" />

                <div className="h-4 w-24 rounded bg-slate-800" />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <div className="h-9 w-16 rounded-lg bg-slate-800" />

              <div className="h-9 w-24 rounded-lg bg-slate-800" />
            </div>
          </div>
        ),
      )}
    </div>
  );
}