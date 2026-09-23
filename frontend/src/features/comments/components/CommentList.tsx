import { MessageSquare } from "lucide-react";

import { CommentItem } from "./CommentItem";
import type { TicketComment } from "../types/comment.types";

interface CommentListProps {
  comments: TicketComment[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

function CommentSkeleton() {
  return (
    <div className="flex animate-pulse gap-3 px-2 py-3 sm:px-3">
      <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-800" />

      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-40 rounded bg-slate-800" />
        <div className="h-3 w-full max-w-xl rounded bg-slate-800" />
        <div className="h-3 w-3/4 max-w-lg rounded bg-slate-800" />
      </div>
    </div>
  );
}

export function CommentList({
  comments,
  isLoading = false,
  isError = false,
  onRetry,
}: CommentListProps) {
  if (isLoading) {
    return (
      <section
        aria-label="Loading conversation"
        className="divide-y divide-slate-800/60"
      >
        <CommentSkeleton />
        <CommentSkeleton />
        <CommentSkeleton />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-5 py-8 text-center">
        <p className="text-sm font-medium text-rose-300">
          We couldn't load the conversation.
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Please try again.
        </p>

        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
          >
            Try again
          </button>
        ) : null}
      </section>
    );
  }

  if (comments.length === 0) {
    return (
      <section className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40 px-6 py-12 text-center">
        <div
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-500"
        >
          <MessageSquare size={19} />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-slate-200">
          No messages yet
        </h3>

        <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
          Start the conversation by sending a message to the service desk.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Ticket conversation" className="space-y-1">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </section>
  );
}