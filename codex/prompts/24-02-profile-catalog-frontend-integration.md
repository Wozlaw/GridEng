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

# Task 24.2 — Profile catalog frontend integration

## Цель

Подключить frontend-диалоги/селекторы профилей к `cross_sections` API через adapters из 24.1.

## Сделать

1. Найти текущий локальный каталог профилей и места его использования:
   - диалог профилей;
   - properties/editor `Member`;
   - DXF profile assignment, если уже использует общий catalog source.
2. Перевести получение списка профилей на `crossSectionsApi`.
3. Сохранить локальный fallback только при недоступности backend или в тестовом режиме.
4. В UI профиля показывать:
   - тип профиля;
   - стандарт/ГОСТ;
   - designation/display name;
   - при необходимости series.
5. Детальные расчетные характеристики получать через endpoint/details, а не хранить как продуктивные поля JSON-каталога.
6. Не менять id уже назначенных профилей в существующей модели.

## Ограничения

- Не менять структуру backend JSON.
- Не добавлять расчетные характеристики в frontend fixture как source of truth.
- Не менять материал элемента в этой задаче.

## Критерии готовности

- Диалог/селектор профилей использует API adapter.
- Локальный fallback не конфликтует с API.
- Build/lint проходят.
