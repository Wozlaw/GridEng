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
