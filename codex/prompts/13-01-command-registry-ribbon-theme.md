# Общие правила выполнения

- Работай маленьким diff. Не пытайся выполнить соседние задачи из следующих файлов.
- Перед правками дай краткий план и перечисли файлы, которые планируешь менять.
- Проект уже выполнен до задачи 9.2 включительно. Не откатывай реализованные `loads/moments rendering` и `restraints rendering`, а адаптируй их к новой модели.
- Frontend: `frontend/`, React + TypeScript + Vite + MUI + Three/R3F + Zustand.
- Backend и БД не трогать. Нормативный расчет ветра не реализовывать. API пересчета ЛСК/ГСК не реализовывать в этой ветке.
- После каждой задачи запусти: `cd frontend && npm run build` и `cd frontend && npm run lint`.
- В конце ответа покажи: summary, измененные файлы, команды, результат build/lint, риски/техдолг.


# Task 13.1 — Command registry + ribbon TopMenu + строгая тема

## Цель

Перестроить верхнее меню по принципу CAD ribbon и заложить единый реестр команд для меню, hotkeys и консоли.

## Сделать

1. Создать `frontend/src/shared/commands/` или `frontend/src/features/commands/`:
   - `types.ts`;
   - `registry.ts`;
   - `runCommand.ts`.
2. Каждая команда должна иметь:
   - `id`;
   - `labelKey`;
   - `tooltipKey`;
   - icon;
   - handler;
   - optional hotkey;
   - optional console metadata;
   - placeholder flag.
3. Перестроить `TopMenu` в ribbon-блоки:
   - `Компонент`: импорт/экспорт/открыть/сохранить;
   - `Режим просмотра`: Fit, режимы камеры/визуализации;
   - `Видимость`: оси, сетка, нагрузки, закрепления;
   - `Каталог`: конструкции placeholder, профили, материалы;
   - `Аналитика`: консоль, ветер, сводки;
   - `Отчет`: спецификация, отчет по расчету placeholder;
   - `О программе`: справка/лицензия/about placeholder.
4. Кнопки:
   - не делать кликабельную зону меньше 32 px;
   - использовать 64 px для крупных команд и 32 px для компактных;
   - не использовать 16 px hitbox;
   - если иконка не найдена, использовать `NewReleasesIcon` с warning accent и TODO.
5. Под каждым блоком dropdown/list: иконка + команда. Не дублировать команду в tile и dropdown без причины.
6. Тема MUI:
   - black & white minimalism;
   - `shape.borderRadius = 0` для строгих элементов;
   - смысловые accent tokens: success/warning/error/info/selected/profile/restraint/loadForce/loadMoment.
7. Все tooltips и aria-label обязательны.

## Ограничения

- Эта задача не должна реализовывать консоль UI полностью; только command registry и кнопка открытия/placeholder.
- Placeholder-команды используют notification center.

## Проверка

- Ribbon отображается на русском.
- Все кнопки имеют tooltip.
- Placeholder показывает MUI Alert снизу по центру.
- `npm run build` и `npm run lint` проходят.
