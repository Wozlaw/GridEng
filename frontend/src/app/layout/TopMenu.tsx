import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  AppBar,
  Box,
  ButtonBase,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

import { useModelStore } from '../store';
import {
  APP_COMMANDS_BY_ID,
  RIBBON_COMMAND_GROUPS,
  findHotkeyCommand,
  runAppCommand,
  shouldIgnoreHotkeys,
  type AppCommandContext,
  type AppCommandDefinition,
} from '../../shared/commands';
import { useI18n, type I18nKey, type TFunction } from '../../shared/i18n';
import { notify } from '../../shared/ui';
import { openCommandConsole } from '../../features/console';
import { DxfImportDialog } from '../../features/import-dxf/DxfImportDialog';
import { importGridEngJsonFile, type GridEngJsonImportStatus } from '../../features/import-json/importGridEngJson';

interface ImportFeedback {
  severity: GridEngJsonImportStatus;
  title: string;
  details: string[];
}

export function TopMenu() {
  const theme = useTheme();
  const { t } = useI18n();
  const modelName = useModelStore((state) => state.model.name);
  const viewMode = useModelStore((state) => state.viewMode);
  const visibility = useModelStore((state) => state.visibility);
  const setModel = useModelStore((state) => state.setModel);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImportingJson, setIsImportingJson] = useState(false);
  const [isDxfDialogOpen, setIsDxfDialogOpen] = useState(false);

  const ribbonState = [
    viewMode,
    visibility.axes,
    visibility.grid,
    visibility.loads,
    visibility.restraints,
  ].join('|');

  const commandContext = useMemo<AppCommandContext>(
    () => ({
      source: 'ribbon',
      openJsonPicker: () => fileInputRef.current?.click(),
      openDxfDialog: () => setIsDxfDialogOpen(true),
      openConsole: () => openCommandConsole(),
    }),
    [],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (shouldIgnoreHotkeys(event.target)) {
        return;
      }

      const command = findHotkeyCommand(event);

      if (command == null || command.isDisabled?.()) {
        return;
      }

      event.preventDefault();
      runAppCommand(command.id, {
        ...commandContext,
        source: 'hotkey',
      });
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [commandContext]);

  async function handleJsonFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || isImportingJson) {
      return;
    }

    setIsImportingJson(true);

    try {
      const result = await importGridEngJsonFile(file);

      if (result.status !== 'error' && result.model) {
        setModel(result.model);
      }

      const feedback = buildImportFeedback({
        t,
        fileName: file.name,
        status: result.status,
        details: result.details.length > 0 ? result.details : [result.message],
      });

      notify({
        severity: feedback.severity,
        title: feedback.title,
        details: feedback.details,
      });
    } finally {
      setIsImportingJson(false);
    }
  }

  return (
    <>
      <AppBar position="sticky" color="transparent" elevation={0}>
        <Toolbar
          sx={{
            alignItems: 'stretch',
            gap: 2,
            px: { xs: 1, md: 1.5 },
            py: 1,
            minHeight: 'unset',
            overflowX: 'auto',
          }}
        >
          <Stack
            spacing={0.35}
            sx={{
              minWidth: 188,
              flexShrink: 0,
              justifyContent: 'space-between',
              py: 0.5,
            }}
          >
            <Typography variant="overline" color="text.secondary">
              {t('topMenu.brandSubtitle')}
            </Typography>
            <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
              {modelName}
            </Typography>
          </Stack>

          <Box
            data-ribbon-state={ribbonState}
            sx={{
              display: 'flex',
              gap: 1,
              minWidth: 'max-content',
            }}
          >
            {RIBBON_COMMAND_GROUPS.map((group) => (
              <RibbonGroup
                key={group.id}
                title={t(group.titleKey)}
                primaryCommands={group.primaryCommandIds.map(getCommandById)}
                secondaryCommands={group.secondaryCommandIds.map(getCommandById)}
                commandContext={commandContext}
                themeModeColor={theme.palette.mode}
                isImportingJson={isImportingJson}
              />
            ))}
          </Box>
        </Toolbar>
      </AppBar>

      <input
        ref={fileInputRef}
        hidden
        type="file"
        accept=".json,application/json"
        onChange={(event) => {
          void handleJsonFileChange(event);
        }}
      />

      <DxfImportDialog
        open={isDxfDialogOpen}
        onClose={() => {
          setIsDxfDialogOpen(false);
        }}
      />
    </>
  );
}

interface RibbonGroupProps {
  title: string;
  primaryCommands: AppCommandDefinition[];
  secondaryCommands: AppCommandDefinition[];
  commandContext: AppCommandContext;
  themeModeColor: string;
  isImportingJson: boolean;
}

function RibbonGroup({
  title,
  primaryCommands,
  secondaryCommands,
  commandContext,
  themeModeColor,
  isImportingJson,
}: RibbonGroupProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        minWidth: 188,
        bgcolor: themeModeColor === 'dark' ? 'background.paper' : 'background.default',
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          px: 1,
          py: 0.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {title}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.max(primaryCommands.length, 1)}, minmax(0, 1fr))`,
          borderBottom: secondaryCommands.length > 0 ? '1px solid' : 'none',
          borderColor: 'divider',
        }}
      >
        {primaryCommands.map((command) => (
          <RibbonPrimaryCommandButton
            key={command.id}
            command={command}
            commandContext={commandContext}
            disabled={command.id === 'document.importJson' && isImportingJson}
          />
        ))}
      </Box>

      {secondaryCommands.length > 0 && (
        <List disablePadding dense>
          {secondaryCommands.map((command) => (
            <RibbonSecondaryCommandButton
              key={command.id}
              command={command}
              commandContext={commandContext}
              disabled={command.id === 'document.importJson' && isImportingJson}
            />
          ))}
        </List>
      )}
    </Paper>
  );
}

interface RibbonCommandButtonProps {
  command: AppCommandDefinition;
  commandContext: AppCommandContext;
  disabled?: boolean;
}

function RibbonPrimaryCommandButton({
  command,
  commandContext,
  disabled = false,
}: RibbonCommandButtonProps) {
  const theme = useTheme();
  const { t } = useI18n();
  const Icon = command.icon;
  const label = t(command.labelKey);
  const tooltip = t(command.tooltipKey);
  const isActive = command.isActive?.() ?? false;
  const isDisabled = disabled || command.isDisabled?.() === true;

  return (
    <Tooltip title={tooltip}>
      <Box>
        <ButtonBase
          aria-label={label}
          disabled={isDisabled}
          onClick={() => {
            runAppCommand(command.id, commandContext);
          }}
          sx={{
            width: '100%',
            minWidth: 72,
            minHeight: 72,
            px: 1,
            py: 1.25,
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: isActive ? alpha(theme.palette.selected.main, 0.16) : 'transparent',
            color: command.placeholder ? 'warning.main' : isActive ? 'selected.main' : 'text.primary',
            flexDirection: 'column',
            gap: 0.75,
            alignItems: 'center',
            justifyContent: 'center',
            '&:last-of-type': {
              borderRight: 'none',
            },
          }}
        >
          <Icon fontSize="small" />
          <Typography variant="caption" sx={{ textAlign: 'center', lineHeight: 1.2 }}>
            {label}
          </Typography>
        </ButtonBase>
      </Box>
    </Tooltip>
  );
}

function RibbonSecondaryCommandButton({
  command,
  commandContext,
  disabled = false,
}: RibbonCommandButtonProps) {
  const theme = useTheme();
  const { t } = useI18n();
  const Icon = command.icon;
  const label = t(command.labelKey);
  const tooltip = t(command.tooltipKey);
  const isActive = command.isActive?.() ?? false;
  const isDisabled = disabled || command.isDisabled?.() === true;

  return (
    <Tooltip title={tooltip}>
      <Box>
        <ListItemButton
          aria-label={label}
          disabled={isDisabled}
          onClick={() => {
            runAppCommand(command.id, commandContext);
          }}
          sx={{
            minHeight: 32,
            px: 1,
            py: 0.25,
            bgcolor: isActive ? alpha(theme.palette.selected.main, 0.12) : 'transparent',
            color: command.placeholder ? 'warning.main' : isActive ? 'selected.main' : 'text.primary',
          }}
        >
          <ListItemIcon sx={{ minWidth: 28, color: 'inherit' }}>
            <Icon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={label}
            slotProps={{
              primary: {
                variant: 'caption',
                sx: {
                  lineHeight: 1.2,
                },
              },
            }}
          />
        </ListItemButton>
      </Box>
    </Tooltip>
  );
}

function getCommandById(commandId: string): AppCommandDefinition {
  const command = APP_COMMANDS_BY_ID.get(commandId);

  if (command == null) {
    throw new Error(`Command ${commandId} is not registered.`);
  }

  return command;
}

function buildImportFeedback({
  t,
  fileName,
  status,
  details,
}: {
  t: TFunction<I18nKey>;
  fileName: string;
  status: GridEngJsonImportStatus;
  details: string[];
}): ImportFeedback {
  if (status === 'error') {
    return {
      severity: 'error',
      title: t('importJson.feedback.errorTitle', { fileName }),
      details,
    };
  }

  if (status === 'warning') {
    return {
      severity: 'warning',
      title: t('importJson.feedback.warningTitle', { fileName }),
      details,
    };
  }

  return {
    severity: 'success',
    title: t('importJson.feedback.successTitle', { fileName }),
    details: details.length > 0 ? details : [t('importJson.feedback.successDetail')],
  };
}
