import { useState } from 'react';

import { Button } from '@mui/material';

import { useI18n } from '../../shared/i18n';
import { DxfImportDialog } from './DxfImportDialog';

export function ImportDxfButton() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        {t('dxf.button')}
      </Button>

      <DxfImportDialog
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      />
    </>
  );
}
