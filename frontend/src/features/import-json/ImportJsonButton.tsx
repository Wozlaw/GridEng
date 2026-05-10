import type { ChangeEvent, SyntheticEvent } from 'react';
import { useState } from 'react';

import { Alert, AlertTitle, Button, Snackbar, Stack, Typography } from '@mui/material';

import { useModelStore } from '../../app/store';
import { importGridEngJsonFile, type GridEngJsonImportStatus } from './importGridEngJson';

interface ImportFeedback {
  severity: GridEngJsonImportStatus;
  title: string;
  details: string[];
}

const MAX_DETAILS_IN_ALERT = 3;

export function ImportJsonButton() {
  const setModel = useModelStore((state) => state.setModel);
  const [feedback, setFeedback] = useState<ImportFeedback | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setIsImporting(true);

    try {
      const result = await importGridEngJsonFile(file);

      if (result.status !== 'error' && result.model) {
        setModel(result.model);
      }

      setFeedback({
        severity: result.status,
        title: buildFeedbackTitle(result.status, file.name),
        details: result.details.length > 0 ? result.details : [result.message],
      });
    } finally {
      setIsImporting(false);
    }
  }

  function handleClose(_event?: Event | SyntheticEvent, reason?: string) {
    if (reason === 'clickaway') {
      return;
    }

    setFeedback(null);
  }

  const visibleDetails = feedback?.details.slice(0, MAX_DETAILS_IN_ALERT) ?? [];
  const hiddenDetailsCount = feedback ? Math.max(0, feedback.details.length - MAX_DETAILS_IN_ALERT) : 0;

  return (
    <>
      <Button component="label" variant="outlined" disabled={isImporting}>
        {isImporting ? 'Importing...' : 'Import JSON'}
        <input
          hidden
          type="file"
          accept=".json,application/json"
          onChange={(event) => {
            void handleFileChange(event);
          }}
        />
      </Button>

      <Snackbar
        open={feedback != null}
        autoHideDuration={feedback?.severity === 'error' ? 9000 : 7000}
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
                {visibleDetails.map((detail) => (
                  <Typography key={detail} variant="body2">
                    {detail}
                  </Typography>
                ))}
                {hiddenDetailsCount > 0 && (
                  <Typography variant="body2">
                    ... and {hiddenDetailsCount} more.
                  </Typography>
                )}
              </Stack>
            </>
          )}
        </Alert>
      </Snackbar>
    </>
  );
}

function buildFeedbackTitle(status: GridEngJsonImportStatus, fileName: string): string {
  if (status === 'error') {
    return `Import failed: ${fileName}`;
  }

  if (status === 'warning') {
    return `Imported with warnings: ${fileName}`;
  }

  return `Imported: ${fileName}`;
}
