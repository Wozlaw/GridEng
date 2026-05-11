# Общие правила выполнения

- Работай маленьким diff. Не пытайся выполнить соседние задачи из следующих файлов.
- Перед правками дай краткий план и перечисли файлы, которые планируешь менять.
- Проект уже выполнен до задачи 9.2 включительно. Не откатывай реализованные `loads/moments rendering` и `restraints rendering`, а адаптируй их к новой модели.
- Frontend: `frontend/`, React + TypeScript + Vite + MUI + Three/R3F + Zustand.
- Backend и БД не трогать. Нормативный расчет ветра не реализовывать. API пересчета ЛСК/ГСК не реализовывать в этой ветке.
- После каждой задачи запусти: `cd frontend && npm run build` и `cd frontend && npm run lint`.
- В конце ответа покажи: summary, измененные файлы, команды, результат build/lint, риски/техдолг.


# Task 16.1 — Реализовать консоль команд

## Цель

Добавить пользовательскую/служебную консоль, которая вызывает тот же command registry, что и ribbon/hotkeys. Не создавать вторую бизнес-логику.

## Сделать

1. Создать feature/widget консоли:
   - `features/console` или `widgets/command-console`;
   - открытие по кнопке `Консоль` в ribbon `Аналитика`;
   - optional hotkey, например `` ` `` или `Ctrl+Shift+P`, если не конфликтует.
2. UI консоли:
   - input команд;
   - history;
   - output log;
   - clear;
   - строгий black/white стиль.
3. Парсер команд:
   - разбить строку на command + args;
   - поддержать quoted args по возможности;
   - неизвестная команда → Alert warning + запись в консоль.
4. `help`:
   - `help` — список команд;
   - `help commandName` — синтаксис, параметры, примеры.
5. Подключить команды первой итерации:
   - `help`;
   - `clear`;
   - `fit` / `view.fit`;
   - `view.set`;
   - `visibility.set`;
   - `model.validate`;
   - `model.resetSample`;
   - `model.importJson` placeholder или команда, если файловый input неудобен из консоли;
   - `model.exportJson`;
   - `dxf.import` placeholder/trigger;
   - `settings.show`;
   - `settings.set`;
   - `lang ru|en`;
   - `select.node`;
   - `select.member`;
   - `select.load`.

## Ограничения

- Не делать DB-команды реально.
- Не дублировать handlers: console вызывает command registry.
- Не выводить debug в main UI, только в console/Alert.

## Проверка

- `help` работает.
- `fit` работает как кнопка Fit.
- `lang en` переключает язык.
- `select.load <loadCaseId> <loadId>` выбирает нагрузку.
- `npm run build` и `npm run lint` проходят.
