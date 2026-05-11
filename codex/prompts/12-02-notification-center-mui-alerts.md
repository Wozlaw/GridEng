# Общие правила выполнения

- Работай маленьким diff. Не пытайся выполнить соседние задачи из следующих файлов.
- Перед правками дай краткий план и перечисли файлы, которые планируешь менять.
- Проект уже выполнен до задачи 9.2 включительно. Не откатывай реализованные `loads/moments rendering` и `restraints rendering`, а адаптируй их к новой модели.
- Frontend: `frontend/`, React + TypeScript + Vite + MUI + Three/R3F + Zustand.
- Backend и БД не трогать. Нормативный расчет ветра не реализовывать. API пересчета ЛСК/ГСК не реализовывать в этой ветке.
- После каждой задачи запусти: `cd frontend && npm run build` и `cd frontend && npm run lint`.
- В конце ответа покажи: summary, измененные файлы, команды, результат build/lint, риски/техдолг.


# Task 12.2 — Реализовать notification center на MUI Alert

## Цель

Все ошибки, предупреждения и служебные сообщения должны выводиться одинаково: MUI Snackbar + Alert снизу по центру. Нативный `window.alert` не использовать.

## Сделать

1. Создать `frontend/src/shared/ui/notifications/` или аналог:
   - тип `AppNotification`;
   - provider/store или Zustand slice;
   - компонент `AppNotifications`.
2. Настроить позиционирование:
   - `anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}`;
   - `Alert severity="success|info|warning|error"`;
   - `variant="filled"` или единый строгий стиль под black & white тему.
3. Автоскрытие:
   - `success/info` — 3000–4000 ms;
   - `warning` — 5000–7000 ms;
   - `error` — не скрывать автоматически или скрывать дольше, но с кнопкой закрытия.
4. Подключить `AppNotifications` в верхний layout/provider.
5. Заменить текущие служебные сообщения при JSON import/export/save на notification:
   - успешный экспорт JSON;
   - ошибка импорта JSON;
   - ошибка validation;
   - placeholder future functionality.
6. Создать helper `notifyNotImplemented(featureName)`.

## Ограничения

- Не использовать `window.alert`.
- Не смешивать notification UI с бизнес-логикой импорта/экспорта.

## Проверка

- При экспорте JSON появляется служебное сообщение снизу по центру.
- Ошибка импорта JSON показывается через Alert.
- Placeholder-команда показывает info Alert.
- `npm run build` и `npm run lint` проходят.
