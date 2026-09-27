import type {
  TechnicianWorkloadResult,
} from "../types/analytics.types";

interface TechnicianWorkloadTableProps {
  data?: TechnicianWorkloadResult[];
  isLoading: boolean;
  isError: boolean;
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-12 animate-pulse rounded-xl bg-slate-950/60"
        />
      ))}
    </div>
  );
}

export function TechnicianWorkloadTable({
  data,
  isLoading,
  isError,
}: TechnicianWorkloadTableProps) {
  if (isError) {
    return (
      <section className="rounded-2xl border border-red-900/60 bg-red-950/20 p-5">
        <h2 className="text-sm font-semibold text-red-300">
          Technician Workload
        </h2>

        <p className="mt-2 text-xs text-red-400/80">
          Unable to load technician workload data.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-white">
          Technician Workload
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Assigned, active, and resolved tickets across technicians.
        </p>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : !data || data.length === 0 ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
          <p className="text-sm text-slate-500">
            No technician workload data available for the selected filters.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse">
            <thead>
              <tr className="border-b border-slate-800">
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Technician
                </th>

                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Assigned
                </th>

                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Active
                </th>

                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Resolved
                </th>

                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Active Share
                </th>
              </tr>
            </thead>

            <tbody>
              {data.map((technician) => {
                const activeShare =
                  technician.assignedTickets > 0
                    ? (
                        (technician.activeTickets /
                          technician.assignedTickets) *
                        100
                      ).toFixed(1)
                    : "0.0";

                return (
                  <tr
                    key={technician.technicianId}
                    className="border-b border-slate-800/70 transition hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
                          {technician.technicianName
                            .split(" ")
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="text-sm font-medium text-slate-200">
                            {technician.technicianName}
                          </p>

                          <p className="text-[11px] text-slate-600">
                            ID #{technician.technicianId}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-medium text-slate-300">
                      {technician.assignedTickets.toLocaleString()}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <span className="inline-flex min-w-10 justify-center rounded-lg bg-slate-800 px-2.5 py-1 text-sm font-medium text-slate-200">
                        {technician.activeTickets.toLocaleString()}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-medium text-slate-300">
                      {technician.resolvedTickets.toLocaleString()}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-slate-400"
                            style={{
                              width: `${activeShare}%`,
                            }}
                          />
                        </div>

                        <span className="w-12 text-right text-xs text-slate-500">
                          {activeShare}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}