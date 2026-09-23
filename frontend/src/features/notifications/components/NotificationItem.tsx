import { Bell, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import { ROUTES } from "../../../constants/routes";
import type { Notification } from "../types/notification.types";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (notificationId: number) => void;
  isMarkingAsRead: boolean;
}

function formatNotificationDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  isMarkingAsRead,
}: NotificationItemProps) {
  const isUnread = notification.readAt === null;

  return (
    <article
      aria-label={`${notification.title}${isUnread ? ", unread" : ""}`}
      className={[
        "rounded-2xl border p-4 transition",
        isUnread
          ? "border-indigo-500/20 bg-indigo-500/5"
          : "border-slate-800/80 bg-slate-900/50",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            isUnread
              ? "bg-indigo-500/10 text-indigo-300"
              : "bg-slate-800 text-slate-400",
          ].join(" ")}
        >
          <Bell size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white">
                {notification.title}
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-400">
                {notification.message}
              </p>
            </div>

            {isUnread ? (
              <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-medium text-indigo-300">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-indigo-400"
                />
                Unread
              </span>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-800/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <time
              dateTime={notification.createdAt}
              className="text-xs text-slate-500"
            >
              {formatNotificationDate(notification.createdAt)}
            </time>

            <div className="flex flex-wrap items-center gap-2">
              {notification.ticketId !== null ? (
                <Link
                  to={ROUTES.app.ticket(notification.ticketId)}
                  aria-label={`View ticket related to ${notification.title}`}
                  className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
                >
                  View ticket
                </Link>
              ) : null}

              {isUnread ? (
                <button
                  type="button"
                  disabled={isMarkingAsRead}
                  aria-busy={isMarkingAsRead}
                  onClick={() => onMarkAsRead(notification.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/70 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 size={14} aria-hidden="true" />
                  {isMarkingAsRead ? "Marking..." : "Mark as read"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}