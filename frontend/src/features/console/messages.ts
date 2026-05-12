import type { AppLanguage, TranslationParams } from '../../shared/i18n';

type ConsoleMessageKey =
  | 'title'
  | 'subtitle'
  | 'inputLabel'
  | 'inputPlaceholder'
  | 'outputTitle'
  | 'historyTitle'
  | 'clear'
  | 'close'
  | 'run'
  | 'emptyLog'
  | 'emptyHistory'
  | 'reuseCommand';

const messages: Record<AppLanguage, Record<ConsoleMessageKey, string>> = {
  ru: {
    title: 'Командная консоль',
    subtitle: 'Служебные команды, help и настройки проекта.',
    inputLabel: 'Команда',
    inputPlaceholder: 'Например: help, fit, settings.show, select.member M-1',
    outputTitle: 'Вывод',
    historyTitle: 'История',
    clear: 'Очистить',
    close: 'Закрыть',
    run: 'Выполнить',
    emptyLog: 'Журнал пуст. Введите команду или нажмите `help`.',
    emptyHistory: 'История команд пока пуста.',
    reuseCommand: 'Подставить команду',
  },
  en: {
    title: 'Command Console',
    subtitle: 'Service commands, help, and project settings.',
    inputLabel: 'Command',
    inputPlaceholder: 'For example: help, fit, settings.show, select.member M-1',
    outputTitle: 'Output',
    historyTitle: 'History',
    clear: 'Clear',
    close: 'Close',
    run: 'Run',
    emptyLog: 'The log is empty. Enter a command or run `help`.',
    emptyHistory: 'No command history yet.',
    reuseCommand: 'Reuse command',
  },
};

export function getConsoleMessage(
  language: AppLanguage,
  key: ConsoleMessageKey,
  params?: TranslationParams,
): string {
  const template = messages[language][key];

  if (params == null) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_match, paramKey: string) => {
    const value = params[paramKey];
    return value == null ? '' : String(value);
  });
}
