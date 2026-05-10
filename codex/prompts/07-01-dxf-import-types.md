# Task 7.1 — DXF import types

## Задача
Реализуй типы DXF импорта в `frontend/src/features/import-dxf/types.ts`.

## Типы
- `DxfImportSettings`: `toleranceMm`, `centerOnXY`, `force2DToXY`.
- `DxfLineEntity`: `start`, `end`, `color?`, `colorIndex?`, `trueColor?`, `layer?`, `handle?`.
- `DxfColorGroup`: `key`, `color?`, `colorIndex?`, `trueColor?`, `layer?`, `membersCount`, `profileId?`.
- `DxfImportPreview`: `linesCount`, `ignoredEntitiesCount`, `is3D`, `zRange`, `nodesCount`, `membersCount`, `mergedNodesCount`, `danglingMembersCount`, `colorGroups`, `warnings`, `errors`.

Не реализовывать UI/parser.

## Проверки
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
