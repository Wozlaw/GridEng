import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';

import { useI18n } from '../../shared/i18n';
import { DxfImportLogSectionsPanel } from './DxfImportLogContent';
import type {
  DxfImportSettings,
  DxfToGridEngModelResult,
} from './types';

interface DxfImportLogDialogProps {
  open: boolean;
  fileName: string | null;
  previewResult: DxfToGridEngModelResult | null;
  settings: DxfImportSettings;
  onClose: () => void;
}

export function DxfImportLogDialog({
  open,
  fileName,
  previewResult,
  settings,
  onClose,
}: DxfImportLogDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Stack spacing={0.5}>
          <Typography variant="h6">{t('dxf.logs.title')}</Typography>
          {fileName ? (
            <Typography variant="body2" color="text.secondary">
              {fileName}
            </Typography>
          ) : null}
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <DxfImportLogSectionsPanel
          fileName={fileName}
          previewResult={previewResult}
          settings={settings}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
}
