# UI-команды, консоль, Alert и локализация

## Единый command registry

Команды меню, hotkeys и консоль должны использовать один источник truth.

Рекомендуемая структура:

```ts
export interface UiCommandContext {
  getState: () => ModelStoreState;
  setState: (patch: Partial<ModelStoreState>) => void;
  notify: (message: AppNotificationInput) => void;
}

export interface UiCommand {
  id: string;
  labelKey: string;
  descriptionKey: string;
  icon: ReactNode;
  tooltipKey: string;
  run: (ctx: UiCommandContext, args?: string[]) => void | Promise<void>;
  hotkey?: string;
  console?: {
    name: string;
    usage: string;
    examples: string[];
  };
  disabled?: boolean | ((ctx: UiCommandContext) => boolean);
  placeholder?: boolean;
}
```

## Alert/notification center

Все ошибки, предупреждения и служебные сообщения выводить через MUI `Snackbar` + `Alert`, снизу по центру:

```tsx
<Snackbar
  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
  autoHideDuration={severity === 'error' ? null : 4000}
>
  <Alert severity={severity} variant="filled" onClose={...}>{message}</Alert>
</Snackbar>
```

Типы сообщений:

- `success` — успешный экспорт/импорт/сохранение JSON;
- `info` — служебная информация, placeholder, справка;
- `warning` — неполные данные, валидационные предупреждения;
- `error` — ошибки ввода, импорта, валидации, невозможность операции.

Нативный `window.alert` не использовать.

## Локализация

- Все пользовательские строки через `shared/i18n`.
- Минимальные языки: `ru`, `en`.
- Переключение только через консоль: `settings.set language ru`, `settings.set language en` или `lang ru`, `lang en`.
- Значение языка хранить в UI-настройках и `localStorage`.
- Меню не засорять переключателем языка.

## Placeholder будущего функционала

Для команд, которые еще не реализованы, использовать общий handler:

```ts
notify({ severity: 'info', message: t('common.notImplemented') })
```

Placeholder-команды:

- каталог конструкций / атлас типовых опор;
- отчет по расчету;
- лицензия, справка, о программе — если еще нет содержимого;
- DB namespace в консоли.
