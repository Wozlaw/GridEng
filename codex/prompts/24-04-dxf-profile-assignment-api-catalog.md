# Общие правила выполнения

- Работай маленьким diff. Не выполняй соседние задачи из следующих файлов.
- Перед правками дай краткий план и перечисли файлы, которые планируешь менять.
- Проект уже выполнен до задачи 23.5 после закрытия UI revision 3.1. Не откатывай реализованные задачи 10.1–23.5; работай поверх текущего состояния.
- Сохраняй текущую онтологию проекта: профиль хранит геометрию/сечение, материал остается свойством элемента.
- Backend API `cross_sections` и `materials` считаются источником истины для нормативных каталогов. Локальный frontend-каталог допустим только как fallback/fixture.
- Не изменяй `backend/app/lib` и расчетное ядро.
- Не вводи SQL-БД.
- Все пользовательские ошибки и служебные сообщения показывай через существующий notification center на MUI Alert/Snackbar.
- Если меняется frontend-код, запусти: `cd frontend && npm run build` и `cd frontend && npm run lint`.
- Если меняется backend-код, запусти релевантные pytest и по возможности `cd backend && python -m pytest -v`.
- В конце ответа покажи: summary, измененные файлы, команды, результат build/lint/pytest, риски/техдолг.

Источники требований:

- `codex/UNIFIED_GRIDENG_SPECIFICATION.md`;
- `codex/docs/catalogs-api-integration-spec.md`;
- `codex/IMPLEMENTATION_CROSS_SECTIONS_STRUCTURE.md`;
- `codex/IMPLEMENTATION_MATERIALS_STRUCTURE.md`.

# Task 24.4 — DXF profile assignment via API catalog

## Цель

Подключить вкладку `Профили` в DXF import dialog к API-каталогу профилей без изменения модели до нажатия `Импорт`.

## Сделать

1. Использовать общий `crossSectionsApi`/catalog source из задач 24.1–24.2.
2. Сохранить структуру таблицы вкладки `Профили`:
   - `Цвет`;
   - `Тип профиля`;
   - `Стандарт`;
   - `Профиль`.
3. `Тип профиля` и `Стандарт` использовать только как фильтры списка профилей.
4. При выборе профиля сохранять только preview assignment mapping, не писать в `modelStore`.
5. Импорт блокировать, пока не назначены профили всем обязательным DXF color/color groups.
6. В режиме preview `Профили` использовать цвет назначенного профильного catalog item или fallback исходного DXF color.
7. Служебные сведения, counts, raw source color и diagnostics держать во вкладке `Логи`.

## Ограничения

- Не менять backend.
- Не расширять DXF import beyond `LINE`.
- Не вводить произвольный профиль строкой.

## Критерии готовности

- DXF profile assignment использует общий API-каталог.
- Preview остается изолированным от основной модели.
- Build/lint проходят.
