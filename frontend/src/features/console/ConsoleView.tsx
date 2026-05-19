import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TerminalIcon from '@mui/icons-material/Terminal';
import {
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { executeConsoleInput } from '../../shared/commands';
import { useI18n } from '../../shared/i18n';
import { notify } from '../../shared/ui';
import { getConsoleMessage } from './messages';
import { useCommandConsoleStore } from './store';
import type { CommandConsoleEntry, CommandConsoleEntryLevel } from './types';

interface ConsoleViewProps {
  autoFocus?: boolean;
  onClose?: () => void;
  onExpand?: () => void;
}

export function ConsoleView({
  autoFocus = false,
  onClose,
  onExpand,
}: ConsoleViewProps) {
  const { language } = useI18n();
  const entries = useCommandConsoleStore((state) => state.entries);
  const history = useCommandConsoleStore((state) => state.history);
  const inputValue = useCommandConsoleStore((state) => state.inputValue);
  const appendEntry = useCommandConsoleStore((state) => state.appendEntry);
  const clearEntries = useCommandConsoleStore((state) => state.clearEntries);
  const pushHistory = useCommandConsoleStore((state) => state.pushHistory);
  const setInputValue = useCommandConsoleStore((state) => state.setInputValue);
  const [historyCursor, setHistoryCursor] = useState<number | null>(null);
  const [historyDraft, setHistoryDraft] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const outputEndRef = useRef<HTMLDivElement | null>(null);

  const text = useMemo(
    () => ({
      title: getConsoleMessage(language, 'title'),
      inputLabel: getConsoleMessage(language, 'inputLabel'),
      inputPlaceholder: getConsoleMessage(language, 'inputPlaceholder'),
      run: getConsoleMessage(language, 'run'),
      emptyLog: getConsoleMessage(language, 'emptyLog'),
      expand: getConsoleMessage(language, 'expand'),
    }),
    [language],
  );

  useEffect(() => {
    if (!autoFocus) {
      return;
    }

    const timerId = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 10);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [autoFocus]);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ block: 'end' });
  }, [entries]);

  async function handleSubmit() {
    const input = inputValue.trim();

    if (input.length === 0 || isRunning) {
      return;
    }

    setIsRunning(true);
    appendEntry({
      level: 'command',
      lines: [input],
    });
    pushHistory(input);

    try {
      const result = await executeConsoleInput(input, {
        source: 'console',
        language,
      });

      if (result.clearLog) {
        clearEntries();
      } else if (result.title != null || result.lines.length > 0) {
        appendEntry({
          level: result.severity,
          title: result.title,
          lines: result.lines,
        });
      }

      if (result.notify) {
        notify({
          severity: result.severity,
          title: result.title,
          details: result.lines.length > 0 ? result.lines : undefined,
        });
      }

      setInputValue('');
      setHistoryCursor(null);
      setHistoryDraft('');
      inputRef.current?.focus();
    } finally {
      setIsRunning(false);
    }
  }

  function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleSubmit();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      navigateHistory('older');
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      navigateHistory('newer');
      return;
    }

    if (event.key === 'Escape' && onClose != null) {
      event.preventDefault();
      onClose();
    }
  }

  function navigateHistory(direction: 'older' | 'newer') {
    if (history.length === 0) {
      return;
    }

    if (direction === 'older') {
      const nextCursor = historyCursor == null ? 0 : Math.min(historyCursor + 1, history.length - 1);

      if (historyCursor == null) {
        setHistoryDraft(inputValue);
      }

      setHistoryCursor(nextCursor);
      setInputValue(history[nextCursor] ?? inputValue);
      return;
    }

    if (historyCursor == null) {
      return;
    }

    const nextCursor = historyCursor - 1;
    if (nextCursor < 0) {
      setHistoryCursor(null);
      setInputValue(historyDraft);
      return;
    }

    setHistoryCursor(nextCursor);
    setInputValue(history[nextCursor] ?? historyDraft);
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        minHeight: 0,
        height: '100%',
        display: 'grid',
        gridTemplateRows: 'minmax(0, 1fr) auto',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <Stack
        spacing={1}
        sx={{
          minHeight: 0,
          overflowY: 'auto',
          overscrollBehaviorY: 'contain',
          scrollbarGutter: 'stable',
          px: 1.25,
          py: 1.1,
        }}
      >
        {entries.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ px: 0.5, py: 1.5, fontFamily: '"IBM Plex Mono", monospace' }}
          >
            {text.emptyLog}
          </Typography>
        ) : (
          entries.map((entry) => (
            <ConsoleEntryCard key={entry.id} entry={entry} />
          ))
        )}
        <Box ref={outputEndRef} />
      </Stack>

      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          px: 1.25,
          py: 1,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <TextField
            fullWidth
            size="small"
            inputRef={inputRef}
            label={<ConsoleInputLabel text={text.inputLabel} />}
            placeholder={text.inputPlaceholder}
            value={inputValue}
            disabled={isRunning}
            onChange={(event) => {
              setInputValue(event.target.value);
              setHistoryCursor(null);
            }}
            onKeyDown={handleInputKeyDown}
            slotProps={{
              input: {
                sx: {
                  fontFamily: '"IBM Plex Mono", monospace',
                },
              },
            }}
          />

          <IconButton
            aria-label={text.run}
            color="primary"
            disabled={isRunning}
            onClick={() => {
              void handleSubmit();
            }}
          >
            {isRunning ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon fontSize="small" />}
          </IconButton>

          {onExpand != null && (
            <Tooltip title={text.expand}>
              <IconButton
                aria-label={text.expand}
                onClick={() => {
                  onExpand();
                }}
              >
                <OpenInFullIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>
    </Paper>
  );
}

function ConsoleInputLabel({ text }: { text?: string }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
      }}
    >
      <TerminalIcon sx={{ fontSize: 16 }} />
      {text != null && (
        <Box component="span">
          {text}
        </Box>
      )}
    </Box>
  );
}

function ConsoleEntryCard({ entry }: { entry: CommandConsoleEntry }) {
  const color = getEntryColor(entry.level);

  return (
    <Paper
      variant="outlined"
      sx={{
        px: 1.25,
        py: 1,
        borderColor: color.border,
        bgcolor: color.background,
      }}
    >
      <Stack spacing={0.5}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}
        >
          <Typography
            variant="caption"
            sx={{
              color: color.accent,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 700,
            }}
          >
            {entry.level}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontFamily: '"IBM Plex Mono", monospace' }}
          >
            {formatConsoleTimestamp(entry.timestamp)}
          </Typography>
        </Stack>

        {entry.title != null && (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {entry.title}
          </Typography>
        )}

        {entry.lines.length > 0 && (
          <Typography
            component="pre"
            variant="body2"
            sx={{
              m: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: '"IBM Plex Mono", monospace',
            }}
          >
            {entry.lines.join('\n')}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}

function getEntryColor(level: CommandConsoleEntryLevel) {
  switch (level) {
    case 'success':
      return { accent: '#79d7a7', border: 'success.main', background: 'rgba(121, 215, 167, 0.05)' };
    case 'warning':
      return { accent: '#e2c06a', border: 'warning.main', background: 'rgba(226, 192, 106, 0.05)' };
    case 'error':
      return { accent: '#e47c7c', border: 'error.main', background: 'rgba(228, 124, 124, 0.06)' };
    case 'info':
      return { accent: '#8fb1e8', border: 'info.main', background: 'rgba(143, 177, 232, 0.05)' };
    case 'command':
    default:
      return { accent: '#f2f2f2', border: 'divider', background: 'rgba(255, 255, 255, 0.02)' };
  }
}

function formatConsoleTimestamp(value: number): string {
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
