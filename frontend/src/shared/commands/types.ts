import type { SvgIconComponent } from '@mui/icons-material';

import type { AppLanguage, I18nKey } from '../i18n';
import type { NotificationSeverity } from '../ui/notifications/types';

export type RibbonCommandGroupId =
  | 'document'
  | 'view'
  | 'visibility'
  | 'catalog'
  | 'analytics'
  | 'report'
  | 'about';

export type AppCommandSource = 'ribbon' | 'hotkey' | 'console';

export interface AppCommandConsoleMetadata {
  syntax: string;
  aliases?: string[];
}

export interface AppCommandContext {
  source?: AppCommandSource;
  openJsonPicker?: () => void;
  openDxfDialog?: () => void;
  exportJson?: () => void;
  openConsole?: () => void;
}

export interface AppCommandDefinition {
  id: string;
  labelKey: I18nKey;
  tooltipKey: I18nKey;
  icon: SvgIconComponent;
  handler: (context: AppCommandContext) => void;
  hotkey?: string;
  console?: AppCommandConsoleMetadata;
  placeholder?: boolean;
  isActive?: () => boolean;
  isDisabled?: () => boolean;
}

export interface AppConsoleCommandContext extends AppCommandContext {
  language: AppLanguage;
}

export interface AppConsoleCommandResult {
  severity: NotificationSeverity;
  title?: string;
  lines: string[];
  notify?: boolean;
  clearLog?: boolean;
}

export interface AppConsoleCommandDefinition {
  id: string;
  names: string[];
  syntax: string;
  parameters?: string[];
  examples?: string[];
  execute: (
    args: string[],
    context: AppConsoleCommandContext,
  ) => AppConsoleCommandResult;
}

export interface RibbonCommandGroupDefinition {
  id: RibbonCommandGroupId;
  titleKey: I18nKey;
  primaryCommandIds: string[];
  secondaryCommandIds: string[];
}
