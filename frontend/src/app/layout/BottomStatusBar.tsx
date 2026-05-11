import { Box, Chip, Paper, Typography } from '@mui/material';

import { getSelectedEntityLabel } from '../../features/selection';
import { useModelStore } from '../store';

export function BottomStatusBar() {
  const model = useModelStore((state) => state.model);
  const validationReport = useModelStore((state) => state.validationReport);
  const selectedEntity = useModelStore((state) => state.selectedEntity);
  const viewMode = useModelStore((state) => state.viewMode);
  const dxfImportSettings = useModelStore((state) => state.dxfImportSettings);
  const errorCount = validationReport.errors.length;
  const warningCount = validationReport.warnings.length;
  const validationColor = errorCount > 0 ? 'error.main' : warningCount > 0 ? 'warning.main' : 'success.main';
  const validationText = errorCount > 0
    ? `${errorCount} validation errors${warningCount > 0 ? ` / ${warningCount} warnings` : ''}`
    : warningCount > 0
      ? `${warningCount} validation warnings`
      : 'Validation OK';
  const selectedEntityLabel = getSelectedEntityLabel(selectedEntity);

  return (
    <Paper
      square
      variant="outlined"
      sx={{
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        px: 2,
        py: 1,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 1,
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Status
          </Typography>
          <Chip size="small" label={`Nodes ${model.nodes.length}`} variant="outlined" />
          <Chip size="small" label={`Members ${model.members.length}`} variant="outlined" />
          <Chip size="small" label={`Profiles ${model.profiles.length}`} variant="outlined" />
          <Chip size="small" label={`Load cases ${model.loadCases.length}`} variant="outlined" />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            View: {viewMode}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Selection: {selectedEntityLabel ?? 'none'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            DXF tolerance: {dxfImportSettings.toleranceMm} mm
          </Typography>
          <Typography variant="caption" color={validationColor}>
            {validationText}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
