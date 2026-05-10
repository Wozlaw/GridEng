import type { SyntheticEvent } from 'react';
import { useState } from 'react';

import { Alert, AlertTitle, Button, Snackbar, Stack, Typography } from '@mui/material';

import { useModelStore } from '../../app/store';
import { downloadGridEngJson } from './exportGridEngJson';

interface ExportFeedback {
  severity: 'success' | 'error';
  title: string;
  details: string[];
}

export function ExportJsonButton() {
  const model = useModelStore((state) => state.model);
  const [feedback, setFeedback] = useState<ExportFeedback | null>(null);

  function handleExport() {
    try {
      const fileName = downloadGridEngJson(model);

      setFeedback({
        severity: 'success',
        title: `Exported: ${fileName}`,
        details: ['Current GridEng model was exported as pretty JSON.'],
      });
    } catch (error) {
      setFeedback({
        severity: 'error',
        title: 'Export failed',
        details: [error instanceof Error ? error.message : 'Unknown JSON export error.'],
      });
    }
  }

  function handleClose(_event?: Event | SyntheticEvent, reason?: string) {
    if (reason === 'clickaway') {
      return;
    }

    setFeedback(null);
  }

  return (
    <>
      <Button variant="outlined" onClick={handleExport}>
        Export JSON
      </Button>

      <Snackbar
        open={feedback != null}
        autoHideDuration={feedback?.severity === 'error' ? 9000 : 5000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={feedback?.severity ?? 'success'}
          variant="filled"
          onClose={handleClose}
          sx={{ width: '100%', maxWidth: 560 }}
        >
          {feedback && (
            <>
              <AlertTitle>{feedback.title}</AlertTitle>
              <Stack spacing={0.5}>
                {feedback.details.map((detail) => (
                  <Typography key={detail} variant="body2">
                    {detail}
                  </Typography>
                ))}
              </Stack>
            </>
          )}
        </Alert>
      </Snackbar>
    </>
  );
}
