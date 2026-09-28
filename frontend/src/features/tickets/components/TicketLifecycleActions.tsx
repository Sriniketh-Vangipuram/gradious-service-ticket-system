import { useState } from "react";
import {
  Ban,
  CheckCircle2,
  CirclePlay,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useCancelTicket } from "../hooks/useCancelTicket";
import type { AuthUser } from "../../auth/types/auth.types";
import type { Ticket } from "../types/ticket.types";

import {
  canCancelTicket,
  canConfirmClosure,
  canReopenTicket,
  canRequestCancellation,
} from "../ticket.permissions";

import {
  useApproveTicketCancellation,
  useRejectTicketCancellation,
  useRequestTicketCancellation,
} from "../hooks/useCancellation";
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
  const [cancellationReason, setCancellationReason] =
    useState("");
  const [cancellationRequestReason, setCancellationRequestReason] =
    useState("");
  const [rejectionReason, setRejectionReason] =
    useState("");

  const cancelMutation = useCancelTicket();

  const requestCancellationMutation =
    useRequestTicketCancellation();

  const approveCancellationMutation =
    useApproveTicketCancellation();

  const rejectCancellationMutation =
    useRejectTicketCancellation();

  const confirmClosureMutation =
    useConfirmTicketClosure();

  const reopenMutation = useReopenTicket();
  const changeStatusMutation = useChangeTicketStatus();
  const resolveMutation = useResolveTicket();

  const canCancel = canCancelTicket(
    currentUser,
    ticket,
  );

  const canRequestCancel =
    canRequestCancellation(
      currentUser,
      ticket,
    );

  const canClose = canConfirmClosure(
    currentUser,
    ticket,
  );

  const canReopen = canReopenTicket(
    currentUser,
    ticket,
  );

  const isTechnician =
    currentUser.role === "TECHNICIAN";

  const isAdmin =
    currentUser.role === "ADMIN";

  const cancellationRequest =
  ticket.cancellationRequest;

  const hasPendingCancellationRequest =
    cancellationRequest?.status === "PENDING";

  const canReviewCancellation =
    isAdmin &&
    cancellationRequest?.status === "PENDING";
  

  const canStartWork =
    isTechnician &&
    ticket.status === "ASSIGNED";

  const canRequestInformation =
    isTechnician &&
    ticket.status === "IN_PROGRESS";

  const canResolve =
    isTechnician &&
    ticket.status === "IN_PROGRESS";

  if (
    !canClose &&
    !canReopen &&
    !canCancel &&
    !canRequestCancel &&
    !canReviewCancellation &&
    !canStartWork &&
    !canRequestInformation &&
    !canResolve
  ) {
    return null;
  }

  const handleCancel = async () => {
    const reason =
      cancellationReason.trim();

    if (!reason) {
      toast.error(
        "Please provide a reason for cancelling the ticket.",
      );
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        ticketId: ticket.id,
        payload: {
          reason,
        },
      });

      setCancellationReason("");

      toast.success(
        "Ticket cancelled successfully.",
      );
    } catch {
      toast.error(
        "Unable to cancel the ticket. Please refresh and try again.",
      );
    }
  };

  const handleRequestCancellation =
    async () => {
      const reason =
        cancellationRequestReason.trim();

      if (!reason) {
        toast.error(
          "Please provide a reason for requesting cancellation.",
        );
        return;
      }

      try {
        await requestCancellationMutation.mutateAsync(
          {
            ticketId: ticket.id,
            payload: {
              reason,
            },
          },
        );

        setCancellationRequestReason("");

        toast.success(
          "Cancellation request sent to the administrator.",
        );
      } catch {
        toast.error(
          "Unable to request cancellation. Please refresh and try again.",
        );
      }
    };

  const handleApproveCancellation = async () => {
  if (!cancellationRequest) {
    return;
  }

  try {
    await approveCancellationMutation.mutateAsync({
      ticketId: ticket.id,
      historyId: cancellationRequest.id,
    });

    toast.success(
      "Cancellation request approved.",
    );
  } catch {
    toast.error(
      "Unable to approve the cancellation request. Please refresh and try again.",
    );
  }
};

 const handleRejectCancellation = async () => {
  const reason = rejectionReason.trim();

  if (!cancellationRequest) {
    return;
  }

  if (!reason) {
    toast.error(
      "Please provide a reason for rejecting the cancellation request.",
    );
    return;
  }

  try {
    await rejectCancellationMutation.mutateAsync({
      ticketId: ticket.id,
      historyId: cancellationRequest.id,
      payload: {
        reason,
      },
    });

    setRejectionReason("");

    toast.success(
      "Cancellation request rejected.",
    );
  } catch {
    toast.error(
      "Unable to reject the cancellation request. Please refresh and try again.",
    );
  }
};

  const handleConfirmClosure =
    async () => {
      try {
        await confirmClosureMutation.mutateAsync(
          ticket.id,
        );

        toast.success(
          "Ticket closed successfully.",
        );
      } catch {
        toast.error(
          "Unable to close the ticket. Please refresh and try again.",
        );
      }
    };

  const handleReopen = async () => {
    const reason =
      reopenReason.trim();

    if (!reason) {
      toast.error(
        "Please provide a reason for reopening the ticket.",
      );
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

      toast.success(
        "Ticket reopened successfully.",
      );
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

      toast.success(
        "Ticket moved to in progress.",
      );
    } catch {
      toast.error(
        "Unable to start work on this ticket. Please refresh and try again.",
      );
    }
  };

  const handleRequestInformation =
    async () => {
      try {
        await changeStatusMutation.mutateAsync({
          ticketId: ticket.id,
          payload: {
            status: "WAITING_FOR_USER",
          },
        });

        toast.success(
          "Ticket is now waiting for user information.",
        );
      } catch {
        toast.error(
          "Unable to request information. Please refresh and try again.",
        );
      }
    };

  const handleResolve = async () => {
    const trimmedResolution =
      resolution.trim();

    if (!trimmedResolution) {
      toast.error(
        "Please provide the resolution details.",
      );
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

      toast.success(
        "Ticket resolved successfully.",
      );
    } catch {
      toast.error(
        "Unable to resolve the ticket. Please refresh and try again.",
      );
    }
  };

  const isSubmitting =
    cancelMutation.isPending ||
    requestCancellationMutation.isPending ||
    approveCancellationMutation.isPending ||
    rejectCancellationMutation.isPending ||
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
        {/* Admin: Review cancellation request                                */}
        {/* ------------------------------------------------------------------ */}

        {canReviewCancellation ? (
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
            <p className="text-sm font-medium text-orange-200">
              Cancellation request
            </p>

            <p className="mt-1 text-xs leading-5 text-orange-200/60">
              A center manager has requested cancellation
              of this ticket.
            </p>

            <div className="mt-4 rounded-lg border border-orange-500/10 bg-slate-950/50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                Requested by
              </p>

              <p className="mt-1 text-sm text-slate-300">
                {cancellationRequest.requestedBy.fullName}
              </p>

              <p className="text-xs text-slate-500">
                {cancellationRequest.requestedBy.role}
              </p>

              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                Reason
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-300">
                {cancellationRequest.reason}
              </p>
            </div>

            <label
              htmlFor="ticket-cancellation-rejection-reason"
              className="mt-4 block text-xs font-medium text-slate-300"
            >
              Rejection reason
            </label>

            <textarea
              id="ticket-cancellation-rejection-reason"
              value={rejectionReason}
              onChange={(event) =>
                setRejectionReason(
                  event.target.value,
                )
              }
              rows={3}
              maxLength={500}
              placeholder="Explain why the cancellation request is being rejected..."
              disabled={isSubmitting}
              className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  void handleRejectCancellation()
                }
                disabled={
                  isSubmitting ||
                  !rejectionReason.trim()
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-500/70"
              >
                <XCircle
                  size={16}
                  aria-hidden="true"
                />

                {rejectCancellationMutation.isPending
                  ? "Rejecting..."
                  : "Reject request"}
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleApproveCancellation()
                }
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-400/70"
              >
                <Ban
                  size={16}
                  aria-hidden="true"
                />

                {approveCancellationMutation.isPending
                  ? "Approving..."
                  : "Approve cancellation"}
              </button>
            </div>
          </div>
        ) : null}

        {/* ------------------------------------------------------------------ */}
        {/* Employee / Admin: Direct cancellation                              */}
        {/* ------------------------------------------------------------------ */}

        {canCancel ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm font-medium text-red-200">
              Cancel this ticket
            </p>

            <p className="mt-1 text-xs leading-5 text-red-200/60">
              Cancel this service request if it is no longer
              required. Please provide a reason that will be
              recorded in the ticket history.
            </p>

            <label
              htmlFor="ticket-cancellation-reason"
              className="mt-4 block text-xs font-medium text-slate-300"
            >
              Cancellation reason
            </label>

            <textarea
              id="ticket-cancellation-reason"
              value={cancellationReason}
              onChange={(event) =>
                setCancellationReason(
                  event.target.value,
                )
              }
              rows={3}
              maxLength={500}
              placeholder="Explain why this ticket is being cancelled..."
              disabled={isSubmitting}
              className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-red-500/60 focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  void handleCancel()
                }
                disabled={
                  isSubmitting ||
                  !cancellationReason.trim()
                }
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-400/70"
              >
                <Ban
                  size={16}
                  aria-hidden="true"
                />

                {cancelMutation.isPending
                  ? "Cancelling..."
                  : "Cancel ticket"}
              </button>
            </div>
          </div>
        ) : null}

        {/* ------------------------------------------------------------------ */}
        {/* Center Manager: Request cancellation                              */}
        {/* ------------------------------------------------------------------ */}

        {canRequestCancel ? (
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
            <p className="text-sm font-medium text-orange-200">
              Request ticket cancellation
            </p>

            <p className="mt-1 text-xs leading-5 text-orange-200/60">
              Cancellation requests are reviewed by an
              administrator. The ticket will remain in its current
              status until the request is approved.
            </p>

            {hasPendingCancellationRequest ? (
              <div className="mt-4 rounded-lg border border-orange-500/10 bg-orange-500/10 p-3">
                <p className="text-xs font-semibold text-orange-200">
                  Cancellation request already pending
                </p>

                <p className="mt-1 text-xs leading-5 text-orange-200/60">
                  An administrator has not reviewed the existing
                  cancellation request yet.
                </p>
              </div>
            ) : (
              <>
                <label
                  htmlFor="ticket-cancellation-request-reason"
                  className="mt-4 block text-xs font-medium text-slate-300"
                >
                  Cancellation reason
                </label>

                <textarea
                  id="ticket-cancellation-request-reason"
                  value={cancellationRequestReason}
                  onChange={(event) =>
                    setCancellationRequestReason(
                      event.target.value,
                    )
                  }
                  rows={3}
                  maxLength={500}
                  placeholder="Explain why this ticket should be cancelled..."
                  disabled={isSubmitting}
                  className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      void handleRequestCancellation()
                    }
                    disabled={
                      isSubmitting ||
                      !cancellationRequestReason.trim()
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-400/70"
                  >
                    <Ban
                      size={16}
                      aria-hidden="true"
                    />

                    {requestCancellationMutation.isPending
                      ? "Sending..."
                      : "Request cancellation"}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}

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
              onClick={() =>
                void handleStartWork()
              }
              disabled={isSubmitting}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-400/70"
            >
              <CirclePlay
                size={16}
                aria-hidden="true"
              />

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
              Move the ticket to waiting for user. Add a public
              comment below explaining what information is required.
            </p>

            <button
              type="button"
              onClick={() =>
                void handleRequestInformation()
              }
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
              Describe the work completed and the resolution
              provided to the requester.
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
              onChange={(event) =>
                setResolution(event.target.value)
              }
              rows={4}
              maxLength={5000}
              placeholder="Describe what was done to resolve the issue..."
              disabled={isSubmitting}
              className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  void handleResolve()
                }
                disabled={
                  isSubmitting ||
                  !resolution.trim()
                }
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
              >
                <CheckCircle2
                  size={16}
                  aria-hidden="true"
                />

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
              If the issue has been resolved to your satisfaction,
              you can confirm closure.
            </p>

            <button
              type="button"
              onClick={() =>
                void handleConfirmClosure()
              }
              disabled={isSubmitting}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
            >
              <CheckCircle2
                size={16}
                aria-hidden="true"
              />

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
              Reopen this resolved request and explain what still
              needs attention.
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
              onChange={(event) =>
                setReopenReason(
                  event.target.value,
                )
              }
              rows={3}
              maxLength={5000}
              placeholder="Explain what still needs to be addressed..."
              disabled={isSubmitting}
              className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  void handleReopen()
                }
                disabled={
                  isSubmitting ||
                  !reopenReason.trim()
                }
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
              >
                <RotateCcw
                  size={16}
                  aria-hidden="true"
                />

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