import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";

import type { AuthUser } from "../../auth/types/auth.types";
import { useCreateTicketComment } from "../hooks/useCreateTicketComment";
import { useTicketComments } from "../hooks/useTicketComments";
import type { CreateTicketCommentFormValues } from "../schemas/comment.schema";
import { CommentComposer } from "./CommentComposer";
import { CommentList } from "./CommentList";

interface TicketCommentsProps {
  ticketId: number;
  currentUser: AuthUser | null;
  canRespond: boolean;
  isResponseRequired: boolean;
}

export function TicketComments({
  ticketId,
  currentUser,
  canRespond,
  isResponseRequired,
}: TicketCommentsProps) {
  const commentsQuery = useTicketComments(
  ticketId,
  currentUser?.id ?? null,
  currentUser?.role ?? null,
);
  const createCommentMutation = useCreateTicketComment();

  const [commentVisibility, setCommentVisibility] =
    useState<"PUBLIC" | "INTERNAL">("PUBLIC");

  /*
   * Employees can send public comments only.
   *
   * Technicians, Center Managers, and Admins are
   * authorized staff and can choose between public
   * replies and internal notes.
   */
  const canUseInternalComments =
    currentUser?.role === "TECHNICIAN" ||
    currentUser?.role === "CENTER_MANAGER" ||
    currentUser?.role === "ADMIN";

  const handleSubmit = async (
    values: CreateTicketCommentFormValues,
  ) => {
    try {
      await createCommentMutation.mutateAsync({
        ticketId,
        payload: {
          content: values.content,
          visibility: canUseInternalComments
            ? commentVisibility
            : "PUBLIC",
        },
      });

      toast.success(
        commentVisibility === "INTERNAL"
          ? "Internal note added"
          : "Reply sent",
      );

      if (canUseInternalComments) {
        setCommentVisibility("PUBLIC");
      }
    } catch {
      toast.error(
        commentVisibility === "INTERNAL"
          ? "Unable to add the internal note. Please try again."
          : "Unable to send your reply. Please try again.",
      );

      throw new Error("Comment submission failed.");
    }
  };

  return (
    <section
      aria-labelledby="ticket-conversation-heading"
      className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/40"
    >
      <div className="flex items-center gap-3 border-b border-slate-800/80 px-5 py-4">
        <div
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-400"
        >
          <MessageSquare size={17} />
        </div>

        <div>
          <h2
            id="ticket-conversation-heading"
            className="text-sm font-semibold text-white"
          >
            Conversation
          </h2>

          <p className="text-xs text-slate-500">
            Communicate with the service desk about this request.
          </p>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <CommentList
          comments={commentsQuery.data?.data.comments ?? []}
          isLoading={commentsQuery.isLoading}
          isError={commentsQuery.isError}
          onRetry={() => {
            void commentsQuery.refetch();
          }}
        />
      </div>

      {canRespond ? (
        <div className="border-t border-slate-800/80 p-3 sm:p-4">
          {isResponseRequired ? (
            <p className="mb-3 text-xs font-medium text-amber-300">
              Please provide the information requested by the
              service desk.
            </p>
          ) : null}

          {canUseInternalComments ? (
            <div className="mb-3 flex w-fit rounded-lg border border-slate-800 bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => setCommentVisibility("PUBLIC")}
                disabled={createCommentMutation.isPending}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  commentVisibility === "PUBLIC"
                    ? "bg-indigo-500 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Public reply
              </button>

              <button
                type="button"
                onClick={() => setCommentVisibility("INTERNAL")}
                disabled={createCommentMutation.isPending}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  commentVisibility === "INTERNAL"
                    ? "bg-amber-500 text-slate-950"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Internal note
              </button>
            </div>
          ) : null}

          <CommentComposer
            onSubmit={handleSubmit}
            visibility={
              canUseInternalComments
                ? commentVisibility
                : "PUBLIC"
            }
            isSubmitting={createCommentMutation.isPending}
          />
        </div>
      ) : null}
    </section>
  );
}
