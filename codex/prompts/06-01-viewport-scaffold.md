# Task 6.1 — Three/R3F viewport scaffold

## Задача
Создай базовый 3D viewport:
- `frontend/src/widgets/viewport-3d/Viewport3D.tsx`
- `frontend/src/widgets/viewport-3d/SceneAxes.tsx`
- `frontend/src/widgets/viewport-3d/SceneGrid.tsx`

## Требования
- `@react-three/fiber` `Canvas`.
- `OrbitControls` из `@react-three/drei`.
- Grid helper.
- Axes helper.
- Нормальная начальная camera.
- Темный background.
- Встроить в `CadShell` вместо placeholder.
- Пока не рисовать nodes/members.
- Реализовать гизмо с направлением и наименованиями осей, ось Z вверх по умолчанию

## Проверки
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
