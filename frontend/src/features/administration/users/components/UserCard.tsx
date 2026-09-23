import {
  Mail,
  MapPin,
  MonitorCog,
  TicketCheck,
} from "lucide-react";

import type { AdministrationUser } from "../types/user.types";

interface UserCardProps {
  user: AdministrationUser;
  onManageSpecializations?: (
    user: AdministrationUser,
  ) => void;
}



const ROLE_LABELS: Record<
  AdministrationUser["role"],
  string
> = {
  EMPLOYEE: "Employee",
  TECHNICIAN: "Technician",
  CENTER_MANAGER: "Center Manager",
  ADMIN: "Administrator",
};

const SPECIALIZATION_LABELS: Record<
  AdministrationUser["specializations"][number]["specialization"],
  string
> = {
  SOFTWARE: "Software",
  HARDWARE: "Hardware",
  NETWORK: "Network",
};

export function UserCard({
  user,
  onManageSpecializations,
}: UserCardProps) {
  const isTechnician = user.role === "TECHNICIAN";

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-700">
      {/* ---------------------------------------------------------------- */}
      {/* Header                                                           */}
      {/* ---------------------------------------------------------------- */}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-white">
            {user.fullName}
          </h3>

          <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
            <Mail className="h-4 w-4 shrink-0" />

            <span className="truncate">
              {user.email}
            </span>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            user.isActive
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-slate-700/60 text-slate-400"
          }`}
        >
          {user.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Role                                                             */}
      {/* ---------------------------------------------------------------- */}

      <div className="mt-4">
        <span className="inline-flex rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300">
          {ROLE_LABELS[user.role]}
        </span>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Operational information                                          */}
      {/* ---------------------------------------------------------------- */}

      <div className="mt-5 space-y-3 border-t border-slate-800 pt-4">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

          <div>
            <p className="text-xs text-slate-500">
              Primary center
            </p>

            <p className="mt-0.5 text-sm text-slate-300">
              {user.center
                ? `${user.center.name} (${user.center.code})`
                : "Not assigned"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MonitorCog className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

          <div>
            <p className="text-xs text-slate-500">
              Lab assignment
            </p>

            <p className="mt-0.5 text-sm text-slate-300">
              {user.lab
                ? `${user.lab.name} (${user.lab.code})`
                : "Not assigned"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <TicketCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

          <div>
            <p className="text-xs text-slate-500">
              Assigned tickets
            </p>

            <p className="mt-0.5 text-sm text-slate-300">
              {user._count.assignedTickets}
            </p>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Specializations                                                  */}
      {/* ---------------------------------------------------------------- */}

      {isTechnician && (
        <div className="mt-5 border-t border-slate-800 pt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-slate-500">
              Specializations
            </p>

            {onManageSpecializations && (
              <button
                type="button"
                onClick={() =>
                  onManageSpecializations(user)
                }
                className="text-xs font-medium text-slate-300 transition hover:text-white"
              >
                Manage
              </button>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {user.specializations.length > 0 ? (
              user.specializations.map(
                ({ specialization }) => (
                  <span
                    key={specialization}
                    className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-300"
                  >
                    {
                      SPECIALIZATION_LABELS[
                        specialization
                      ]
                    }
                  </span>
                ),
              )
            ) : (
              <span className="text-xs text-slate-500">
                No specializations assigned
              </span>
            )}
          </div>
        </div>
      )}
    </article>
  );
}