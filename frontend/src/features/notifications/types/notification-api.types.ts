import type { Notification } from "./notification.types";

export interface NotificationSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListNotificationsData {
  notifications: Notification[];
  pagination: NotificationPagination;
  unreadCount: number;
}

export type ListNotificationsResponse =
  NotificationSuccessResponse<ListNotificationsData>;

export interface MarkNotificationAsReadData {
  found: boolean;
  alreadyRead: boolean;
  notificationId: number;
  readAt: string | null;
}

export type MarkNotificationAsReadResponse =
  NotificationSuccessResponse<MarkNotificationAsReadData>;

export interface MarkAllNotificationsAsReadData {
  updatedCount: number;
}

export type MarkAllNotificationsAsReadResponse =
  NotificationSuccessResponse<MarkAllNotificationsAsReadData>;