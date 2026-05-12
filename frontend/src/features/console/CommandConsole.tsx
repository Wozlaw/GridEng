import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TerminalIcon from '@mui/icons-material/Terminal';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItemButton,
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
import { closeCommandConsole, useCommandConsoleStore } from './store';
import type { CommandConsoleEntry, CommandConsoleEntryLevel } from './types';

export function CommandConsole() {
  const { language } = useI18n();
  const isOpen = useCommandConsoleStore((state) => state.isOpen);
  const entries = useCommandConsoleStore((state) => state.entries);
  const history = useCommandConsoleStore((state) => state.history);
  const appendEntry = useCommandConsoleStore((state) => state.appendEntry);
  const clearEntries = useCommandConsoleStore((state) => state.clearEntries);
  const pushHistory = useCommandConsoleStore((state) => state.pushHistory);
  const [inputValue, setInputValue] = useState('');
  const [historyCursor, setHistoryCursor] = useState<number | null>(null);
  const [historyDraft, setHistoryDraft] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const outputEndRef = useRef<HTMLDivElement | null>(null);

  const text = useMemo(
    () => ({
      title: getConsoleMessage(language, 'title'),
      subtitle: getConsoleMessage(language, 'subtitle'),
      inputLabel: getConsoleMessage(language, 'inputLabel'),
      inputPlaceholder: getConsoleMessage(language, 'inputPlaceholder'),
      outputTitle: getConsoleMessage(language, 'outputTitle'),
      historyTitle: getConsoleMessage(language, 'historyTitle'),
      clear: getConsoleMessage(language, 'clear'),
      close: getConsoleMessage(language, 'close'),
      run: getConsoleMessage(language, 'run'),
      emptyLog: getConsoleMessage(language, 'emptyLog'),
      emptyHistory: getConsoleMessage(language, 'emptyHistory'),
      reuseCommand: getConsoleMessage(language, 'reuseCommand'),
    }),
    [language],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timerId = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 10);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    outputEndRef.current?.scrollIntoView({ block: 'end' });
  }, [entries, isOpen]);

  function handleSubmit() {
    const input = inputValue.trim();

    if (input.length === 0) {
      return;
    }

    appendEntry({
      level: 'command',
      lines: [input],
    });
    pushHistory(input);

    const result = executeConsoleInput(input, {
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
  }

  function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
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

    if (event.key === 'Escape') {
      event.preventDefault();
      closeCommandConsole();
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
    <Dialog
      open={isOpen}
      onClose={() => {
        closeCommandConsole();
      }}
      fullWidth
      maxWidth="lg"
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
            minHeight: { xs: '72vh', md: '76vh' },
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <TerminalIcon fontSize="small" />
              <Typography variant="h6">{text.title}</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {text.subtitle}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<DeleteIcon fontSize="small" />}
              onClick={() => {
                clearEntries();
              }}
            >
              {text.clear}
            </Button>
            <Tooltip title={text.close}>
              <IconButton
                aria-label={text.close}
                onClick={() => {
                  closeCommandConsole();
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent
        sx={{
          display: 'grid',
          gridTemplateRows: '1fr auto',
          gap: 2,
          px: 2,
          py: 2,
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            minHeight: 0,
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.7fr) 280px' },
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              minHeight: 0,
              display: 'grid',
              gridTemplateRows: 'auto 1fr',
              overflow: 'hidden',
            }}
          >
            <ConsoleSectionTitle title={text.outputTitle} />

            <Stack
              spacing={1}
              sx={{
                minHeight: 0,
                overflowY: 'auto',
                px: 1.25,
                py: 1.25,
              }}
            >
              {entries.length === 0
                ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ px: 0.5, py: 1.5, fontFamily: '"IBM Plex Mono", monospace' }}
                  >
                    {text.emptyLog}
                  </Typography>
                )
                : entries.map((entry) => (
                  <ConsoleEntryCard key={entry.id} entry={entry} />
                ))}
              <Box ref={outputEndRef} />
            </Stack>
          </Paper>

          <Paper
            variant="outlined"
            sx={{
              minHeight: 0,
              display: 'grid',
              gridTemplateRows: 'auto 1fr',
              overflow: 'hidden',
            }}
          >
            <ConsoleSectionTitle title={text.historyTitle} />

            {history.length === 0
              ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ px: 1.5, py: 1.5, fontFamily: '"IBM Plex Mono", monospace' }}
                >
                  {text.emptyHistory}
                </Typography>
              )
              : (
                <List
                  disablePadding
                  sx={{
                    minHeight: 0,
                    overflowY: 'auto',
                  }}
                >
                  {history.map((command, index) => (
                    <ListItemButton
                      key={`${command}-${index}`}
                      onClick={() => {
                        setInputValue(command);
                        setHistoryCursor(index);
                        inputRef.current?.focus();
                      }}
                      sx={{
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        alignItems: 'flex-start',
                      }}
                    >
                      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
                        >
                          {text.reuseCommand}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: '"IBM Plex Mono", monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {command}
                        </Typography>
                      </Stack>
                    </ListItemButton>
                  ))}
                </List>
              )}
          </Paper>
        </Box>

        <Paper
          variant="outlined"
          sx={{
            px: 1.5,
            py: 1.25,
          }}
        >
          <Stack spacing={1.25}>
            <TextField
              fullWidth
              inputRef={inputRef}
              label={text.inputLabel}
              placeholder={text.inputPlaceholder}
              value={inputValue}
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

            <Stack
              direction="row"
              spacing={1}
              sx={{ justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Typography variant="body2" color="text.secondary">
                `Ctrl+Shift+P`
              </Typography>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    clearEntries();
                  }}
                >
                  {text.clear}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon fontSize="small" />}
                  onClick={() => {
                    handleSubmit();
                  }}
                >
                  {text.run}
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      </DialogContent>
    </Dialog>
  );
}

function ConsoleSectionTitle({ title }: { title: string }) {
  return (
    <>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{
          px: 1.5,
          py: 0.75,
        }}
      >
        {title}
      </Typography>
      <Divider />
    </>
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
