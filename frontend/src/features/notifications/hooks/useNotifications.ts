import { useQuery } from "@tanstack/react-query";

import { getNotifications } from "../api/notification.api";
import { NOTIFICATION_QUERY_KEYS } from "../api/notification.keys";
import type { ListNotificationsParams } from "../types/notification-api.types";

export function useNotifications(params?: ListNotificationsParams) {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list(params),
    queryFn: () => getNotifications(params),
    staleTime: 30_000,
  });
}