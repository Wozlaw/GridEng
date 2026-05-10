# Task 2.2 — Zod schemas for GridEngModel v0.1

## Задача
Добавь Zod-схемы в `frontend/src/entities/model/schema.ts`.

## Требования
- Схемы должны соответствовать `types.ts`.
- `schemaVersion` строго `"0.1"`.
- `Profile` должен содержать поля `JxMm4`, `WxMm3`, `massKgPerM`, `defaultLocalAxisRotationDeg`, `defaultOffsetYmm`, `defaultOffsetZmm`.
- `Member` должен поддерживать optional override `localAxisRotationDeg`, `offsetYmm`, `offsetZmm`.
- `DxfEntitySource.entityType` допускает только `"LINE"` и optional `color`, `colorIndex`, `trueColor`, `layer`, `handle`.
- `WindLoad.direction` допускает нулевой вектор.
- Проверку ссылочной целостности не делать в Zod.
- Экспортировать:
  - `parseGridEngModel(raw: unknown): GridEngModel`
  - `safeParseGridEngModel(raw: unknown)`

Обнови `frontend/src/entities/model/index.ts`.

## Проверки
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
