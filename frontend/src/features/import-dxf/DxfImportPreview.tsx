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

import { formatNumber, formatOptionalText } from '../../shared/utils/format';
import type { DxfImportPreview as DxfImportPreviewData } from './types';

interface DxfImportPreviewProps {
  fileName: string | null;
  preview: DxfImportPreviewData | null;
  isBusy?: boolean;
}

export function DxfImportPreviewPanel({ fileName, preview, isBusy = false }: DxfImportPreviewProps) {
  if (!fileName) {
    return (
      <Paper variant="outlined" sx={{ p: 2.5, borderStyle: 'dashed' }}>
        <Typography variant="subtitle2">DXF preview</Typography>
        <Typography variant="body2" color="text.secondary">
          Select a `.dxf` file to generate an import preview.
        </Typography>
      </Paper>
    );
  }

  if (isBusy || !preview) {
    return (
      <Paper variant="outlined" sx={{ p: 2.5, borderStyle: 'dashed' }}>
        <Typography variant="subtitle2">Preparing preview</Typography>
        <Typography variant="body2" color="text.secondary">
          Reading and analyzing `{fileName}`...
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
              <Typography variant="subtitle2">DXF preview</Typography>
              <Typography variant="body2" color="text.secondary">
                {fileName}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              <Chip
                color={preview.errors.length > 0 ? 'error' : preview.warnings.length > 0 ? 'warning' : 'success'}
                label={preview.errors.length > 0 ? 'Errors present' : preview.warnings.length > 0 ? 'Warnings only' : 'Ready to import'}
                size="small"
                variant="outlined"
              />
              <Chip label={preview.is3D ? '3D' : '2D'} size="small" variant="outlined" />
            </Stack>
          </Stack>

          <Divider />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }} useFlexGap>
            <PreviewMetric label="LINE entities" value={String(preview.linesCount)} />
            <PreviewMetric label="Ignored entities" value={String(preview.ignoredEntitiesCount)} />
            <PreviewMetric label="Nodes" value={String(preview.nodesCount)} />
            <PreviewMetric label="Members" value={String(preview.membersCount)} />
            <PreviewMetric label="Merged nodes" value={String(preview.mergedNodesCount)} />
            <PreviewMetric label="Dangling members" value={String(preview.danglingMembersCount)} />
            <PreviewMetric
              label="Z range"
              value={preview.zRange ? `${formatNumber(preview.zRange.min, 2)} .. ${formatNumber(preview.zRange.max, 2)} mm` : '-'}
            />
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Color groups
        </Typography>
        {preview.colorGroups.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No member groups available yet.
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
                  Members: {group.membersCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Layer: {formatOptionalText(group.layer)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Profile: {formatOptionalText(group.profileId)}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      {preview.errors.length > 0 && (
        <Alert severity="error" variant="outlined">
          <AlertTitle>Import errors</AlertTitle>
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
          <AlertTitle>Import warnings</AlertTitle>
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
