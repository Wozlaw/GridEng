import { Box, Paper, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

import { useI18n, type I18nKey } from '../../shared/i18n';
import type { StressMetricKind } from '../../entities/model';
import {
  formatStressLegendValue,
  getStressMapGradientCss,
  getStressMetricLabelKey,
} from './stressMap';

interface StressMapLegendProps {
  visible: boolean;
  metricKind: StressMetricKind;
  min: number;
  max: number;
}

export function StressMapLegend({
  visible,
  metricKind,
  min,
  max,
}: StressMapLegendProps) {
  const theme = useTheme();
  const { t } = useI18n();

  if (!visible) {
    return null;
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 2,
        minWidth: 210,
        px: 1.5,
        py: 1.25,
        pointerEvents: 'none',
        bgcolor: alpha(theme.palette.background.paper, 0.92),
        backdropFilter: 'blur(4px)',
      }}
    >
      <Stack spacing={0.85}>
        <Typography variant="overline" color="text.secondary">
          {t('viewport.stressMap.legend.title')}
        </Typography>
        <Typography variant="body2">
          {t(getStressMetricLabelKey(metricKind) as I18nKey)}
        </Typography>

        <Box
          sx={{
            height: 10,
            border: '1px solid',
            borderColor: 'divider',
            backgroundImage: getStressMapGradientCss(),
          }}
        />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {formatStressLegendValue(min, metricKind)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatStressLegendValue(max, metricKind)}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
