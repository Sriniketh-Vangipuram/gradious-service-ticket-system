import { BellOff } from "lucide-react";

import type { Notification } from "../types/notification.types";
import { NotificationItem } from "./NotificationItem";

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: number) => void;
  markingNotificationId: number | null;
}

export function NotificationList({
  notifications,
  onMarkAsRead,
  markingNotificationId,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-slate-800/80 bg-slate-900/50 px-6 py-12 text-center"
      >
        <div
          aria-hidden="true"
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-500"
        >
          <BellOff size={20} />
        </div>

        <h2 className="mt-4 text-sm font-semibold text-white">
          No notifications
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          You&apos;re all caught up. New ticket activity and service desk
          updates will appear here.
        </p>
      </div>
    );
  }

  return (
    <div
      role="list"
      aria-label="Notifications"
      className="space-y-3"
    >
      {notifications.map((notification) => (
        <div key={notification.id} role="listitem">
          <NotificationItem
            notification={notification}
            onMarkAsRead={onMarkAsRead}
            isMarkingAsRead={markingNotificationId === notification.id}
          />
        </div>
      ))}
    </div>
  );
}