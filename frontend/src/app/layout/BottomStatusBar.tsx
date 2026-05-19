import { Box, Paper, Typography } from '@mui/material';

import { useModelStore } from '../store';
import { formatSelectedEntityLabel, useI18n } from '../../shared/i18n';

export function BottomStatusBar() {
  const { t } = useI18n();
  const model = useModelStore((state) => state.model);
  const validationReport = useModelStore((state) => state.validationReport);
  const selectedEntity = useModelStore((state) => state.selectedEntity);
  const selectedEntities = useModelStore((state) => state.selectedEntities);
  const totalLoads = model.loadCases.reduce((sum, loadCase) => sum + loadCase.loads.length, 0);
  const selectedEntityLabel = selectedEntities.length > 1
    ? t('properties.multiSelection.short', { count: selectedEntities.length })
    : formatSelectedEntityLabel(selectedEntity, t);
  const statusText = validationReport.errors.length > 0
    ? t('status.errors', { count: validationReport.errors.length })
    : validationReport.warnings.length > 0
      ? t('status.warnings', { count: validationReport.warnings.length })
      : t('status.valid');

  return (
    <Paper
      square
      variant="outlined"
      sx={{
        minWidth: 0,
        overflow: 'hidden',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        px: 1.5,
        py: 0.75,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          justifyContent: 'space-between',
          overflow: 'hidden',
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {t('status.summary', {
            name: model.name,
            nodes: model.nodes.length,
            members: model.members.length,
            loads: totalLoads,
            restraints: model.restraints.length,
            profiles: model.profiles.length,
            materials: model.materials.length,
            status: statusText,
          })}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {t('status.selected', {
            value: selectedEntityLabel ?? t('common.none'),
          })}
        </Typography>
      </Box>
    </Paper>
  );
}
