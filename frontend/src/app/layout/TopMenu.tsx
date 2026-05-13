import type { ChangeEvent, MouseEvent as ReactMouseEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import FoundationIcon from '@mui/icons-material/Foundation';
import {
  AppBar,
  Box,
  ButtonBase,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
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
import { toggleDockedCommandConsole, useCommandConsoleStore } from '../../features/console';
import { DxfImportDialog } from '../../features/import-dxf/DxfImportDialog';
import { importGridEngJsonFile, type GridEngJsonImportStatus } from '../../features/import-json/importGridEngJson';

interface ImportFeedback {
  severity: GridEngJsonImportStatus;
  title: string;
  details: string[];
}

const RIBBON_TOOLTIP_ENTER_DELAY_MS = 450;

export function TopMenu() {
  const { t } = useI18n();
  const viewMode = useModelStore((state) => state.viewMode);
  const visibility = useModelStore((state) => state.visibility);
  const isDockedConsoleOpen = useCommandConsoleStore((state) => state.isDockedOpen);
  const setModel = useModelStore((state) => state.setModel);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const ribbonScrollRef = useRef<HTMLDivElement | null>(null);
  const [isImportingJson, setIsImportingJson] = useState(false);
  const [isDxfDialogOpen, setIsDxfDialogOpen] = useState(false);

  const ribbonState = [
    viewMode,
    visibility.axes,
    visibility.grid,
    visibility.loads,
    visibility.restraints,
    visibility.labels,
    isDockedConsoleOpen,
  ].join('|');

  const commandContext = useMemo<AppCommandContext>(
    () => ({
      source: 'ribbon',
      openJsonPicker: () => fileInputRef.current?.click(),
      openDxfDialog: () => setIsDxfDialogOpen(true),
      openConsole: () => toggleDockedCommandConsole(),
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

  function handleRibbonWheel(event: React.WheelEvent<HTMLDivElement>) {
    const container = ribbonScrollRef.current;

    if (container == null || container.scrollWidth <= container.clientWidth) {
      return;
    }

    const nextDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.deltaY;

    if (nextDelta === 0) {
      return;
    }

    event.preventDefault();
    container.scrollLeft += nextDelta;
  }

  return (
    <>
      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: '100%',
          height: 'var(--top-menu-height, 184px)',
          overflow: 'hidden',
        }}
      >
        <Toolbar
          sx={{
            height: '100%',
            alignItems: 'stretch',
            gap: 1,
            px: { xs: 1, md: 1.5 },
            py: 0,
            minHeight: 'unset',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <RibbonLogo />

          <Box
            ref={ribbonScrollRef}
            onWheel={handleRibbonWheel}
            sx={{
              flex: '1 1 auto',
              minWidth: 0,
              maxWidth: '100%',
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': {
                display: 'none',
              },
            }}
          >
            <Box
              data-ribbon-state={ribbonState}
              sx={{
                display: 'flex',
                gap: 1,
                width: 'max-content',
                minWidth: '100%',
              }}
            >
              {RIBBON_COMMAND_GROUPS.map((group) => (
                <RibbonGroup
                  key={group.id}
                  title={t(group.titleKey)}
                  primaryCommands={group.primaryCommandIds.map(getCommandById)}
                  inlineSecondaryCommands={(group.inlineSecondaryCommandIds ?? []).map(getCommandById)}
                  menuSecondaryCommands={(group.menuSecondaryCommandIds ?? []).map(getCommandById)}
                  commandContext={commandContext}
                  isImportingJson={isImportingJson}
                />
              ))}
            </Box>
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
  inlineSecondaryCommands: AppCommandDefinition[];
  menuSecondaryCommands: AppCommandDefinition[];
  commandContext: AppCommandContext;
  isImportingJson: boolean;
}

function RibbonGroup({
  title,
  primaryCommands,
  inlineSecondaryCommands,
  menuSecondaryCommands,
  commandContext,
  isImportingJson,
}: RibbonGroupProps) {
  const theme = useTheme();
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const hasMenu = menuSecondaryCommands.length > 0;
  const hasInlineColumn = primaryCommands.length === 1 && inlineSecondaryCommands.length > 0;
  const inlineCommands = hasInlineColumn ? inlineSecondaryCommands.slice(0, 2) : [];

  function openGroupMenu(event: ReactMouseEvent<HTMLElement>) {
    if (!hasMenu) {
      return;
    }

    setMenuAnchorEl(event.currentTarget);
  }

  function closeGroupMenu() {
    setMenuAnchorEl(null);
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'grid',
        gridTemplateRows: 'minmax(0, 1fr) auto',
        width: 'fit-content',
        minWidth: 0,
        bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default',
        overflow: 'hidden',
      }}
    >
      {hasInlineColumn ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '92px 140px',
            minHeight: 0,
          }}
        >
          <RibbonPrimaryCommandButton
            command={primaryCommands[0]}
            commandContext={commandContext}
            disabled={isTemporarilyDisabled(primaryCommands[0].id, isImportingJson)}
          />

          <Box
            sx={{
              display: 'grid',
              gridTemplateRows: `repeat(${inlineCommands.length}, minmax(0, 1fr))`,
              borderLeft: '1px solid',
              borderColor: 'divider',
            }}
          >
            {inlineCommands.map((command) => (
              <RibbonInlineSecondaryCommandButton
                key={command.id}
                command={command}
                commandContext={commandContext}
                disabled={isTemporarilyDisabled(command.id, isImportingJson)}
              />
            ))}
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.max(primaryCommands.length, 1)}, minmax(84px, 1fr))`,
            minHeight: 0,
          }}
        >
          {primaryCommands.map((command) => (
            <RibbonPrimaryCommandButton
              key={command.id}
              command={command}
              commandContext={commandContext}
              disabled={isTemporarilyDisabled(command.id, isImportingJson)}
            />
          ))}
        </Box>
      )}

      <RibbonGroupTitle
        title={title}
        hasMenu={hasMenu}
        onClick={openGroupMenu}
      />

      {hasMenu && (
        <Menu
          anchorEl={menuAnchorEl}
          open={menuAnchorEl != null}
          onClose={closeGroupMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{
            paper: {
              variant: 'outlined',
              sx: {
                minWidth: 220,
                bgcolor: 'background.paper',
              },
            },
          }}
        >
          {menuSecondaryCommands.map((command) => (
            <RibbonMenuCommandItem
              key={command.id}
              command={command}
              commandContext={commandContext}
              disabled={isTemporarilyDisabled(command.id, isImportingJson)}
              onClose={closeGroupMenu}
            />
          ))}
        </Menu>
      )}
    </Paper>
  );
}

function RibbonLogo() {
  return (
    <Tooltip title="GridEng" enterDelay={RIBBON_TOOLTIP_ENTER_DELAY_MS}>
      <span
        aria-label="GridEng"
        style={{
          flex: '0 0 auto',
          width: '96px',
          minWidth: '96px',
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          alignSelf: 'center',
        }}
      >
        <FoundationIcon sx={{ fontSize: 80, color: '#3b82f6' }} />
      </span>
    </Tooltip>
  );
}

interface RibbonGroupTitleProps {
  title: string;
  hasMenu: boolean;
  onClick: (event: ReactMouseEvent<HTMLElement>) => void;
}

const ribbonGroupTitleContainerSx = {
  minHeight: 28,
  height: 28,
  px: 1,
  py: 0.5,
  borderTop: '1px solid',
  borderColor: 'divider',
  color: 'text.secondary',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
} as const;

const ribbonGroupTitleTextSx = {
  color: 'inherit',
  fontSize: 11,
  fontWeight: 500,
  lineHeight: 1,
} as const;

function RibbonGroupTitle({ title, hasMenu, onClick }: RibbonGroupTitleProps) {
  const theme = useTheme();

  if (!hasMenu) {
    return (
      <Typography
        sx={{
          ...ribbonGroupTitleContainerSx,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        <Box component="span" sx={ribbonGroupTitleTextSx}>
          {title}
        </Box>
      </Typography>
    );
  }

  return (
    <ButtonBase
      aria-label={title}
      onClick={onClick}
      sx={{
        ...ribbonGroupTitleContainerSx,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 0.2,
        '&:hover': {
          bgcolor: alpha(theme.palette.selected.main, 0.08),
        },
      }}
    >
      <Typography component="span" sx={ribbonGroupTitleTextSx}>
        {title}
      </Typography>
      <ArrowDropDownIcon sx={{ fontSize: 16, color: 'inherit' }} />
    </ButtonBase>
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
    <Tooltip title={tooltip} enterDelay={RIBBON_TOOLTIP_ENTER_DELAY_MS}>
      <Box sx={{ minWidth: 0 }}>
        <ButtonBase
          aria-label={label}
          disabled={isDisabled}
          onClick={() => {
            runAppCommand(command.id, commandContext);
          }}
          sx={{
            minWidth: 92,
            width: 92,
            minHeight: 92,
            height: 92,
            px: 1,
            py: 1.15,
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
          <Typography
            variant="caption"
            sx={{
              textAlign: 'center',
              lineHeight: 1.15,
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
            }}
          >
            {label}
          </Typography>
        </ButtonBase>
      </Box>
    </Tooltip>
  );
}

function RibbonInlineSecondaryCommandButton({
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
    <Tooltip title={tooltip} enterDelay={RIBBON_TOOLTIP_ENTER_DELAY_MS}>
      <Box sx={{ minWidth: 0 }}>
        <ButtonBase
          aria-label={label}
          disabled={isDisabled}
          onClick={() => {
            runAppCommand(command.id, commandContext);
          }}
          sx={{
            width: '100%',
            minWidth: 0,
            minHeight: 46,
            px: 1,
            py: 0.65,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: isActive ? alpha(theme.palette.selected.main, 0.14) : 'transparent',
            color: command.placeholder ? 'warning.main' : isActive ? 'selected.main' : 'text.primary',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 0.8,
            textAlign: 'left',
            '&:last-of-type': {
              borderBottom: 'none',
            },
          }}
        >
          <Icon sx={{ fontSize: 16, flexShrink: 0 }} />
          <Typography variant="caption" sx={{ lineHeight: 1.15 }}>
            {label}
          </Typography>
        </ButtonBase>
      </Box>
    </Tooltip>
  );
}

interface RibbonMenuCommandItemProps extends RibbonCommandButtonProps {
  onClose: () => void;
}

function RibbonMenuCommandItem({
  command,
  commandContext,
  disabled = false,
  onClose,
}: RibbonMenuCommandItemProps) {
  const theme = useTheme();
  const { t } = useI18n();
  const Icon = command.icon;
  const label = t(command.labelKey);
  const tooltip = t(command.tooltipKey);
  const isActive = command.isActive?.() ?? false;
  const isDisabled = disabled || command.isDisabled?.() === true;

  return (
    <Tooltip
      title={tooltip}
      placement="right"
      enterDelay={RIBBON_TOOLTIP_ENTER_DELAY_MS}
    >
      <Box>
        <MenuItem
          disabled={isDisabled}
          onClick={() => {
            onClose();
            runAppCommand(command.id, commandContext);
          }}
          sx={{
            minHeight: 34,
            gap: 1,
            bgcolor: isActive ? alpha(theme.palette.selected.main, 0.14) : 'transparent',
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
                sx: { lineHeight: 1.2 },
              },
            }}
          />
        </MenuItem>
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

function isTemporarilyDisabled(commandId: string, isImportingJson: boolean): boolean {
  return commandId === 'document.importJson' && isImportingJson;
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
