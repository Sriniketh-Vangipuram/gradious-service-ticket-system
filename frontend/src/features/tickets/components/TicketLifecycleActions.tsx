import { useState } from "react";
import {
  CheckCircle2,
  CirclePlay,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import type { AuthUser } from "../../auth/types/auth.types";
import type { Ticket } from "../types/ticket.types";
import {
  canConfirmClosure,
  canReopenTicket,
} from "../ticket.permissions";
import { useChangeTicketStatus } from "../hooks/useChangeTicketStatus";
import { useConfirmTicketClosure } from "../hooks/useConfirmTicketClosure";
import { useReopenTicket } from "../hooks/useReopenTicket";
import { useResolveTicket } from "../hooks/useResolveTicket";

interface TicketLifecycleActionsProps {
  ticket: Ticket;
  currentUser: AuthUser;
}

export function TicketLifecycleActions({
  ticket,
  currentUser,
}: TicketLifecycleActionsProps) {
  const [reopenReason, setReopenReason] = useState("");
  const [resolution, setResolution] = useState("");

  const confirmClosureMutation = useConfirmTicketClosure();
  const reopenMutation = useReopenTicket();
  const changeStatusMutation = useChangeTicketStatus();
  const resolveMutation = useResolveTicket();

  const canClose = canConfirmClosure(currentUser, ticket);
  const canReopen = canReopenTicket(currentUser, ticket);

  const isTechnician = currentUser.role === "TECHNICIAN";

  const canStartWork =
    isTechnician && ticket.status === "ASSIGNED";

  const canRequestInformation =
    isTechnician && ticket.status === "IN_PROGRESS";

  const canResolve =
    isTechnician && ticket.status === "IN_PROGRESS";

  if (
    !canClose &&
    !canReopen &&
    !canStartWork &&
    !canRequestInformation &&
    !canResolve
  ) {
    return null;
  }

  const handleConfirmClosure = async () => {
    try {
      await confirmClosureMutation.mutateAsync(ticket.id);
      toast.success("Ticket closed successfully.");
    } catch {
      toast.error(
        "Unable to close the ticket. Please refresh and try again.",
      );
    }
  };

  const handleReopen = async () => {
    const reason = reopenReason.trim();

    if (!reason) {
      toast.error("Please provide a reason for reopening the ticket.");
      return;
    }

    try {
      await reopenMutation.mutateAsync({
        ticketId: ticket.id,
        payload: { reason },
      });

      setReopenReason("");
      toast.success("Ticket reopened successfully.");
    } catch {
      toast.error(
        "Unable to reopen the ticket. Please refresh and try again.",
      );
    }
  };

  const handleStartWork = async () => {
    try {
      await changeStatusMutation.mutateAsync({
        ticketId: ticket.id,
        payload: {
          status: "IN_PROGRESS",
        },
      });

      toast.success("Ticket moved to in progress.");
    } catch {
      toast.error(
        "Unable to start work on this ticket. Please refresh and try again.",
      );
    }
  };

  const handleRequestInformation = async () => {
    try {
      await changeStatusMutation.mutateAsync({
        ticketId: ticket.id,
        payload: {
          status: "WAITING_FOR_USER",
        },
      });

      toast.success("Ticket is now waiting for user information.");
    } catch {
      toast.error(
        "Unable to request information. Please refresh and try again.",
      );
    }
  };

  const handleResolve = async () => {
    const trimmedResolution = resolution.trim();

    if (!trimmedResolution) {
      toast.error("Please provide the resolution details.");
      return;
    }

    try {
      await resolveMutation.mutateAsync({
        ticketId: ticket.id,
        payload: {
          resolution: trimmedResolution,
        },
      });

      setResolution("");
      toast.success("Ticket resolved successfully.");
    } catch {
      toast.error(
        "Unable to resolve the ticket. Please refresh and try again.",
      );
    }
  };

  const isSubmitting =
    confirmClosureMutation.isPending ||
    reopenMutation.isPending ||
    changeStatusMutation.isPending ||
    resolveMutation.isPending;

  return (
    <section
      aria-labelledby="ticket-lifecycle-actions-heading"
      className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 sm:p-6"
    >
      <div>
        <h2
          id="ticket-lifecycle-actions-heading"
          className="text-sm font-semibold text-white"
        >
          Ticket actions
        </h2>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Manage the next step for this service request.
        </p>
      </div>

      <div className="mt-5 space-y-5">
        {/* ------------------------------------------------------------------ */}
        {/* Technician: Start work                                            */}
        {/* ------------------------------------------------------------------ */}

        {canStartWork ? (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-sm font-medium text-blue-200">
              Ready to start work?
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-200/60">
              Start working on this assigned service request.
            </p>

            <button
              type="button"
              onClick={() => void handleStartWork()}
              disabled={isSubmitting}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-400/70"
            >
              <CirclePlay size={16} aria-hidden="true" />
              {changeStatusMutation.isPending
                ? "Starting..."
                : "Start work"}
            </button>
          </div>
        ) : null}

        {/* ------------------------------------------------------------------ */}
        {/* Technician: Request information                                   */}
        {/* ------------------------------------------------------------------ */}

        {canRequestInformation ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-sm font-medium text-amber-200">
              Need information from the requester?
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-200/60">
              Move the ticket to waiting for user. Add a public comment below
              explaining what information is required.
            </p>

            <button
              type="button"
              onClick={() => void handleRequestInformation()}
              disabled={isSubmitting}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-400/70"
            >
              {changeStatusMutation.isPending
                ? "Updating..."
                : "Request information"}
            </button>
          </div>
        ) : null}

        {/* ------------------------------------------------------------------ */}
        {/* Technician: Resolve                                               */}
        {/* ------------------------------------------------------------------ */}

        {canResolve ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-sm font-medium text-emerald-200">
              Resolve this ticket
            </p>

            <p className="mt-1 text-xs leading-5 text-emerald-200/60">
              Describe the work completed and the resolution provided to the
              requester.
            </p>

            <label
              htmlFor="ticket-resolution"
              className="mt-4 block text-xs font-medium text-slate-300"
            >
              Resolution details
            </label>

            <textarea
              id="ticket-resolution"
              value={resolution}
              onChange={(event) => setResolution(event.target.value)}
              rows={4}
              maxLength={5000}
              placeholder="Describe what was done to resolve the issue..."
              disabled={isSubmitting}
              className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => void handleResolve()}
                disabled={isSubmitting || !resolution.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
              >
                <CheckCircle2 size={16} aria-hidden="true" />
                {resolveMutation.isPending
                  ? "Resolving..."
                  : "Resolve ticket"}
              </button>
            </div>
          </div>
        ) : null}

        {/* ------------------------------------------------------------------ */}
        {/* Employee: Confirm closure                                         */}
        {/* ------------------------------------------------------------------ */}

        {canClose ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-sm font-medium text-emerald-200">
              Your request has been resolved.
            </p>

            <p className="mt-1 text-xs leading-5 text-emerald-200/60">
              If the issue has been resolved to your satisfaction, you can
              confirm closure.
            </p>

            <button
              type="button"
              onClick={() => void handleConfirmClosure()}
              disabled={isSubmitting}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
            >
              <CheckCircle2 size={16} aria-hidden="true" />
              {confirmClosureMutation.isPending
                ? "Closing..."
                : "Confirm closure"}
            </button>
          </div>
        ) : null}

        {/* ------------------------------------------------------------------ */}
        {/* Employee: Reopen                                                  */}
        {/* ------------------------------------------------------------------ */}

        {canReopen ? (
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
            <p className="text-sm font-medium text-indigo-200">
              Need further assistance?
            </p>

            <p className="mt-1 text-xs leading-5 text-indigo-200/60">
              Reopen this resolved request and explain what still needs
              attention.
            </p>

            <label
              htmlFor="reopen-reason"
              className="mt-4 block text-xs font-medium text-slate-300"
            >
              Reason for reopening
            </label>

            <textarea
              id="reopen-reason"
              value={reopenReason}
              onChange={(event) => setReopenReason(event.target.value)}
              rows={3}
              maxLength={5000}
              placeholder="Explain what still needs to be addressed..."
              disabled={isSubmitting}
              className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => void handleReopen()}
                disabled={isSubmitting || !reopenReason.trim()}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
              >
                <RotateCcw size={16} aria-hidden="true" />
                {reopenMutation.isPending
                  ? "Reopening..."
                  : "Reopen ticket"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}