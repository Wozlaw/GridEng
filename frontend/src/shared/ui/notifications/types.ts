export type NotificationSeverity = 'success' | 'info' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  severity: NotificationSeverity;
  title?: string;
  details?: string[];
  autoHideDuration?: number | null;
}

export type AppNotificationInput = Omit<AppNotification, 'id'>;
