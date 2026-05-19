# Последовательность выполнения задач после 9.2 — интегрировано в IMPLEMENTATION_PLAN

Выполнять строго по блокам. После каждого блока — build/lint, ручная проверка и commit.

## Блок 10 — модель данных нагрузок v0.2

- `codex/prompts/10-01-model-load-types-comments.md` — Модель v0.2: типы нагрузок, комментарии, расширяемость
- `codex/prompts/10-02-schema-validation-migration-sample.md` — Zod/schema/validation/sample: миграция v0.1 → v0.2

## Блок 11 — store, selection, редактирование

- `codex/prompts/11-01-store-selection-actions.md` — Store/selection: отдельный выбор load и restraint
- `codex/prompts/11-02-edit-actions-loads-restraints-members-nodes.md` — Store actions: редактирование узлов, элементов, закреплений, нагрузок

## Блок 12 — локализация и Alert

- `codex/prompts/12-01-i18n-console-language-setting.md` — Локализация ru/en и переключение языка через консоль
- `codex/prompts/12-02-notification-center-mui-alerts.md` — Единый MUI Alert/Snackbar снизу по центру

## Блок 13 — ribbon/layout/status/visibility

- `codex/prompts/13-01-command-registry-ribbon-theme.md` — Command registry, ribbon menu, black & white theme
- `codex/prompts/13-02-resizable-panels-statusbar-visibility-fit.md` — Resizable/collapsible panels, status bar, видимость, Fit

## Блок 14 — дерево и properties

- `codex/prompts/14-01-project-tree-loads-members-nodes.md` — Дерево проекта: нагрузки, элементы, ноды
- `codex/prompts/14-02-properties-editors-dialogs.md` — Properties: редакторы node/member/restraint/load + диалоги

## Блок 15 — сцена и визуализация

- `codex/prompts/15-01-scene-picking-static-camera.md` — Сцена: picking слой, статичная камера при выборе
- `codex/prompts/15-02-loads-restraints-visual-language.md` — Визуализация нагрузок и закреплений: ГСК, distributed, 6 DOF

## Блок 16 — консоль

- `codex/prompts/16-01-console-core-and-help.md` — Консоль: ядро, help, выполнение command registry
- `codex/prompts/16-02-console-debug-settings-service-commands.md` — Консоль: debug/settings/source info/service commands

## Блок 17 — каталоги, ветер, финализация UI-итерации

- `codex/prompts/17-01-catalogs-wind-placeholders.md` — Диалоги каталогов, ручной ветер, placeholders отчетов/конструкций
- `codex/prompts/17-02-final-docs-tests-checklist.md` — Документация, финальная проверка, контроль регрессий

## Блок 18 — перенесенные старые задачи 10.x

- `codex/prompts/18-01-local-frame-math.md` — бывшая 10.1: локальный базис стержня
- `codex/prompts/18-02-section-outlines.md` — бывшая 10.2: контуры сечений
- `codex/prompts/18-03-real-view-rendering.md` — бывшая 10.3: Real view rendering

## Блок 19 — перенесенные старые задачи 11.x

- `codex/prompts/19-01-analysis-result-types.md` — бывшая 11.1: типы результатов расчета
- `codex/prompts/19-02-stress-map-mode.md` — бывшая 11.2: Stress-map mode

## Блок 20 — перенесенные старые задачи 12.x

- `codex/prompts/20-01-model-docs.md` — бывшая 12.1: документация модели, обновлена под v0.2
- `codex/prompts/20-02-dxf-docs.md` — бывшая 12.2: документация DXF импорта

## Контроль между блоками

После каждого блока проверить:

```bash
cd frontend && npm run build
cd frontend && npm run lint
```

Минимальная ручная проверка после блоков 10–17: открыть приложение, выбрать ноду/элемент/нагрузку, проверить что камера не меняется при выборе, экспортировать JSON.


## Блок 21 — интерфейсная ревизия 2 поверх выполненных задач

- `codex/prompts/21-01-layout-overflow-panels-menu-height.md` — Layout: overflow, ширина приложения и фиксированная высота TopMenu
- `codex/prompts/21-02-ribbon-topmenu-reorganization.md` — TopMenu/Ribbon: реорганизация групп и команд
- `codex/prompts/21-03-active-loadcase-state-project-tree.md` — Active load case: единое активное загружение и дерево проекта
- `codex/prompts/21-04-scene-overlays-wind-stress-legend-label-visibility.md` — Scene overlays: ветер, легенда карты напряжений и visibility.labels
- `codex/prompts/21-05-scene-labels-and-restraint-symbols.md` — Scene labels: подписи сил/моментов и новая визуальная грамматика закреплений
- `codex/prompts/21-06-project-tree-properties-panel-polish.md` — ProjectTree и PropertiesPanel: типографика, scroll и очистка шапки
- `codex/prompts/21-07-docked-console-and-fullscreen-modal.md` — Консоль: нижняя docked-панель и fullscreen modal
- `codex/prompts/21-08-placeholders-final-checklist-docs.md` — Заглушки, финальная интеграционная проверка и документация UI revision 2


## Блок 22 — интерфейсная ревизия 3 поверх выполненных задач

- `codex/prompts/22-01-theme-console-commands.md` — Консольные команды темы: `theme light`, `theme dark`, `theme toggle`, `theme status`
- `codex/prompts/22-02-dxf-settings-console-and-log-dialog.md` — DXF settings через консоль и отдельное окно логов импорта
- `codex/prompts/22-03-dxf-preview-diagnostics-model.md` — Структурированные diagnostics DXF preview для поэлементной подсветки
- `codex/prompts/22-04-dxf-3d-preview-color-modes.md` — 3D preview DXF и режимы окраски `Диагностика` / `Профили`
- `codex/prompts/22-05-dxf-profile-assignment-by-color.md` — Назначение профилей по DXF color/color group с фильтром по типу профиля
- `codex/prompts/22-06-wind-dialog-polish-and-final-docs.md` — Диалог `Ветер`, давление в Па, `Z=0` в UI и документация ревизии 3

После каждой задачи блока 22 проверить:

```bash
cd frontend && npm run build
cd frontend && npm run lint
```

Минимальная ручная проверка блока 22: консольные команды темы и DXF-настроек, DXF preview без изменения основной модели до импорта, режимы `Диагностика`/`Профили`, назначение профиля по цвету, окно логов, диалог `Ветер` с давлением в Па и `Z=0`.

## Блок 23 — интерфейсная ревизия 3.1 поверх выполненной ревизии 3

- `codex/prompts/23-01-dxf-dialog-tabs-layout.md` — DXF import dialog: шапка, tabs `Модель | Профили | Логи`, нижний button block
- `codex/prompts/23-02-dxf-preview-normalization-and-rotation.md` — DXF preview normalization: `Z >= 0`, ось `Z` по центру, поворот вокруг осей и reset
- `codex/prompts/23-03-dxf-profiles-tab-color-profile-table.md` — Вкладка `Профили`: таблица `Цвет | Тип профиля | Стандарт | Профиль`, swatch + палитра
- `codex/prompts/23-04-dxf-logs-tab-compact-grouped-messages.md` — Вкладка `Логи`: компактные агрегированные сообщения без JSON
- `codex/prompts/23-05-wind-dialog-final-cleanup-and-docs.md` — Диалог `Ветер`: убрать подпись `Загружение` и info-поле, документация/checklist ревизии 3.1

После каждой задачи блока 23 проверить:

```bash
cd frontend && npm run build
cd frontend && npm run lint
```

Минимальная ручная проверка блока 23: tabs `Модель | Профили | Логи`, нормализация preview по `Z`, повороты preview, таблица профилей без счетчиков, цветовой swatch с палитрой, компактные логи без JSON, очищенный диалог `Ветер`.

## Блок 24 — интеграция frontend с backend-каталогами профилей и материалов

| № | Файл промпта | Смысл |
|---|---|---|
| 24.1 | `prompts/24-01-catalog-api-contracts-and-adapters.md` | API contracts/adapters для `cross_sections` и `materials` |
| 24.2 | `prompts/24-02-profile-catalog-frontend-integration.md` | Frontend-каталог профилей через backend API |
| 24.3 | `prompts/24-03-material-selector-by-profile-thickness.md` | Фильтрация материалов по профилю/толщине/типу проката |
| 24.4 | `prompts/24-04-dxf-profile-assignment-api-catalog.md` | DXF profile assignment через API-каталог |
| 24.5 | `prompts/24-05-docs-cleanup-unified-spec.md` | Очистка документации и фиксация единой спецификации |

Опорные документы блока 24 и следующих итераций:

- `codex/UNIFIED_GRIDENG_SPECIFICATION.md`
- `codex/docs/catalogs-api-integration-spec.md`
- `codex/IMPLEMENTATION_CROSS_SECTIONS_STRUCTURE.md`
- `codex/IMPLEMENTATION_MATERIALS_STRUCTURE.md`

Блок 24 завершен. Актуальные статусы задач смотри в `codex/IMPLEMENTATION_PLAN.md`.

## Блок 25 — интерфейсная ревизия 4 поверх выполненных блоков 21–24

| № | Файл промпта | Смысл |
|---|---|---|
| 25.1 | `codex/prompts/25-01-db-console-commands.md` | Консольные команды БД/каталогов через command registry |
| 25.2 | `codex/prompts/25-02-dxf-toolbar-view-modes-rotation-controls.md` | DXF toolbar: режимы окраски, повороты и reset preview |
| 25.3 | `codex/prompts/25-03-dxf-model-tab-layout-preview-colors.md` | DXF вкладка `Модель`: 5:4 viewport, удаление подсказки, цвета preview |
| 25.4 | `codex/prompts/25-04-dxf-profiles-tab-table-materials-search-colors.md` | DXF вкладка `Профили`: таблица, палитра, поиск профиля, материал |
| 25.5 | `codex/prompts/25-05-dxf-logs-status-taxonomy.md` | DXF вкладка `Логи`: compact logs и таксономия `error/warning/info` |
| 25.6 | `codex/prompts/25-06-wind-dialog-dto-terrain-modes.md` | Диалог `Ветер`: DTO `terrainType/gammaF/mode`, Па, 40 px fields |
| 25.7 | `codex/prompts/25-07-project-tree-properties-multiselect.md` | ProjectTree/PropertiesPanel: AutoCAD-like properties и multiselect |

После каждой задачи блока 25 проверить:

```bash
cd frontend && npm run build
cd frontend && npm run lint
```

Минимальная ручная проверка блока 25: команды БД в консоли, DXF toolbar только на вкладке `Модель`, повороты preview, viewport 5:4, цвета DXF-групп на preview, таблица профилей с материалами, компактные логи без JSON, исправная модель зеленая, диалог `Ветер` с Па/СП/ПУЭ, строки 40 px в ProjectTree/PropertiesPanel, multiselect через Shift.

