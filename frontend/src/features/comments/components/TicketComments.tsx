import { MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { useCreateTicketComment } from "../hooks/useCreateTicketComment";
import { useTicketComments } from "../hooks/useTicketComments";
import type { CreateTicketCommentFormValues } from "../schemas/comment.schema";
import { CommentComposer } from "./CommentComposer";
import { CommentList } from "./CommentList";

interface TicketCommentsProps {
  ticketId: number;
  canRespond: boolean;
  isResponseRequired:boolean;
}

export function TicketComments({
  ticketId,
  canRespond,
  isResponseRequired,
}: TicketCommentsProps) {
  const commentsQuery = useTicketComments(ticketId);
  const createCommentMutation = useCreateTicketComment();

  const handleSubmit = async (
    values: CreateTicketCommentFormValues,
  ) => {
    try {
      await createCommentMutation.mutateAsync({
        ticketId,
        payload: {
          content: values.content,
          visibility: "PUBLIC",
        },
      });

      toast.success("Reply sent");
    } catch {
      toast.error("Unable to send your reply. Please try again.");
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
                Please provide the information requested by the service desk.
            </p>
            ) : null}

            <CommentComposer
            onSubmit={handleSubmit}
            isSubmitting={createCommentMutation.isPending}
            />
        </div>
        ) : null}
    </section>
  );
}