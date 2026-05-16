# GridEng — ревизия требований и план согласования

Дата ревизии: 2026-05-16

## 1. Что проверено

Проверены и сведены следующие группы материалов:

- `IMPLEMENTATION_PLAN.md`;
- prompts `00.1–23.5`;
- `TASKS.json` и `TASK_SEQUENCE.md`;
- `docs/grideng-model-v0.2.md`;
- `docs/dxf-import-spec-v0.1.md`;
- `docs/ui-revision-2-*`, `docs/ui-revision-3-*`, `docs/ui-revision-3-1-*`;
- `reference/MODEL_LOADS_V02_SPEC.md`;
- `reference/UI_COMMANDS_AND_ALERTS_SPEC.md`;
- `reference/UI_REVISION_2_CHECKED_REQUIREMENTS.md`;
- `reference/UI_REVISION_3_CHECKED_REQUIREMENTS.md`;
- `reference/UI_REVISION_3_1_REQUIREMENTS.md`;
- `IMPLEMENTATION_CROSS_SECTIONS_STRUCTURE.md`;
- `IMPLEMENTATION_MATERIALS_STRUCTURE.md`.

Live-проверка GitHub-репозитория из sandbox не выполнена: окружение не смогло разрешить `github.com`. Поэтому ревизия основана на приложенном архиве и проектном контексте.

## 2. Итог ревизии

В архиве уже корректно встроены и закрыты задачи 0.1–23.2, а также сформированы prompts 23.3–23.5. Незавершенные задачи 23.3–23.5 оставлены как ближайший хвост UI revision 3.1.

Дополнительно выявлен отдельный следующий слой работ: frontend-интеграция backend-каталогов `cross_sections` и `materials`. Backend-ветки по сортаментам и материалам уже оформлены отдельными summary-документами, но не были отражены в `IMPLEMENTATION_PLAN.md` как следующая итерация frontend/API-интеграции. Для этого добавлен блок 24.1–24.5 и соответствующие prompts.

## 3. Снятые противоречия

| № | Проблема | Решение |
|---|---|---|
| 1 | Профили/материалы в дереве проекта против отдельных каталогов | В дереве остаются расчетные сущности; профили/материалы открываются отдельными диалогами/каталогами |
| 2 | Материал как свойство профиля против материала как свойства элемента | Материал остается свойством элемента; профиль задает геометрию; default material у профиля возможен только позже |
| 3 | Сила и момент внутри одной нагрузки | В v0.2 нагрузка имеет `kind`; force/moment разделяются |
| 4 | Давление ветра в разных единицах | Зафиксировано: UI и модель используют `Па` |
| 5 | 3D-вектор ветра против 2D UI | Модель 3D сохраняется; UI редактирует X/Y, сохраняет `z=0` |
| 6 | DXF preview мог смешиваться с основной моделью | Preview изолирован до нажатия `Импорт` |
| 7 | Grayscale UI против цветной диагностики | Цвет допускается только как функциональный слой: диагностика, профили, нагрузки, закрепления, alerts |
| 8 | Backend JSON справочники против frontend local catalog | Backend API — целевой источник; local catalog допустим только как fallback/заглушка |

## 4. Изменения в комплекте

Добавлены файлы:

- `UNIFIED_GRIDENG_SPECIFICATION.md` — единая спецификация требований.
- `REQUIREMENTS_REVIEW.md` — отчет ревизии и снятых противоречий.
- `docs/catalogs-api-integration-spec.md` — спецификация frontend-интеграции `cross_sections`/`materials`.
- `docs/documentation-cleanup-notes.md` — правила очистки документации и дублей.
- `prompts/24-01-catalog-api-contracts-and-adapters.md`.
- `prompts/24-02-profile-catalog-frontend-integration.md`.
- `prompts/24-03-material-selector-by-profile-thickness.md`.
- `prompts/24-04-dxf-profile-assignment-api-catalog.md`.
- `prompts/24-05-docs-cleanup-unified-spec.md`.

Обновлены файлы:

- `IMPLEMENTATION_PLAN.md` — добавлен блок 24.1–24.5.
- `TASKS.json` — добавлены задачи 24.1–24.5.
- `README.md` — добавлен раздел по ревизии и новой итерации.
- `TASK_SEQUENCE.md` — добавлен блок 24.
- `INTEGRATION_NOTES.md` — добавлено примечание по frontend/API-интеграции каталогов.

## 5. Рекомендуемый порядок выполнения

1. Закрыть текущие todo: 23.3, 23.4, 23.5.
2. Выполнить 24.1: API contracts/adapters.
3. Выполнить 24.2: frontend catalog profiles integration.
4. Выполнить 24.3: material selector after profile selection.
5. Выполнить 24.4: DXF assignment через API catalog.
6. Выполнить 24.5: документационная очистка и фиксация единой спецификации.

## 6. Вопросы пользователю

Критичных блокирующих вопросов для задач 23.3–24.5 нет. Есть вопросы для будущих итераций:

1. Нормативный расчет ветра: по какому СП/методике и с какими параметрами местности проектировать калькулятор.
2. Серверное хранение проектов: нужен ли backend для проектов или пока остается JSON import/export.
3. Нужно ли вводить `defaultMaterialId` у профиля как рекомендованный материал по умолчанию, не меняя `member.materialId`.
