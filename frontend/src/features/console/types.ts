import type { NotificationSeverity } from '../../shared/ui/notifications/types';

export type CommandConsoleEntryLevel = 'command' | NotificationSeverity;

export interface CommandConsoleEntry {
  id: string;
  level: CommandConsoleEntryLevel;
  title?: string;
  lines: string[];
  timestamp: number;
}
