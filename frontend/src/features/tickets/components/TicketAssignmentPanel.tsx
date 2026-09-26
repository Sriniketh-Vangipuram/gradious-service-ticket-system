import {
  RefreshCw,
  UserRound,
} from "lucide-react";
import { useState } from "react";

import { useAuth } from "../../auth/hooks/useAuth";
import {
  useAssignCenterManager,
  useAssignTechnician,
  useEligibleManagers,
  useEligibleTechnicians,
} from "../hooks/useTickets";
import type {
  EligibleManager,
  Ticket,
} from "../types/ticket.types";

interface TicketAssignmentPanelProps {
  ticket: Ticket;
}

function formatSpecialization(
  specialization: string,
): string {
  return (
    specialization.charAt(0) +
    specialization.slice(1).toLowerCase()
  );
}

export function TicketAssignmentPanel({
  ticket,
}: TicketAssignmentPanelProps) {
  const { user } = useAuth();

  const [selectedManagerId, setSelectedManagerId] =
    useState<number | null>(ticket.centerManagerId);

  const [selectedTechnicianId, setSelectedTechnicianId] =
    useState<number | null>(ticket.assigneeId);

  const isAdmin = user?.role === "ADMIN";
  const isCenterManager =
    user?.role === "CENTER_MANAGER";

  const managersQuery = useEligibleManagers(
    isAdmin ? ticket.id : null,
  );

  const techniciansQuery = useEligibleTechnicians(
    isCenterManager ? ticket.id : null,
  );

  const assignManagerMutation =
    useAssignCenterManager();

  const assignTechnicianMutation =
    useAssignTechnician();
    
  const managers =
    managersQuery.data?.data.managers ?? [];

  const technicians =
    techniciansQuery.data?.data.technicians ?? [];

  const isManagerAssignmentSaving =
    assignManagerMutation.isPending;

  const isTechnicianAssignmentSaving =
    assignTechnicianMutation.isPending;

  function handleManagerChange(
    value: string,
  ) {
    const managerId =
      value === "" ? null : Number(value);

    setSelectedManagerId(managerId);

    if (managerId === null) {
      return;
    }

    assignManagerMutation.mutate({
      ticketId: ticket.id,
      centerManagerId: managerId,
    });
  }

  function handleTechnicianChange(
    value: string,
  ) {
    const technicianId =
      value === "" ? null : Number(value);

    setSelectedTechnicianId(technicianId);

    if (technicianId === null) {
      return;
    }

    assignTechnicianMutation.mutate({
      ticketId: ticket.id,
      technicianId,
    });
  }

  return (
    <div className="mt-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-300">
            <UserRound
              size={17}
              aria-hidden="true"
            />

            <h2 className="text-sm font-semibold">
              Assignment
            </h2>
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Manage the administrative and technical ownership
            of this ticket.
          </p>
        </div>

        {(managersQuery.isFetching ||
          techniciansQuery.isFetching ||
          isManagerAssignmentSaving ||
          isTechnicianAssignmentSaving) && (
          <RefreshCw
            size={15}
            className="mt-1 animate-spin text-slate-500"
            aria-label="Assignment operation in progress"
          />
        )}
      </div>

      {/* Ticket center */}
      <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
        <p className="text-xs text-slate-500">
          Service center
        </p>

        <p className="mt-2 text-sm font-medium text-slate-200">
          {ticket.center.name}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {ticket.center.code}
        </p>
      </div>

      {/* Center Manager */}
      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
        <div>
          <p className="text-xs font-medium text-slate-400">
            Center manager
          </p>

          <p className="mt-1 text-[11px] leading-5 text-slate-600">
            Administrative owner responsible for routing this
            ticket to a technician.
          </p>
        </div>

        {ticket.centerManager ? (
          <div className="mt-3">
            <p className="text-sm font-medium text-slate-200">
              {ticket.centerManager.fullName}
            </p>

            <p className="mt-1 break-all text-xs text-slate-500">
              {ticket.centerManager.email}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-400">
            No center manager assigned.
          </p>
        )}

        {isAdmin && (
          <div className="mt-4">
            <label
              htmlFor="ticket-center-manager"
              className="block text-xs font-medium text-slate-400"
            >
              Assign center manager
            </label>

            {managersQuery.isLoading ? (
              <div
                className="mt-2 h-11 animate-pulse rounded-xl bg-slate-800"
                aria-label="Loading center managers"
              />
            ) : managersQuery.isError ? (
              <div className="mt-2 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <p className="text-sm text-red-300">
                  We couldn't load eligible center managers.
                </p>

                <button
                  type="button"
                  onClick={() => managersQuery.refetch()}
                  disabled={managersQuery.isFetching}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={14}
                    className={
                      managersQuery.isFetching
                        ? "animate-spin"
                        : ""
                    }
                    aria-hidden="true"
                  />

                  Retry
                </button>
              </div>
            ) : managers.length === 0 ? (
              <div className="mt-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-sm text-amber-200">
                  No eligible center managers are currently
                  available for this center.
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-200/60">
                  An active center manager must have access to
                  this ticket's service center.
                </p>
              </div>
            ) : (
              <select
                id="ticket-center-manager"
                value={selectedManagerId ?? ""}
                onChange={(event) =>
                  handleManagerChange(
                    event.target.value,
                  )
                }
                disabled={isManagerAssignmentSaving}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  Select a center manager
                </option>

                {managers.map(
                  (manager: EligibleManager) => (
                    <option
                      key={manager.id}
                      value={manager.id}
                    >
                      {manager.fullName}
                    </option>
                  ),
                )}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Technician */}
      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
        <div>
          <p className="text-xs font-medium text-slate-400">
            Technician
          </p>

          <p className="mt-1 text-[11px] leading-5 text-slate-600">
            Technical owner responsible for executing the
            requested work.
          </p>
        </div>

        {ticket.assignee ? (
          <div className="mt-3">
            <p className="text-sm font-medium text-slate-200">
              {ticket.assignee.fullName}
            </p>

            <p className="mt-1 break-all text-xs text-slate-500">
              {ticket.assignee.email}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-400">
            No technician assigned.
          </p>
        )}

        {isCenterManager && (
          <div className="mt-4">
            {!ticket.centerManagerId ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-sm text-amber-200">
                  Assign a center manager before assigning a
                  technician.
                </p>
              </div>
            ) : techniciansQuery.isLoading ? (
              <div
                className="h-11 animate-pulse rounded-xl bg-slate-800"
                aria-label="Loading technicians"
              />
            ) : techniciansQuery.isError ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <p className="text-sm text-red-300">
                  We couldn't load eligible technicians.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    techniciansQuery.refetch()
                  }
                  disabled={techniciansQuery.isFetching}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={14}
                    className={
                      techniciansQuery.isFetching
                        ? "animate-spin"
                        : ""
                    }
                    aria-hidden="true"
                  />

                  Retry
                </button>
              </div>
            ) : technicians.length === 0 ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-sm text-amber-200">
                  No eligible technicians are currently
                  available for this center.
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-200/60">
                  An active technician must have access to
                  this ticket's service center.
                </p>
              </div>
            ) : (
              <>
                <label
                  htmlFor="ticket-technician"
                  className="block text-xs font-medium text-slate-400"
                >
                  Assign technician
                </label>

                <select
                  id="ticket-technician"
                  value={selectedTechnicianId ?? ""}
                  onChange={(event) =>
                    handleTechnicianChange(
                      event.target.value,
                    )
                  }
                  disabled={isTechnicianAssignmentSaving}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    Select a technician
                  </option>

                  {technicians.map((technician) => (
                    <option
                      key={technician.id}
                      value={technician.id}
                    >
                      {technician.fullName}
                      {technician.specializations.length > 0
                        ? ` — ${technician.specializations
                            .map(formatSpecialization)
                            .join(", ")}`
                        : ""}
                    </option>
                  ))}
                </select>

                {selectedTechnicianId !== null && (
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                    {(() => {
                      const technician =
                        technicians.find(
                          (candidate) =>
                            candidate.id ===
                            selectedTechnicianId,
                        );

                      if (!technician) {
                        return (
                          <p className="text-sm text-slate-400">
                            Technician information unavailable.
                          </p>
                        );
                      }

                      return (
                        <>
                          <p className="text-xs text-slate-500">
                            Selected technician
                          </p>

                          <p className="mt-2 text-sm font-medium text-slate-200">
                            {technician.fullName}
                          </p>

                          <p className="mt-1 break-all text-xs text-slate-500">
                            {technician.email}
                          </p>

                          {technician.specializations.length >
                            0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {technician.specializations.map(
                                (specialization) => (
                                  <span
                                    key={specialization}
                                    className="rounded-full border border-indigo-400/20 bg-indigo-400/10 px-2.5 py-1 text-[11px] font-medium text-indigo-200"
                                  >
                                    {formatSpecialization(
                                      specialization,
                                    )}
                                  </span>
                                ),
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}