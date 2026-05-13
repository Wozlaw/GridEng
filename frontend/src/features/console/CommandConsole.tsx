import type { PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import { Box, Dialog, DialogContent, IconButton, Tooltip } from '@mui/material';

import { useI18n } from '../../shared/i18n';
import { ConsoleView } from './ConsoleView';
import {
  closeCommandConsole,
  DEFAULT_DOCKED_HEIGHT,
  MAX_DOCKED_HEIGHT,
  MIN_DOCKED_HEIGHT,
  openCommandConsole,
  useCommandConsoleStore,
} from './store';

interface ResizeState {
  startY: number;
  startHeight: number;
}

export function CommandConsole() {
  const { language } = useI18n();
  const isDockedOpen = useCommandConsoleStore((state) => state.isDockedOpen);
  const isFullscreenOpen = useCommandConsoleStore((state) => state.isFullscreenOpen);
  const dockedHeight = useCommandConsoleStore((state) => state.dockedHeight);
  const setDockedHeight = useCommandConsoleStore((state) => state.setDockedHeight);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);

  useEffect(() => {
    if (resizeState == null) {
      return;
    }

    const activeResize = resizeState;

    function handlePointerMove(event: PointerEvent) {
      setDockedHeight(
        clampHeight(activeResize.startHeight - (event.clientY - activeResize.startY)),
      );
    }

    function stopResizing() {
      setResizeState(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopResizing);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizeState, setDockedHeight]);

  function beginResize(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    setResizeState({
      startY: event.clientY,
      startHeight: dockedHeight,
    });
  }

  return (
    <>
      {isDockedOpen && (
        <Box
          sx={{
            display: { xs: 'none', lg: 'grid' },
            minHeight: 0,
            height: dockedHeight || DEFAULT_DOCKED_HEIGHT,
            gridTemplateRows: '12px minmax(0, 1fr)',
            overflow: 'hidden',
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
          }}
        >
          <Box
            onPointerDown={beginResize}
            sx={{
              position: 'relative',
              cursor: 'row-resize',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                right: 0,
                top: '50%',
                height: '1px',
                bgcolor: 'divider',
                transform: 'translateY(-50%)',
              },
            }}
          />

          <Box sx={{ minHeight: 0, overflow: 'hidden' }}>
            <ConsoleView
              onExpand={() => {
                openCommandConsole();
              }}
            />
          </Box>
        </Box>
      )}

      <Dialog
        open={isFullscreenOpen}
        onClose={() => {
          closeCommandConsole();
        }}
        fullScreen
        slotProps={{
          paper: {
            sx: {
              bgcolor: 'background.default',
            },
          },
        }}
      >
        <Box
          sx={{
            height: '100%',
            display: 'grid',
            gridTemplateRows: 'auto minmax(0, 1fr)',
            px: { xs: 1, sm: 1.5 },
            py: { xs: 1, sm: 1.5 },
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Tooltip title={language === 'ru' ? 'Закрыть' : 'Close'}>
              <IconButton
                aria-label={language === 'ru' ? 'Закрыть' : 'Close'}
                onClick={() => {
                  closeCommandConsole();
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ minHeight: 0, overflow: 'hidden' }}>
            <DialogContent sx={{ p: 0, height: '100%', minHeight: 0 }}>
              <ConsoleView
                autoFocus
                onClose={() => {
                  closeCommandConsole();
                }}
              />
            </DialogContent>
          </Box>
        </Box>
      </Dialog>
    </>
  );
}

function clampHeight(value: number): number {
  return Math.min(MAX_DOCKED_HEIGHT, Math.max(MIN_DOCKED_HEIGHT, Math.round(value)));
}
