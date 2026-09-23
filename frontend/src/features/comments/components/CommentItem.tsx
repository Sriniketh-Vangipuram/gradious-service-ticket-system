import { LockKeyhole, UserRound } from "lucide-react";

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
  const isInternal = comment.visibility === "INTERNAL";

  return (
    <article
      className={`group flex gap-3 rounded-xl px-2 py-3 transition sm:px-3 ${
        isInternal
          ? "border border-amber-500/20 bg-amber-500/5"
          : "hover:bg-slate-900/60"
      }`}
    >
      <div
        aria-hidden="true"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold ${
          isInternal
            ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
            : "border-slate-700 bg-slate-800 text-slate-200"
        }`}
      >
        {getInitials(comment.author.fullName)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-slate-100">
            {comment.author.fullName}
          </span>

          <span className="text-xs font-medium text-slate-500">
            {formatRole(comment.author.role)}
          </span>

          {isInternal ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
              <LockKeyhole size={10} aria-hidden="true" />
              Internal note
            </span>
          ) : null}

          <time
            dateTime={comment.createdAt}
            className="text-xs text-slate-600"
          >
            {formatCommentDate(comment.createdAt)}
          </time>
        </div>

        <div className="mt-1.5 flex items-start gap-2">
          {isInternal ? (
            <LockKeyhole
              size={13}
              className="mt-1 shrink-0 text-amber-500/70"
              aria-hidden="true"
            />
          ) : (
            <UserRound
              size={13}
              className="mt-1 shrink-0 text-slate-700"
              aria-hidden="true"
            />
          )}

          <p
            className={`whitespace-pre-wrap break-words text-sm leading-6 ${
              isInternal ? "text-amber-100/80" : "text-slate-300"
            }`}
          >
            {comment.content}
          </p>
        </div>
      </div>
    </article>
  );
}