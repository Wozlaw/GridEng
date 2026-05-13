import {
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import { useI18n } from '../../shared/i18n';
import {
  countDxfPreviewDiagnosticsByCode,
  countDxfPreviewDiagnosticsByStatus,
  getDxfPreviewOverallStatus,
} from './diagnostics';
import type { DxfImportPreview as DxfImportPreviewData } from './types';

interface DxfImportPreviewProps {
  fileName: string | null;
  preview: DxfImportPreviewData | null;
  isBusy?: boolean;
}

export function DxfImportPreviewPanel({ fileName, preview, isBusy = false }: DxfImportPreviewProps) {
  const { t } = useI18n();

  if (!fileName) {
    return (
      <Paper variant="outlined" sx={{ p: 2.5, borderStyle: 'dashed' }}>
        <Stack spacing={0.75}>
          <Typography variant="subtitle2">{t('dxf.preview.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('dxf.preview.emptyHint')}
          </Typography>
        </Stack>
      </Paper>
    );
  }

  if (isBusy || !preview) {
    return (
      <Paper variant="outlined" sx={{ p: 2.5, borderStyle: 'dashed' }}>
        <Stack spacing={0.75}>
          <Typography variant="subtitle2">{t('dxf.preview.preparingTitle')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('dxf.preview.preparingHint', { fileName })}
          </Typography>
        </Stack>
      </Paper>
    );
  }

  const overallStatus = getDxfPreviewOverallStatus(preview);
  const warningCount = countDxfPreviewDiagnosticsByStatus(preview, 'warning');
  const errorCount = countDxfPreviewDiagnosticsByStatus(preview, 'error');
  const unassignedProfileCount = countDxfPreviewDiagnosticsByCode(preview, 'group_profile_unassigned');

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Stack spacing={0.5}>
          <Typography variant="subtitle2">{t('dxf.preview.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {fileName}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
          <Chip
            color={overallStatus === 'error' ? 'error' : overallStatus === 'warning' ? 'warning' : 'success'}
            label={overallStatus === 'error'
              ? t('dxf.preview.errorsPresent')
              : overallStatus === 'warning'
                ? t('dxf.preview.warningsOnly')
                : t('dxf.preview.readyToImport')}
            size="small"
            variant="outlined"
          />
          <Chip
            label={preview.is3D ? t('dxf.preview.dimension3d') : t('dxf.preview.dimension2d')}
            size="small"
            variant="outlined"
          />
          {warningCount > 0 ? (
            <Chip
              color="warning"
              label={t('dxf.preview.warningCount', { count: warningCount })}
              size="small"
              variant="outlined"
            />
          ) : null}
          {errorCount > 0 ? (
            <Chip
              color="error"
              label={t('dxf.preview.errorCount', { count: errorCount })}
              size="small"
              variant="outlined"
            />
          ) : null}
          {unassignedProfileCount > 0 ? (
            <Chip
              color="warning"
              label={t('dxf.preview.unassignedProfiles', { count: unassignedProfileCount })}
              size="small"
              variant="outlined"
            />
          ) : null}
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {t('dxf.preview.logsHint')}
        </Typography>
      </Stack>
    </Paper>
  );
}
