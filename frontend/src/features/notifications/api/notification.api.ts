import { httpClient } from "../../../lib/api/http-client";
import type {
  ListNotificationsParams,
  ListNotificationsResponse,
  MarkAllNotificationsAsReadResponse,
  MarkNotificationAsReadResponse,
} from "../types/notification-api.types";

export async function getNotifications(
  params?: ListNotificationsParams,
): Promise<ListNotificationsResponse> {
  const response =
    await httpClient.get<ListNotificationsResponse>("/notifications", {
      params,
    });

  return response.data;
}

export async function markNotificationAsRead(
  notificationId: number,
): Promise<MarkNotificationAsReadResponse> {
  const response =
    await httpClient.patch<MarkNotificationAsReadResponse>(
      `/notifications/${notificationId}/read`,
    );

  return response.data;
}

export async function markAllNotificationsAsRead(): Promise<MarkAllNotificationsAsReadResponse> {
  const response =
    await httpClient.patch<MarkAllNotificationsAsReadResponse>(
      "/notifications/read-all",
    );

  return response.data;
}