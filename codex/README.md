# GridEng — комплект задач Codex

Этот каталог уже встроен в репозиторий и отражает актуальное состояние проекта после завершения задач `0.1–20.2`.

## Как использовать

1. Ориентируйся на `codex/IMPLEMENTATION_PLAN.md` как на основной источник порядка выполнения и статусов.
2. Для краткой последовательности блоков используй `codex/TASK_SEQUENCE.md`.
3. Для machine-readable списка задач используй `codex/TASKS.json`.
4. Для канонического описания данных и импорта используй:
   - `codex/docs/grideng-model-v0.2.md`
   - `codex/docs/dxf-import-spec-v0.1.md`
   - `codex/docs/ui-revision-2-implementation-notes.md`
5. Выполняй frontend-задачи последовательно, без пропуска зависимостей между блоками.

## Структура нумерации

- `10.1–17.2` — новая UI/model/console итерация, встроенная после выполненной `9.2`.
- `18.1–20.2` — перенесённые старые задачи, которые раньше занимали диапазон `10.1–12.2`.

## Карта перенумерации

| Старый номер | Новый номер |
|---|---|
| 10.1 | 18.1 |
| 10.2 | 18.2 |
| 10.3 | 18.3 |
| 11.1 | 19.1 |
| 11.2 | 19.2 |
| 12.1 | 20.1 |
| 12.2 | 20.2 |

## Что находится в каталоге

```text
codex/
  README.md
  IMPLEMENTATION_PLAN.md
  TASK_SEQUENCE.md
  TASKS.json
  prompts/
    00-01-...md
    ...
    20-02-...md
  docs/
    grideng-model-v0.2.md
    dxf-import-spec-v0.1.md
  templates/
  patches/
  reference/
```

## Проверка после frontend-блоков

```bash
cd frontend && npm run build
cd frontend && npm run lint
```


## Интерфейсная ревизия 2

Новые задачи ревизии 2 добавлены поверх выполненного плана и начинаются с блока 21:

- `21.1` — layout/overflow/высота TopMenu;
- `21.2` — реорганизация ribbon TopMenu;
- `21.3` — единое `activeLoadCaseId`;
- `21.4` — scene overlays и `visibility.labels`;
- `21.5` — подписи сил/моментов и визуальная грамматика закреплений;
- `21.6` — ProjectTree/Properties polish;
- `21.7` — docked/fullscreen console;
- `21.8` — заглушки, финальный checklist и документация.

Согласованные требования сохранены в `codex/reference/UI_REVISION_2_CHECKED_REQUIREMENTS.md`.
