import { APP_COMMANDS, APP_COMMANDS_BY_ID, CONSOLE_COMMANDS } from './registry';
import type {
  AppCommandContext,
  AppConsoleCommandContext,
  AppConsoleCommandDefinition,
  AppConsoleCommandResult,
} from './types';

export function runAppCommand(commandId: string, context: AppCommandContext = {}): boolean {
  const command = APP_COMMANDS_BY_ID.get(commandId);

  if (command == null || command.isDisabled?.()) {
    return false;
  }

  command.handler(context);
  return true;
}

export function executeConsoleInput(
  input: string,
  context: AppConsoleCommandContext,
): AppConsoleCommandResult {
  const parsed = tokenizeConsoleInput(input);

  if (!parsed.ok) {
    return {
      severity: 'error',
      title: localize(context.language, 'Не удалось разобрать команду.', 'Unable to parse command.'),
      lines: [parsed.error],
      notify: true,
    };
  }

  if (parsed.tokens.length === 0) {
    return {
      severity: 'info',
      lines: [],
    };
  }

  const [commandName, ...args] = parsed.tokens;
  const command = findConsoleCommand(commandName);

  if (command == null) {
    return {
      severity: 'warning',
      title: localize(context.language, 'Неизвестная команда.', 'Unknown command.'),
      lines: [
        localize(
          context.language,
          `Команда \`${commandName}\` не зарегистрирована. Используйте \`help\`.`,
          `Command \`${commandName}\` is not registered. Use \`help\`.`,
        ),
      ],
      notify: true,
    };
  }

  return command.execute(args, context);
}

export function getCommandById(commandId: string) {
  return APP_COMMANDS_BY_ID.get(commandId);
}

export function getConsoleCommands(): AppConsoleCommandDefinition[] {
  return [...CONSOLE_COMMANDS];
}

export function findConsoleCommand(commandName: string): AppConsoleCommandDefinition | undefined {
  const normalizedCommandName = commandName.trim().toLowerCase();

  return CONSOLE_COMMANDS.find((command) =>
    command.names.some((name) => name.trim().toLowerCase() === normalizedCommandName)
  );
}

export function findHotkeyCommand(event: KeyboardEvent) {
  const hotkey = formatKeyboardEventHotkey(event);

  if (hotkey == null) {
    return undefined;
  }

  return APP_COMMANDS.find((command) => command.hotkey === hotkey);
}

export function shouldIgnoreHotkeys(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return target.isContentEditable
    || tagName === 'input'
    || tagName === 'textarea'
    || tagName === 'select';
}

function formatKeyboardEventHotkey(event: KeyboardEvent): string | null {
  const key = formatHotkeyKey(event.key);

  if (key == null) {
    return null;
  }

  const parts: string[] = [];

  if (event.ctrlKey) {
    parts.push('Ctrl');
  }
  if (event.shiftKey) {
    parts.push('Shift');
  }
  if (event.altKey) {
    parts.push('Alt');
  }
  if (event.metaKey) {
    parts.push('Meta');
  }

  parts.push(key);
  return parts.join('+');
}

function formatHotkeyKey(key: string): string | null {
  if (key.length === 0) {
    return null;
  }

  switch (key) {
    case ' ':
      return 'Space';
    default:
      return key.length === 1 ? key.toUpperCase() : key;
  }
}

function tokenizeConsoleInput(
  input: string,
): { ok: true; tokens: string[] } | { ok: false; error: string } {
  const tokens: string[] = [];
  let currentToken = '';
  let currentQuote: '"' | '\'' | null = null;
  let isEscaping = false;
  let hasTokenContent = false;

  for (const character of input.trim()) {
    if (isEscaping) {
      currentToken += character;
      hasTokenContent = true;
      isEscaping = false;
      continue;
    }

    if (character === '\\') {
      isEscaping = true;
      hasTokenContent = true;
      continue;
    }

    if (currentQuote != null) {
      if (character === currentQuote) {
        currentQuote = null;
        continue;
      }

      currentToken += character;
      hasTokenContent = true;
      continue;
    }

    if (character === '"' || character === '\'') {
      currentQuote = character;
      hasTokenContent = true;
      continue;
    }

    if (/\s/.test(character)) {
      if (hasTokenContent) {
        tokens.push(currentToken);
        currentToken = '';
        hasTokenContent = false;
      }

      continue;
    }

    currentToken += character;
    hasTokenContent = true;
  }

  if (isEscaping) {
    currentToken += '\\';
  }

  if (currentQuote != null) {
    return {
      ok: false,
      error: 'Unclosed quoted argument.',
    };
  }

  if (hasTokenContent) {
    tokens.push(currentToken);
  }

  return {
    ok: true,
    tokens,
  };
}

function localize(language: AppConsoleCommandContext['language'], ru: string, en: string): string {
  return language === 'ru' ? ru : en;
}
