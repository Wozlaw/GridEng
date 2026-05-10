# GridEng Codex Implementation Kit

Комплект файлов для пошаговой реализации frontend части GridEng через Codex.

## Назначение

Проект: приложение для расчета стержневых металлоконструкций с прицелом на опоры ЛЭП свыше 35 кВ.

Текущий фокус:
- CAD-like frontend;
- внутренняя модель `GridEngModel v0.1`;
- импорт/экспорт JSON;
- импорт DXF v0.1 только по `LINE`, координатам, `color` / `colorIndex` / `trueColor`, `layer`, `handle`;
- 3D-сцена с wireframe / real / loads / restraints / stress-map;
- подготовка контракта API характеристик сечений;
- без БД на текущем этапе;
- backend расчетное ядро не менять без отдельного задания.

## Состав архива

```text
grideng-codex-kit/
  README.md
  IMPLEMENTATION_PLAN.md
  TASKS.json
  templates/
    codex-task-template.md
  prompts/
    00-01-update-agents.md
    01-01-install-frontend-dependencies.md
    ...
  docs/
    grideng-model-v0.1.md
    dxf-import-spec-v0.1.md
  patches/
    AGENTS.addendum.md
```

## Как использовать

1. Открыть репозиторий GridEng в Codex.
2. Начать с `prompts/00-01-update-agents.md`.
3. Выполнять задачи строго по порядку из `IMPLEMENTATION_PLAN.md` или `TASKS.json`.
4. После каждой задачи требовать:
   - summary изменений;
   - список измененных файлов;
   - команды, которые запускались;
   - результат build/lint;
   - риски и технический долг.

## Базовые проверки

Для frontend-задач:

```bash
cd frontend
npm run build
npm run lint
```

Если `lint` отсутствует или не настроен, Codex должен явно написать это в отчете.
