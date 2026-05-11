# GridEng — пошаговый план реализации для Codex

## Общие правила

- Работать маленькими изменениями.
- Не изменять `backend/app/lib` без отдельного указания.
- Не реализовывать БД.
- Не делать широкий DXF-импорт.
- Сначала фиксировать внутреннюю модель данных, затем UI, затем 3D, затем DXF.
- Все изменения во frontend должны проходить `npm run build`.
- Для frontend-задач, которые меняют код, дополнительно запускать `npm run lint`.
- Любой импорт должен приводить данные к актуальной версии `GridEngModel`.
- После задачи 10.2 актуальная версия модели становится `GridEngModel v0.2`.
- Команды меню, hotkeys и консоль должны использовать единый command registry, без дублирования бизнес-логики.
- Все ошибки, предупреждения, служебные сообщения и заглушки будущего функционала показывать через единый MUI Alert/Snackbar снизу по центру.

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
| 2.1 | `prompts/02-01-model-types.md` | Типы GridEngModel v0.1 |
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
| 10.1 | `prompts/10-01-model-load-types-comments.md` | GridEngModel v0.2: типы нагрузок, distributed loads, комментарии |
| 10.2 | `prompts/10-02-schema-validation-migration-sample.md` | Zod/schema/validation/sample: миграция v0.1 → v0.2 |
| 11.1 | `prompts/11-01-store-selection-actions.md` | Store/selection: отдельный выбор load и restraint |
| 11.2 | `prompts/11-02-edit-actions-loads-restraints-members-nodes.md` | Store actions: редактирование узлов, элементов, закреплений, нагрузок |
| 12.1 | `prompts/12-01-i18n-console-language-setting.md` | Локализация ru/en и переключение языка через консоль |
| 12.2 | `prompts/12-02-notification-center-mui-alerts.md` | Единый MUI Alert/Snackbar снизу по центру |
| 13.1 | `prompts/13-01-command-registry-ribbon-theme.md` | Command registry, ribbon TopMenu, black & white theme |
| 13.2 | `prompts/13-02-resizable-panels-statusbar-visibility-fit.md` | Resizable/collapsible panels, status bar, visibility, Fit |
| 14.1 | `prompts/14-01-project-tree-loads-members-nodes.md` | Дерево проекта: нагрузки, элементы, ноды |
| 14.2 | `prompts/14-02-properties-editors-dialogs.md` | Properties: редакторы node/member/restraint/load + диалоги |
| 15.1 | `prompts/15-01-scene-picking-static-camera.md` | Сцена: picking слой, статичная камера при выборе |
| 15.2 | `prompts/15-02-loads-restraints-visual-language.md` | Визуализация нагрузок и закреплений: ГСК, distributed, 6 DOF |
| 16.1 | `prompts/16-01-console-core-and-help.md` | Консоль: ядро, help, выполнение command registry |
| 16.2 | `prompts/16-02-console-debug-settings-service-commands.md` | Консоль: debug/settings/source info/service commands |
| 17.1 | `prompts/17-01-catalogs-wind-placeholders.md` | Диалоги каталогов, ручной ветер, placeholders отчетов/конструкций |
| 17.2 | `prompts/17-02-final-docs-tests-checklist.md` | Документация и финальная проверка UI/loads/console итерации |
| 18.1 | `prompts/18-01-local-frame-math.md` | Локальный базис стержня |
| 18.2 | `prompts/18-02-section-outlines.md` | Контуры сечений |
| 18.3 | `prompts/18-03-real-view-rendering.md` | Real view rendering |
| 19.1 | `prompts/19-01-analysis-result-types.md` | Типы результатов расчета |
| 19.2 | `prompts/19-02-stress-map-mode.md` | Stress-map mode |
| 20.1 | `prompts/20-01-model-docs.md` | Документация GridEngModel v0.2 |
| 20.2 | `prompts/20-02-dxf-docs.md` | Документация DXF импорта |

## Примечание по перенумерации

Новые задачи интерфейсной итерации встроены после выполненной задачи 9.2 и занимают диапазон 10.1–17.2.
Исходные невыполненные задачи 10.1–12.2 перенесены в конец плана и перенумерованы:

- старая 10.1 → новая 18.1;
- старая 10.2 → новая 18.2;
- старая 10.3 → новая 18.3;
- старая 11.1 → новая 19.1;
- старая 11.2 → новая 19.2;
- старая 12.1 → новая 20.1;
- старая 12.2 → новая 20.2.

## Главное правило

Не давать Codex задачу «сделай весь frontend».
Давать атомарные задачи с ограниченным diff. В конце каждой задачи Codex должен показать:

1. Summary изменений.
2. Список измененных файлов.
3. Какие команды запускались.
4. Результат build/lint.
5. Риски и технический долг.
