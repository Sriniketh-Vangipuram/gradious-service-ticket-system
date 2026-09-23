import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { socket } from "../../../lib/socket/socket";
import { NOTIFICATION_QUERY_KEYS } from "../api/notification.keys";

interface NotificationCreatedPayload {
  notificationId: number;
  type: string;
  title: string;
  message: string;
  ticketId: number | null;
  createdAt: string;
}

export function useNotificationSocket(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const refreshNotifications = () => {
      void queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.lists(),
      });
    };

    const handleNotificationCreated = (
      payload: NotificationCreatedPayload,
    ) => {
      refreshNotifications();

      toast.info(payload.title, {
        description: payload.message,
      });
    };

    const handleSocketConnected = () => {
      refreshNotifications();
    };

    socket.on("notification:created", handleNotificationCreated);
    socket.on("connect", handleSocketConnected);

    return () => {
      socket.off("notification:created", handleNotificationCreated);
      socket.off("connect", handleSocketConnected);
    };
  }, [enabled, queryClient]);
}