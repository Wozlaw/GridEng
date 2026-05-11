import {
  AppBar,
  Box,
  Button,
  Chip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
} from '@mui/material';

import { ExportJsonButton } from '../../features/export-json';
import { ImportDxfButton } from '../../features/import-dxf';
import { ImportJsonButton } from '../../features/import-json';
import { getSelectedEntityLabel } from '../../features/selection';
import { useModelStore } from '../store';
import { VIEW_MODE_OPTIONS } from '../../features/view-modes';

const VISIBILITY_KEYS = ['nodes', 'members', 'loads', 'moments', 'restraints', 'labels'] as const;

export function TopMenu() {
  const modelName = useModelStore((state) => state.model.name);
  const selectedEntity = useModelStore((state) => state.selectedEntity);
  const validationReport = useModelStore((state) => state.validationReport);
  const viewMode = useModelStore((state) => state.viewMode);
  const visibility = useModelStore((state) => state.visibility);
  const setViewMode = useModelStore((state) => state.setViewMode);
  const setVisibility = useModelStore((state) => state.setVisibility);
  const validateModel = useModelStore((state) => state.validateModel);
  const resetToSampleModel = useModelStore((state) => state.resetToSampleModel);

  const activeVisibility = VISIBILITY_KEYS.filter((key) => visibility[key]);
  const errorCount = validationReport.errors.length;
  const warningCount = validationReport.warnings.length;
  const validationChipColor = errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'success';
  const validationChipLabel = errorCount > 0
    ? `${errorCount} errors${warningCount > 0 ? ` / ${warningCount} warnings` : ''}`
    : warningCount > 0
      ? `${warningCount} warnings`
      : 'Model valid';
  const selectedEntityLabel = getSelectedEntityLabel(selectedEntity);

  return (
    <AppBar position="sticky" color="transparent" elevation={0}>
      <Toolbar
        sx={{
          alignItems: 'flex-start',
          gap: 2,
          px: { xs: 1.5, md: 2 },
          py: 1.25,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ minWidth: { xs: '100%', xl: 240 }, mr: 'auto' }}>
          <Typography variant="overline" color="text.secondary">
            GridEng CAD Shell
          </Typography>
          <Typography variant="h6">{modelName}</Typography>
        </Box>

        <Stack spacing={0.75}>
          <Typography variant="caption" color="text.secondary">
            View mode
          </Typography>
          <ToggleButtonGroup
            color="primary"
            exclusive
            size="small"
            value={viewMode}
            onChange={(_event, nextViewMode) => {
              if (nextViewMode) {
                setViewMode(nextViewMode);
              }
            }}
          >
            {VIEW_MODE_OPTIONS.map((option) => (
              <ToggleButton key={option.value} value={option.value}>
                {option.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <Stack spacing={0.75}>
          <Typography variant="caption" color="text.secondary">
            Visibility
          </Typography>
          <ToggleButtonGroup
            color="primary"
            size="small"
            value={activeVisibility}
            onChange={(_event, nextVisibility) => {
              const nextKeys = new Set(nextVisibility as string[]);
              setVisibility({
                nodes: nextKeys.has('nodes'),
                members: nextKeys.has('members'),
                loads: nextKeys.has('loads'),
                moments: nextKeys.has('moments'),
                restraints: nextKeys.has('restraints'),
                labels: nextKeys.has('labels'),
              });
            }}
          >
            <ToggleButton value="nodes">Nodes</ToggleButton>
            <ToggleButton value="members">Members</ToggleButton>
            <ToggleButton value="loads">Loads</ToggleButton>
            <ToggleButton value="moments">Moments</ToggleButton>
            <ToggleButton value="restraints">Restraints</ToggleButton>
            <ToggleButton value="labels">Labels</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Stack spacing={0.75} sx={{ ml: { xl: 'auto' } }}>
          <Typography variant="caption" color="text.secondary">
            Session
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <ImportDxfButton />
            <ImportJsonButton />
            <ExportJsonButton />
            <Button variant="outlined" color="secondary" onClick={validateModel}>
              Revalidate
            </Button>
            <Button variant="contained" onClick={resetToSampleModel}>
              Reset sample
            </Button>
            <Chip
              color={validationChipColor}
              label={validationChipLabel}
              variant="outlined"
            />
            <Chip
              label={
                selectedEntityLabel != null
                  ? `Selected: ${selectedEntityLabel}`
                  : 'Selected: none'
              }
              variant="outlined"
            />
          </Box>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
