import type { SyntheticEvent } from 'react';

import { Alert, AlertTitle, Snackbar, Stack, Typography } from '@mui/material';

import { useI18n } from '../../i18n';
import { getNotificationAutoHideDuration, useNotificationsStore } from './store';

const MAX_NOTIFICATION_DETAILS = 3;

export function AppNotifications() {
  const { t } = useI18n();
  const notification = useNotificationsStore((state) => state.queue[0] ?? null);
  const dismiss = useNotificationsStore((state) => state.dismiss);

  function handleClose(_event?: Event | SyntheticEvent, reason?: string) {
    if (reason === 'clickaway' || notification == null) {
      return;
    }

    dismiss(notification.id);
  }

  if (notification == null) {
    return null;
  }

  const visibleDetails = notification.details?.slice(0, MAX_NOTIFICATION_DETAILS) ?? [];
  const hiddenDetailsCount = Math.max(0, (notification.details?.length ?? 0) - MAX_NOTIFICATION_DETAILS);

  return (
    <Snackbar
      open
      autoHideDuration={notification.autoHideDuration ?? getNotificationAutoHideDuration(notification.severity)}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        severity={notification.severity}
        variant="filled"
        onClose={handleClose}
        sx={{ width: '100%', maxWidth: 640 }}
      >
        {notification.title && <AlertTitle>{notification.title}</AlertTitle>}
        {visibleDetails.length > 0 && (
          <Stack spacing={0.5}>
            {visibleDetails.map((detail) => (
              <Typography key={detail} variant="body2">
                {detail}
              </Typography>
            ))}
            {hiddenDetailsCount > 0 && (
              <Typography variant="body2">
                {t('notifications.common.moreDetails', { count: hiddenDetailsCount })}
              </Typography>
            )}
          </Stack>
        )}
      </Alert>
    </Snackbar>
  );
}
