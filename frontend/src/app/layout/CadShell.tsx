import { lazy, Suspense } from 'react';

import { Box, Paper, Stack, Typography } from '@mui/material';

import { ProjectTreePanel } from '../../widgets/project-tree';
import { PropertiesPanel } from '../../widgets/properties-panel';
import { BottomStatusBar } from './BottomStatusBar';
import { TopMenu } from './TopMenu';

const Viewport3D = lazy(async () => {
  const module = await import('../../widgets/viewport-3d/Viewport3D');

  return {
    default: module.Viewport3D,
  };
});

export function CadShell() {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        overflow: 'hidden',
      }}
    >
      <TopMenu />

      <Box
        component="main"
        sx={{
          minHeight: 0,
          display: 'grid',
          overflow: 'hidden',
          gap: 1.5,
          px: { xs: 1.25, md: 1.5 },
          py: 1.5,
          gridTemplateColumns: {
            xs: '1fr',
            lg: '280px minmax(0, 1fr) 360px',
          },
          gridTemplateRows: {
            xs: 'minmax(0, 1fr) minmax(0, 1.35fr) minmax(0, 1fr)',
            lg: '1fr',
          },
        }}
      >
        <ProjectTreePanel />
        <Suspense fallback={<ViewportLoadingFallback />}>
          <Viewport3D />
        </Suspense>
        <PropertiesPanel />
      </Box>

      <BottomStatusBar />
    </Box>
  );
}

function ViewportLoadingFallback() {
  return (
    <Paper
      variant="outlined"
      sx={{
        minHeight: 0,
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(8, 16, 25, 0.96) 0%, rgba(6, 12, 19, 0.92) 100%)',
      }}
    >
      <Stack spacing={1} sx={{ px: 3, py: 4, textAlign: 'center' }}>
        <Typography variant="overline" color="text.secondary">
          Viewport
        </Typography>
        <Typography variant="h6">Loading 3D Scene</Typography>
        <Typography variant="body2" color="text.secondary">
          Three.js and scene widgets are being loaded on demand.
        </Typography>
      </Stack>
    </Paper>
  );
}
