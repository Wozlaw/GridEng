# Task 6.2 — Nodes and members rendering

## Задача
Добавь wireframe rendering модели:
- `frontend/src/widgets/viewport-3d/MemberLines.tsx`
- `frontend/src/widgets/viewport-3d/NodePoints.tsx`
- `frontend/src/widgets/viewport-3d/modelToScene.ts`

## Требования
- Координаты модели в мм, в сцене scale `0.001`.
- Nodes — маленькие сферы.
- Members — линии.
- Цвет member из `profile.color`, иначе default.
- Учитывать `visibility.nodes` и `visibility.members`.
- Выбирать node/member кликом и записывать `selectedEntity` в store.
- Выбранный объект визуально подсвечивать.

## Проверки
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
