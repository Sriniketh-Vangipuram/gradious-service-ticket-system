import { CheckCheck, RefreshCw } from "lucide-react";
import { useState } from "react";

import { NotificationList } from "../components/NotificationList";
import { useMarkAllNotificationsAsRead } from "../hooks/useMarkAllNotificationsAsRead";
import { useMarkNotificationAsRead } from "../hooks/useMarkNotificationAsRead";
import { useNotifications } from "../hooks/useNotifications";

export function NotificationsPage() {
  const [page, setPage] = useState(1);

  const notificationsQuery = useNotifications({
    page,
    limit: 20,
  });

  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  const notificationData = notificationsQuery.data?.data;
  const notifications = notificationData?.notifications ?? [];
  const pagination = notificationData?.pagination;
  const unreadCount = notificationData?.unreadCount ?? 0;

  function handleMarkAsRead(notificationId: number) {
    markAsReadMutation.mutate(notificationId);
  }

  function handleMarkAllAsRead() {
    if (unreadCount === 0 || markAllAsReadMutation.isPending) {
      return;
    }

    markAllAsReadMutation.mutate();
  }

  function handleRetry() {
    void notificationsQuery.refetch();
  }

  const isInitialLoading =
    notificationsQuery.isPending && notifications.length === 0;

  const isError =
    notificationsQuery.isError && notifications.length === 0;

  const isRefreshing =
    notificationsQuery.isFetching && !notificationsQuery.isPending;

  const markAsReadError =
    markAsReadMutation.isError
      ? "The notification could not be marked as read. Please try again."
      : null;

  const markAllAsReadError =
    markAllAsReadMutation.isError
      ? "Your notifications could not be marked as read. Please try again."
      : null;

  return (
    <section className="mx-auto w-full max-w-5xl">
      <header className="flex flex-col gap-4 border-b border-slate-800/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
            Notifications
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Stay up to date
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Review ticket activity, service desk updates, and important SLA
            notifications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-400">
            {unreadCount} unread
          </span>

          <button
            type="button"
            disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/70 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck size={16} aria-hidden="true" />

            {markAllAsReadMutation.isPending
              ? "Marking..."
              : "Mark all as read"}
          </button>
        </div>
      </header>

      {isInitialLoading ? (
        <div
          className="mt-6 space-y-3"
          aria-label="Loading notifications"
          aria-busy="true"
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl border border-slate-800/80 bg-slate-900/50"
            />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6"
        >
          <h2 className="text-sm font-semibold text-rose-200">
            Notifications couldn&apos;t be loaded
          </h2>

          <p className="mt-2 text-sm leading-6 text-rose-200/70">
            We couldn&apos;t retrieve your notifications. Please try again.
          </p>

          <button
            type="button"
            onClick={handleRetry}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3.5 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/15 focus:outline-none focus:ring-2 focus:ring-rose-400/70"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Try again
          </button>
        </div>
      ) : null}

      {!isInitialLoading && !isError ? (
        <>
          {markAsReadError || markAllAsReadError ? (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/80"
            >
              {markAsReadError ?? markAllAsReadError}
            </div>
          ) : null}

          <div
            className="relative mt-6"
            aria-busy={isRefreshing}
          >
            {isRefreshing ? (
              <div className="mb-3 flex items-center justify-end gap-2 text-xs text-slate-500">
                <RefreshCw
                  size={13}
                  className="animate-spin"
                  aria-hidden="true"
                />
                Refreshing notifications...
              </div>
            ) : null}

            <NotificationList
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              markingNotificationId={
                markAsReadMutation.isPending
                  ? (markAsReadMutation.variables ?? null)
                  : null
              }
            />
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4">
              <p className="text-xs text-slate-500">
                Page {pagination.page} of {pagination.totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    page <= 1 || notificationsQuery.isFetching
                  }
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/70 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    page >= pagination.totalPages ||
                    notificationsQuery.isFetching
                  }
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/70 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}