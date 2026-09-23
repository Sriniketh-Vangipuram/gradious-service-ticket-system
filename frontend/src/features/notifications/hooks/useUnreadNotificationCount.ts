import { useNotifications } from "./useNotifications";

export function useUnreadNotificationCount() {
  const notificationsQuery = useNotifications({
    page: 1,
    limit: 1,
  });

  return {
    unreadCount: notificationsQuery.data?.data.unreadCount ?? 0,
    isLoading: notificationsQuery.isPending,
    isError: notificationsQuery.isError,
  };
}