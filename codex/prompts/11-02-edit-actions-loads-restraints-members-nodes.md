# Общие правила выполнения

- Работай маленьким diff. Не пытайся выполнить соседние задачи из следующих файлов.
- Перед правками дай краткий план и перечисли файлы, которые планируешь менять.
- Проект уже выполнен до задачи 9.2 включительно. Не откатывай реализованные `loads/moments rendering` и `restraints rendering`, а адаптируй их к новой модели.
- Frontend: `frontend/`, React + TypeScript + Vite + MUI + Three/R3F + Zustand.
- Backend и БД не трогать. Нормативный расчет ветра не реализовывать. API пересчета ЛСК/ГСК не реализовывать в этой ветке.
- После каждой задачи запусти: `cd frontend && npm run build` и `cd frontend && npm run lint`.
- В конце ответа покажи: summary, измененные файлы, команды, результат build/lint, риски/техдолг.


# Task 11.2 — Добавить store actions для редактирования модели

## Цель

Вынести редактирование пользовательских сущностей в store actions, чтобы Properties, диалоги, консоль и будущие команды не писали модель напрямую.

## Сделать

Добавить actions в `modelStore` или рядом с ним:

### Node

- `updateNodeLabel(nodeId, label)`;
- `updateNodePosition(nodeId, position)`;
- `updateNodeComment(nodeId, comment)`.

### Member

- `updateMemberProfile(memberId, profileId)`;
- `updateMemberMaterial(memberId, materialId)`;
- `updateMemberGeometryOverrides(memberId, { localAxisRotationDeg, offsetYmm, offsetZmm })`;
- `updateMemberComment(memberId, comment)`.

### Restraint

- `upsertNodeRestraint(nodeId, patch)`;
- `deleteNodeRestraint(nodeId)`;
- `applyRestraintPreset(nodeId, preset)` для `free`, `hinge`, `fixed`, `custom`.

Важно: закрепления остаются в `model.restraints[]`, не добавлять `node.restraint`.

### LoadCase / Load

- `addNodalConcentratedLoad(loadCaseId, payload)`;
- `addMemberDistributedLoad(loadCaseId, payload)`;
- `updateLoad(loadCaseId, loadId, patch)`;
- `deleteLoad(loadCaseId, loadId)`;
- `updateLoadCase(loadCaseId, patch)`;
- `updateLoadComment(loadCaseId, loadId, comment)`.

### Wind

- `updateLoadCaseWind(loadCaseId, windPatch)`.

## Валидация в actions

- Не назначать несуществующий `profileId/materialId/nodeId/memberId`.
- Для направления нагрузки нормализовать вектор или возвращать ошибку через notification action, если он нулевой.
- После редактирования запускать validation/update derived state, если это уже реализовано в проекте.

## Ограничения

- Не делать UI в этой задаче.
- Не менять сцену в этой задаче.

## Проверка

- Store actions типобезопасны.
- Ошибки не падают в runtime, а возвращаются/отображаются через будущий notification слой или temporary console warning.
- `npm run build` и `npm run lint` проходят.
