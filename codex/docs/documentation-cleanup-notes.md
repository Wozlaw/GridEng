# Documentation cleanup notes

## Цель

Свести комплект Codex к управляемой структуре: один актуальный план, одна единая спецификация, отдельные reference-документы как история решений и проверочные материалы.

## Что считается актуальным

- `IMPLEMENTATION_PLAN.md` — порядок задач и статусы.
- `UNIFIED_GRIDENG_SPECIFICATION.md` — целевая спецификация требований.
- `REQUIREMENTS_REVIEW.md` — отчет ревизии.
- `docs/catalogs-api-integration-spec.md` — следующая итерация по API-каталогам.
- `docs/ui-revision-*-implementation-notes.md` — итоги UI-итераций.
- `IMPLEMENTATION_CROSS_SECTIONS_STRUCTURE.md` и `IMPLEMENTATION_MATERIALS_STRUCTURE.md` — backend reference.

## Что требует очистки

В `reference/` присутствуют несколько дублей исходного файла с поврежденной кодировкой имени. Содержательно это один и тот же документ `Правки интерфейса GridEng...`.

Рекомендуемое действие:

1. Оставить один файл с нормальным именем, например:

```text
reference/UI_REVISION_1_CHECKED_REQUIREMENTS.md
```

2. Остальные дубли перенести в архивную папку или удалить после проверки git history.
3. Не менять содержимое требований без отдельной задачи; только нормализовать имена и ссылки.

## Правило ссылок

Новые prompts должны ссылаться на:

```text
UNIFIED_GRIDENG_SPECIFICATION.md
IMPLEMENTATION_PLAN.md
docs/catalogs-api-integration-spec.md
```

Старые checked requirements использовать только как источник исторических формулировок.
