import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { markAllNotificationsAsRead } from "../api/notification.api";
import { NOTIFICATION_QUERY_KEYS } from "../api/notification.keys";

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(),

    retry: false,

    onSuccess: (response) => {
      void queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.lists(),
      });

      const updatedCount = response.data.updatedCount;

      if (updatedCount === 0) {
        toast.info("There are no unread notifications.");
        return;
      }

      toast.success(
        `${updatedCount} notification${
          updatedCount === 1 ? "" : "s"
        } marked as read.`,
      );
    },

    onError: () => {
      toast.error(
        "Your notifications could not be marked as read. Please try again.",
      );
    },
  });
}