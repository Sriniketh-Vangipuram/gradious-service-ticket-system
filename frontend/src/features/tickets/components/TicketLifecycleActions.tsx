import { useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import type { AuthUser } from "../../auth/types/auth.types";
import type { Ticket } from "../types/ticket.types";
import {
  canConfirmClosure,
  canReopenTicket,
} from "../ticket.permissions";
import { useConfirmTicketClosure } from "../hooks/useConfirmTicketClosure";
import { useReopenTicket } from "../hooks/useReopenTicket";

interface TicketLifecycleActionsProps {
  ticket: Ticket;
  currentUser: AuthUser;
}

export function TicketLifecycleActions({
  ticket,
  currentUser,
}: TicketLifecycleActionsProps) {
  const [reopenReason, setReopenReason] = useState("");

  const confirmClosureMutation = useConfirmTicketClosure();
  const reopenMutation = useReopenTicket();

  const canClose = canConfirmClosure(currentUser, ticket);
  const canReopen = canReopenTicket(currentUser, ticket);

  if (!canClose && !canReopen) {
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
        payload: {
          reason,
        },
      });

      setReopenReason("");

      toast.success("Ticket reopened successfully.");
    } catch {
      toast.error(
        "Unable to reopen the ticket. Please refresh and try again.",
      );
    }
  };

  const isSubmitting =
    confirmClosureMutation.isPending ||
    reopenMutation.isPending;

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