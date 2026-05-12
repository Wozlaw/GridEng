import type { ChangeEvent } from 'react';
import { useState } from 'react';

import { Button } from '@mui/material';

import { useModelStore } from '../../app/store';
import { useI18n, type I18nKey, type TFunction } from '../../shared/i18n';
import { notify } from '../../shared/ui';
import { importGridEngJsonFile, type GridEngJsonImportStatus } from './importGridEngJson';

interface ImportFeedback {
  severity: GridEngJsonImportStatus;
  title: string;
  details: string[];
}

export function ImportJsonButton() {
  const { t } = useI18n();
  const setModel = useModelStore((state) => state.setModel);
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

      const feedback = buildFeedback({
        t,
        fileName: file.name,
        status: result.status,
        details: result.details.length > 0 ? result.details : [result.message],
      });

      notify({
        severity: feedback.severity,
        title: feedback.title,
        details: feedback.details,
      });
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Button component="label" variant="outlined" disabled={isImporting}>
      {isImporting ? t('importJson.importing') : t('importJson.button')}
      <input
        hidden
        type="file"
        accept=".json,application/json"
        onChange={(event) => {
          void handleFileChange(event);
        }}
      />
    </Button>
  );
}

function buildFeedback({
  t,
  fileName,
  status,
  details,
}: {
  t: TFunction<I18nKey>;
  fileName: string;
  status: GridEngJsonImportStatus;
  details: string[];
}): ImportFeedback {
  if (status === 'error') {
    return {
      severity: 'error',
      title: t('importJson.feedback.errorTitle', { fileName }),
      details,
    };
  }

  if (status === 'warning') {
    return {
      severity: 'warning',
      title: t('importJson.feedback.warningTitle', { fileName }),
      details,
    };
  }

  return {
    severity: 'success',
    title: t('importJson.feedback.successTitle', { fileName }),
    details: details.length > 0 ? details : [t('importJson.feedback.successDetail')],
  };
}
