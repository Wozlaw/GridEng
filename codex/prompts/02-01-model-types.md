# Task 2.1 — GridEngModel TypeScript types

## Задача
Реализуй TypeScript-типы доменной модели `GridEngModel v0.1` в `frontend/src/entities/model/types.ts`.

## Требуемые типы
- `Vec3`: `x, y, z`.
- `ForceVector`: `fx, fy, fz, unit: "N" | "kN"`.
- `MomentVector`: `mx, my, mz, unit: "Nmm" | "kNm"`.
- `Restraint`: `ux, uy, uz, rx, ry, rz boolean`.
- `Node`: `id`, `position`, optional `force`, `moment`, `restraint`.
- `Member`: `id`, `startNodeId`, `endNodeId`, `profileId`, `materialId`, optional `localAxisRotationDeg`, `offsetYmm`, `offsetZmm`, `source`.
- `Material`: `id`, `name`, `densityKgM3`, `elasticModulusMPa`, `shearModulusMPa`, optional `poissonRatio`.
- `Profile`: `id`, `name`, `kind`, `params`, `areaMm2`, `IyMm4`, `IzMm4`, `JxMm4`, `WyMm3`, `WzMm3`, `WxMm3`, `massKgPerM`, `defaultLocalAxisRotationDeg`, `defaultOffsetYmm`, `defaultOffsetZmm`, `color`.
- `WindLoad`: `direction: Vec3`, `nominalPressureKPa`, optional `comment`; нулевой direction означает отсутствие ветра.
- `NodeLoad`: `id`, `nodeId`, optional `force`, `moment`, `loadCaseId`.
- `LoadCase`: `id`, `name`, optional `wind`, `nodeLoads`.
- `DxfEntitySource`: `entityType: "LINE"`, optional `color`, `colorIndex`, `trueColor`, `layer`, `handle`.
- `GridEngModel`: `schemaVersion: "0.1"`, `name`, `units`, `nodes`, `members`, `profiles`, `materials`, `loadCases`, optional `importMeta`.

Экспортируй все типы из `frontend/src/entities/model/index.ts`.

## Проверки
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
