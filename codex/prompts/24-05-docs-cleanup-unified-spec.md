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

# Task 24.5 — Documentation cleanup and unified specification

## Цель

Очистить комплект Codex от дублей/устаревших reference-файлов и закрепить `codex/UNIFIED_GRIDENG_SPECIFICATION.md` как главный source of truth для следующих задач.

## Сделать

1. Проверить ссылки в:
   - `codex/README.md`;
   - `codex/IMPLEMENTATION_PLAN.md`;
   - `codex/TASK_SEQUENCE.md`;
   - prompts 23.x–24.x.
2. Убедиться, что новые задачи ссылаются на:
   - `codex/UNIFIED_GRIDENG_SPECIFICATION.md`;
   - `codex/docs/catalogs-api-integration-spec.md`;
   - backend implementation summaries.
3. Найти дубли reference-файлов с поврежденной кодировкой имени.
4. Не удаляя информацию без проверки, нормализовать один актуальный файл как `codex/reference/UI_REVISION_1_CHECKED_REQUIREMENTS.md` или оставить TODO-инструкцию, если прямое удаление рискованно.
5. Обновить `codex/README.md` кратким порядком работы с комплектом.
6. Обновить `codex/docs/documentation-cleanup-notes.md`, если фактическая структура отличается.

## Ограничения

- Не менять код приложения.
- Не переписывать историю требований содержательно.
- Не менять статусы выполненных задач без факта выполнения.

## Критерии готовности

- В комплекте понятно, какой документ является главным source of truth.
- Дубли reference-файлов описаны или нормализованы.
- План и README не противоречат друг другу.
