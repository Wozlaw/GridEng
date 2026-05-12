import { Button } from '@mui/material';

import { useModelStore } from '../../app/store';
import { useI18n } from '../../shared/i18n';
import { notifyError, notifySuccess } from '../../shared/ui';
import { downloadGridEngJson } from './exportGridEngJson';

export function ExportJsonButton() {
  const { t } = useI18n();
  const model = useModelStore((state) => state.model);

  function handleExport() {
    try {
      const fileName = downloadGridEngJson(model);

      notifySuccess({
        title: t('exportJson.feedback.successTitle', { fileName }),
        details: [t('exportJson.feedback.successDetail')],
      });
    } catch (error) {
      notifyError({
        title: t('exportJson.feedback.errorTitle'),
        details: [error instanceof Error ? error.message : t('exportJson.feedback.unknownError')],
      });
    }
  }

  return (
    <Button variant="outlined" onClick={handleExport}>
      {t('exportJson.button')}
    </Button>
  );
}
