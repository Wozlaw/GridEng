# GridEng — пошаговый план реализации для Codex

## Общие правила

- Работать маленькими изменениями.
- Не изменять `backend/app/lib` без отдельного указания.
- Не реализовывать БД.
- Не делать широкий DXF-импорт.
- Сначала фиксировать внутреннюю модель данных, затем UI, затем 3D, затем DXF.
- Все изменения во frontend должны проходить `npm run build`.
- Для frontend-задач, которые меняют код, дополнительно запускать `npm run lint`.
- Любой импорт должен приводить данные к `GridEngModel v0.1`.

## Архитектурная структура frontend

```text
frontend/src/
  app/
    layout/
    providers/
    store/
  entities/
    model/
    section/
  features/
    import-dxf/
    import-json/
    export-json/
    selection/
    view-modes/
  widgets/
    viewport-3d/
    project-tree/
    properties-panel/
  shared/
    math/
    ui/
    utils/
```

## Порядок задач

| № | Файл промпта | Смысл |
|---|---|---|
| 0.1 | `prompts/00-01-update-agents.md` | Обновить правила проекта для Codex |
| 1.1 | `prompts/01-01-install-frontend-dependencies.md` | Установить frontend зависимости |
| 1.2 | `prompts/01-02-create-frontend-folders.md` | Создать структуру каталогов |
| 2.1 | `prompts/02-01-model-types.md` | Типы `GridEngModel v0.1` |
| 2.2 | `prompts/02-02-zod-schemas.md` | Zod-схемы модели |
| 2.3 | `prompts/02-03-integrity-validator.md` | Валидатор целостности |
| 2.4 | `prompts/02-04-sample-model.md` | Тестовая модель секции опоры |
| 3.1 | `prompts/03-01-zustand-store.md` | Zustand store |
| 4.1 | `prompts/04-01-mui-provider.md` | MUI ThemeProvider |
| 4.2 | `prompts/04-02-cad-shell-layout.md` | CAD-like layout |
| 4.3 | `prompts/04-03-properties-panel.md` | Панель свойств |
| 5.1 | `prompts/05-01-json-import.md` | JSON import |
| 5.2 | `prompts/05-02-json-export.md` | JSON export |
| 6.1 | `prompts/06-01-viewport-scaffold.md` | Three/R3F viewport scaffold |
| 6.2 | `prompts/06-02-nodes-members-rendering.md` | Отрисовка узлов/стержней |
| 6.3 | `prompts/06-03-fit-to-model.md` | Fit-to-model |
| 7.1 | `prompts/07-01-dxf-import-types.md` | Типы DXF import |
| 7.2 | `prompts/07-02-parse-dxf-lines.md` | Парсинг только LINE |
| 7.3 | `prompts/07-03-merge-dxf-nodes.md` | Tolerance merge узлов |
| 7.4 | `prompts/07-04-normalize-dxf-coordinates.md` | Нормализация координат |
| 7.5 | `prompts/07-05-dxf-to-grideng-model.md` | DXF → GridEngModel |
| 7.6 | `prompts/07-06-dxf-import-ui.md` | UI импорта DXF |
| 8.1 | `prompts/08-01-section-api-contract-types.md` | Типы контракта API сечений |
| 8.2 | `prompts/08-02-local-profile-catalog.md` | Локальный каталог профилей |
| 8.3 | `prompts/08-03-dxf-profile-assignment.md` | Назначение профилей DXF-группам |
| 9.1 | `prompts/09-01-loads-moments-rendering.md` | Визуализация сил/моментов |
| 9.2 | `prompts/09-02-restraints-rendering.md` | Визуализация закреплений |
| 10.1 | `prompts/10-01-local-frame-math.md` | Локальный базис стержня |
| 10.2 | `prompts/10-02-section-outlines.md` | Контуры сечений |
| 10.3 | `prompts/10-03-real-view-rendering.md` | Real view rendering |
| 11.1 | `prompts/11-01-analysis-result-types.md` | Типы результатов расчета |
| 11.2 | `prompts/11-02-stress-map-mode.md` | Stress-map mode |
| 12.1 | `prompts/12-01-model-docs.md` | Документация модели |
| 12.2 | `prompts/12-02-dxf-docs.md` | Документация DXF импорта |

## Главное правило

Не давать Codex задачу «сделай весь frontend». Давать атомарные задачи с ограниченным diff.

В конце каждой задачи Codex должен показать:

1. Summary изменений.
2. Список измененных файлов.
3. Какие команды запускались.
4. Результат build/lint.
5. Риски и технический долг.
