# Task 3.1 — Zustand model store

## Задача
Создай Zustand store в `frontend/src/app/store/modelStore.ts`.

## Состояние
- `model: GridEngModel`
- `validationReport`
- `selectedEntity: { type: "node" | "member" | "profile" | "material" | "loadCase" | null; id: string | null }`
- `viewMode: "wireframe" | "real" | "loads" | "restraints" | "deformed" | "stress-map"`
- `visibility: { nodes, members, loads, moments, restraints, labels }`
- `dxfImportSettings: { toleranceMm, centerOnXY, force2DToXY }`

## Actions
- `setModel`
- `validateModel`
- `selectEntity`
- `clearSelection`
- `setViewMode`
- `setVisibility`
- `updateDxfImportSettings`

Инициализируй store через `createSampleTowerSegmentModel()`.

## Проверки
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
