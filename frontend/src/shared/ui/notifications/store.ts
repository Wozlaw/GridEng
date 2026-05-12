import { create } from 'zustand';

import { useUiStore } from '../../../app/store';
import { translate } from '../../i18n';
import type { AppNotification, AppNotificationInput, NotificationSeverity } from './types';

const NOTIFICATION_ID_PREFIX = 'notification-';

export interface NotificationsStoreState {
  queue: AppNotification[];
  push: (notification: AppNotificationInput) => string;
  dismiss: (id: string) => void;
  dismissCurrent: () => void;
  clear: () => void;
}

export const useNotificationsStore = create<NotificationsStoreState>((set) => ({
  queue: [],
  push: (notification) => {
    const id = `${NOTIFICATION_ID_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((state) => ({
      queue: [
        ...state.queue,
        {
          id,
          ...notification,
        },
      ],
    }));

    return id;
  },
  dismiss: (id) =>
    set((state) => ({
      queue: state.queue.filter((notification) => notification.id !== id),
    })),
  dismissCurrent: () =>
    set((state) => ({
      queue: state.queue.slice(1),
    })),
  clear: () => set({ queue: [] }),
}));

export function notify(notification: AppNotificationInput) {
  return useNotificationsStore.getState().push(notification);
}

export function notifySuccess(notification: Omit<AppNotificationInput, 'severity'>) {
  return notify({
    severity: 'success',
    ...notification,
  });
}

export function notifyInfo(notification: Omit<AppNotificationInput, 'severity'>) {
  return notify({
    severity: 'info',
    ...notification,
  });
}

export function notifyWarning(notification: Omit<AppNotificationInput, 'severity'>) {
  return notify({
    severity: 'warning',
    ...notification,
  });
}

export function notifyError(notification: Omit<AppNotificationInput, 'severity'>) {
  return notify({
    severity: 'error',
    ...notification,
  });
}

export function notifyNotImplemented(featureName: string) {
  const language = useUiStore.getState().language;

  return notifyInfo({
    title: translate(language, 'notifications.notImplemented.title'),
    details: [
      translate(language, 'notifications.notImplemented.detail', {
        feature: featureName,
      }),
    ],
  });
}

export function getNotificationAutoHideDuration(severity: NotificationSeverity): number | null {
  switch (severity) {
    case 'success':
    case 'info':
      return 3500;
    case 'warning':
      return 6000;
    case 'error':
      return null;
    default:
      return 4000;
  }
}
