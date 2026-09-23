import { UserRound } from "lucide-react";

import type { TicketComment } from "../types/comment.types";

interface CommentItemProps {
  comment: TicketComment;
}

function formatCommentDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function formatRole(role: TicketComment["author"]["role"]): string {
  switch (role) {
    case "EMPLOYEE":
      return "Employee";
    case "TECHNICIAN":
      return "Technician";
    case "CENTER_MANAGER":
      return "Center Manager";
    case "ADMIN":
      return "Administrator";
    default:
      return role;
  }
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function CommentItem({ comment }: CommentItemProps) {
  return (
    <article className="group flex gap-3 rounded-xl px-2 py-3 transition hover:bg-slate-900/60 sm:px-3">
      <div
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200"
      >
        {getInitials(comment.author.fullName)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-slate-100">
            {comment.author.fullName}
          </span>

          <span className="text-xs font-medium text-slate-500">
            {formatRole(comment.author.role)}
          </span>

          <time
            dateTime={comment.createdAt}
            className="text-xs text-slate-600"
          >
            {formatCommentDate(comment.createdAt)}
          </time>
        </div>

        <div className="mt-1.5 flex items-start gap-2">
          <UserRound
            size={13}
            className="mt-1 shrink-0 text-slate-700"
            aria-hidden="true"
          />

          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
            {comment.content}
          </p>
        </div>
      </div>
    </article>
  );
}