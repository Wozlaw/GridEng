import {
  Alert,
  AlertTitle,
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import { useI18n } from '../../shared/i18n';
import { formatNumber, formatOptionalText } from '../../shared/utils/format';
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
        <Typography variant="subtitle2">{t('dxf.preview.title')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t('dxf.preview.emptyHint')}
        </Typography>
      </Paper>
    );
  }

  if (isBusy || !preview) {
    return (
      <Paper variant="outlined" sx={{ p: 2.5, borderStyle: 'dashed' }}>
        <Typography variant="subtitle2">{t('dxf.preview.preparingTitle')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t('dxf.preview.preparingHint', { fileName })}
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1}
            sx={{
              alignItems: { xs: 'flex-start', md: 'center' },
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="subtitle2">{t('dxf.preview.title')}</Typography>
              <Typography variant="body2" color="text.secondary">
                {fileName}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              <Chip
                color={preview.errors.length > 0 ? 'error' : preview.warnings.length > 0 ? 'warning' : 'success'}
                label={preview.errors.length > 0
                  ? t('dxf.preview.errorsPresent')
                  : preview.warnings.length > 0
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
            </Stack>
          </Stack>

          <Divider />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }} useFlexGap>
            <PreviewMetric label={t('dxf.preview.lineEntities')} value={String(preview.linesCount)} />
            <PreviewMetric label={t('dxf.preview.ignoredEntities')} value={String(preview.ignoredEntitiesCount)} />
            <PreviewMetric label={t('dxf.preview.nodes')} value={String(preview.nodesCount)} />
            <PreviewMetric label={t('dxf.preview.members')} value={String(preview.membersCount)} />
            <PreviewMetric label={t('dxf.preview.mergedNodes')} value={String(preview.mergedNodesCount)} />
            <PreviewMetric label={t('dxf.preview.danglingMembers')} value={String(preview.danglingMembersCount)} />
            <PreviewMetric
              label={t('dxf.preview.zRange')}
              value={preview.zRange ? `${formatNumber(preview.zRange.min, 2)} .. ${formatNumber(preview.zRange.max, 2)} mm` : '-'}
            />
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t('dxf.preview.colorGroups')}
        </Typography>
        {preview.colorGroups.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('dxf.preview.noGroups')}
          </Typography>
        ) : (
          <Stack spacing={1}>
            {preview.colorGroups.map((group) => (
              <Box
                key={group.key}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1.4fr 0.7fr 0.7fr 0.9fr' },
                  gap: 1,
                  py: 0.75,
                }}
              >
                <Typography variant="body2">
                  <strong>{group.key}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('dxf.preview.membersLabel', { count: group.membersCount })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('dxf.preview.layerLabel', { value: formatOptionalText(group.layer) })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('dxf.preview.profileLabel', { value: formatOptionalText(group.profileId) })}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      {preview.errors.length > 0 && (
        <Alert severity="error" variant="outlined">
          <AlertTitle>{t('dxf.preview.importErrors')}</AlertTitle>
          <Stack spacing={0.5}>
            {preview.errors.map((error) => (
              <Typography key={error} variant="body2">
                {error}
              </Typography>
            ))}
          </Stack>
        </Alert>
      )}

      {preview.warnings.length > 0 && (
        <Alert severity="warning" variant="outlined">
          <AlertTitle>{t('dxf.preview.importWarnings')}</AlertTitle>
          <Stack spacing={0.5}>
            {preview.warnings.map((warning) => (
              <Typography key={warning} variant="body2">
                {warning}
              </Typography>
            ))}
          </Stack>
        </Alert>
      )}
    </Stack>
  );
}

interface PreviewMetricProps {
  label: string;
  value: string;
}

function PreviewMetric({ label, value }: PreviewMetricProps) {
  return (
    <Box sx={{ minWidth: 128 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}
