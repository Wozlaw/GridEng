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

# Task 24.1 — Catalog API contracts and frontend adapters

## Цель

Создать единый frontend-слой API-контрактов и adapters для backend-каталогов `cross_sections` и `materials`.

## Сделать

1. Найти существующие frontend-типы/заглушки каталогов профилей и материалов.
2. Сверить их с backend summary-документами:
   - `codex/IMPLEMENTATION_CROSS_SECTIONS_STRUCTURE.md`;
   - `codex/IMPLEMENTATION_MATERIALS_STRUCTURE.md`.
3. Создать frontend domain types для:
   - элемента каталога профиля;
   - детального ответа профиля с геометрией и расчетными характеристиками;
   - элемента каталога стали;
   - resolved-свойств стали по толщине/типу проката.
4. Создать API adapters, предпочтительно в `frontend/src/shared/api/` или существующем аналогичном месте:
   - `crossSectionsApi`;
   - `materialsApi`.
5. Реализовать нормализацию ошибок adapters в существующий notification center.
6. Сохранить fallback на локальный каталог, если он уже используется текущим UI.

## Ограничения

- Не менять backend API без необходимости.
- Не менять `GridEngModel`.
- Не выводить raw JSON в основной UI.
- Не удалять локальные fixtures, если они нужны тестам.

## Критерии готовности

- Frontend имеет единый слой API-контрактов каталогов.
- Существующий UI не сломан.
- Build/lint проходят.
