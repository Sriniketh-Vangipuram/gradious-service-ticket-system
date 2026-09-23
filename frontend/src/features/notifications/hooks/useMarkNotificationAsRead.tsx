import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { markNotificationAsRead } from "../api/notification.api";
import { NOTIFICATION_QUERY_KEYS } from "../api/notification.keys";

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) =>
      markNotificationAsRead(notificationId),

    retry: false,

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.lists(),
      });

      toast.success("Notification marked as read.");
    },

    onError: () => {
      toast.error(
        "The notification could not be marked as read. Please try again.",
      );
    },
  });
}