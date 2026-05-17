# Documentation cleanup notes

## Цель

Свести комплект Codex к управляемой структуре: один актуальный план, одна единая спецификация, отдельные reference-документы как история решений и проверочные материалы.

## Что считается актуальным

- `codex/IMPLEMENTATION_PLAN.md` — порядок задач и статусы.
- `codex/UNIFIED_GRIDENG_SPECIFICATION.md` — целевая спецификация требований.
- `codex/REQUIREMENTS_REVIEW.md` — исторический отчет ревизии.
- `codex/docs/catalogs-api-integration-spec.md` — контрактный reference по API-каталогам.
- `codex/docs/ui-revision-*-implementation-notes.md` — итоги UI-итераций.
- `codex/IMPLEMENTATION_CROSS_SECTIONS_STRUCTURE.md` и `codex/IMPLEMENTATION_MATERIALS_STRUCTURE.md` — backend reference.

## Что требует очистки

Состояние на 2026-05-17: каталог `codex/reference/` уже нормализован. Канонический исторический файл для UI revision 1 — `codex/reference/UI_REVISION_1_CHECKED_REQUIREMENTS.md`. Файлов с поврежденной кодировкой имени в текущем комплекте не обнаружено.

Рекомендуемое действие:

1. Считать каноническим следующий файл:

```text
codex/reference/UI_REVISION_1_CHECKED_REQUIREMENTS.md
```

2. Если в будущих поставках снова появятся дубли с битой кодировкой имени, не использовать их как source of truth; сначала сверить с каноническим файлом и git history.
3. Не менять содержимое требований без отдельной задачи; нормализовать только имена, пути и статус документа.

## Правило ссылок

Новые prompts должны ссылаться на:

```text
codex/UNIFIED_GRIDENG_SPECIFICATION.md
codex/IMPLEMENTATION_PLAN.md
codex/docs/catalogs-api-integration-spec.md
```

Старые checked requirements использовать только как источник исторических формулировок.
