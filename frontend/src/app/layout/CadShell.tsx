import type { PointerEvent as ReactPointerEvent } from 'react';
import { lazy, Suspense, useEffect, useState } from 'react';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';

import {
  PROPERTIES_WIDTH_MAX,
  PROPERTIES_WIDTH_MIN,
  PROJECT_TREE_WIDTH_MAX,
  PROJECT_TREE_WIDTH_MIN,
  useLayoutStore,
  useModelStore,
} from '../store';
import { useI18n } from '../../shared/i18n';
import { CommandConsole } from '../../features/console';
import { ProjectMaterialsDialog, ProjectProfilesDialog } from '../../features/project-catalogs';
import { WindEditorDialog } from '../../features/wind-editor';
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

type DragSide = 'left' | 'right';

interface DragState {
  side: DragSide;
  startX: number;
  startWidth: number;
}

export function CadShell() {
  const { t } = useI18n();
  const fitRequestNonce = useModelStore((state) => state.fitRequestNonce);
  const projectTreeWidth = useLayoutStore((state) => state.projectTreeWidth);
  const projectTreeCollapsed = useLayoutStore((state) => state.projectTreeCollapsed);
  const propertiesWidth = useLayoutStore((state) => state.propertiesWidth);
  const propertiesCollapsed = useLayoutStore((state) => state.propertiesCollapsed);
  const setProjectTreeWidth = useLayoutStore((state) => state.setProjectTreeWidth);
  const toggleProjectTreeCollapsed = useLayoutStore((state) => state.toggleProjectTreeCollapsed);
  const setPropertiesWidth = useLayoutStore((state) => state.setPropertiesWidth);
  const togglePropertiesCollapsed = useLayoutStore((state) => state.togglePropertiesCollapsed);
  const [dragState, setDragState] = useState<DragState | null>(null);

  useEffect(() => {
    if (dragState == null) {
      return;
    }

    const activeDrag = dragState;

    function handlePointerMove(event: PointerEvent) {
      if (activeDrag.side === 'left') {
        setProjectTreeWidth(
          clampWidth(
            activeDrag.startWidth + (event.clientX - activeDrag.startX),
            PROJECT_TREE_WIDTH_MIN,
            PROJECT_TREE_WIDTH_MAX,
          ),
        );
        return;
      }

      setPropertiesWidth(
        clampWidth(
          activeDrag.startWidth - (event.clientX - activeDrag.startX),
          PROPERTIES_WIDTH_MIN,
          PROPERTIES_WIDTH_MAX,
        ),
      );
    }

    function stopDragging() {
      setDragState(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopDragging);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopDragging);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragState, setProjectTreeWidth, setPropertiesWidth]);

  function beginResize(side: DragSide, event: ReactPointerEvent<HTMLDivElement>) {
    if ((side === 'left' && projectTreeCollapsed) || (side === 'right' && propertiesCollapsed)) {
      return;
    }

    event.preventDefault();

    setDragState({
      side,
      startX: event.clientX,
      startWidth: side === 'left' ? projectTreeWidth : propertiesWidth,
    });
  }

  const desktopColumns = `${projectTreeCollapsed ? 0 : projectTreeWidth}px 14px minmax(0, 1fr) 14px ${propertiesCollapsed ? 0 : propertiesWidth}px`;

  return (
    <Box
      sx={{
        width: '100%',
        minWidth: 0,
        minHeight: 0,
        height: '100%',
        display: 'grid',
        gridTemplateRows: 'var(--top-menu-height, 184px) minmax(0, 1fr) auto',
        overflow: 'hidden',
      }}
    >
      <TopMenu />

      <Box
        component="main"
        sx={{
          width: '100%',
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
          px: { xs: 1, md: 1.25 },
          py: 1,
        }}
      >
        <Box
          sx={{
            display: { xs: 'grid', lg: 'none' },
            height: '100%',
            width: '100%',
            minWidth: 0,
            minHeight: 0,
            gap: 1,
            gridTemplateRows: 'minmax(0, 0.9fr) minmax(0, 1.35fr) minmax(0, 1fr)',
          }}
        >
          <ProjectTreePanel />
          <Box
            sx={{
              minWidth: 0,
              minHeight: 0,
              display: 'grid',
              gridTemplateRows: 'minmax(0, 1fr) auto',
              overflow: 'hidden',
            }}
          >
            <Suspense fallback={<ViewportLoadingFallback />}>
              <Viewport3D />
            </Suspense>
            <CommandConsole />
          </Box>
          <PropertiesPanel />
        </Box>

        <Box
          data-fit-request={fitRequestNonce}
          sx={{
            display: { xs: 'none', lg: 'grid' },
            height: '100%',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            minHeight: 0,
            gridTemplateColumns: desktopColumns,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ minWidth: 0, minHeight: 0, height: '100%', overflow: 'hidden' }}>
            {!projectTreeCollapsed && <ProjectTreePanel />}
          </Box>

          <PanelHandle
            side="left"
            collapsed={projectTreeCollapsed}
            label={projectTreeCollapsed ? t('layout.projectTree.show') : t('layout.projectTree.hide')}
            onResizeStart={(event) => beginResize('left', event)}
            onToggle={() => toggleProjectTreeCollapsed()}
          />

          <Box
            sx={{
              minWidth: 0,
              minHeight: 0,
              display: 'grid',
              gridTemplateRows: 'minmax(0, 1fr) auto',
              overflow: 'hidden',
            }}
          >
            <Suspense fallback={<ViewportLoadingFallback />}>
              <Viewport3D />
            </Suspense>
            <CommandConsole />
          </Box>

          <PanelHandle
            side="right"
            collapsed={propertiesCollapsed}
            label={propertiesCollapsed ? t('layout.properties.show') : t('layout.properties.hide')}
            onResizeStart={(event) => beginResize('right', event)}
            onToggle={() => togglePropertiesCollapsed()}
          />

          <Box sx={{ minWidth: 0, minHeight: 0, height: '100%', overflow: 'hidden' }}>
            {!propertiesCollapsed && <PropertiesPanel />}
          </Box>
        </Box>
      </Box>

      <BottomStatusBar />
      <ProjectProfilesDialog />
      <ProjectMaterialsDialog />
      <WindEditorDialog />
    </Box>
  );
}

interface PanelHandleProps {
  side: DragSide;
  collapsed: boolean;
  label: string;
  onResizeStart: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onToggle: () => void;
}

function PanelHandle({
  side,
  collapsed,
  label,
  onResizeStart,
  onToggle,
}: PanelHandleProps) {
  const ToggleIcon = side === 'left'
    ? collapsed
      ? ChevronRightIcon
      : ChevronLeftIcon
    : collapsed
      ? ChevronLeftIcon
      : ChevronRightIcon;

  return (
    <Box
      onPointerDown={onResizeStart}
      sx={{
        position: 'relative',
        minHeight: 0,
        cursor: collapsed ? 'default' : 'col-resize',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          width: '1px',
          bgcolor: 'divider',
          transform: 'translateX(-50%)',
        },
      }}
    >
      <Tooltip title={label}>
        <IconButton
          aria-label={label}
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            onToggle();
          }}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            zIndex: 1,
            width: 20,
            height: 40,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <ToggleIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

function ViewportLoadingFallback() {
  const { t } = useI18n();

  return (
    <Paper
      variant="outlined"
      sx={{
        minHeight: 0,
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      <Stack spacing={1} sx={{ px: 3, py: 4, textAlign: 'center' }}>
        <Typography variant="overline" color="text.secondary">
          {t('viewport.title')}
        </Typography>
        <Typography variant="h6">{t('viewport.loadingTitle')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t('viewport.loadingBody')}
        </Typography>
      </Stack>
    </Paper>
  );
}

function clampWidth(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}
