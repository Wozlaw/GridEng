# Task 8.1 — Section API contract types

## Задача
Создай контракт типов для будущего API расчета характеристик сечений в `frontend/src/entities/section/apiTypes.ts`.

## Требования
- `SectionCalculateRequest`: `profileKind`, `name?`, `params`, `axis: "YZ"`, `materialId?`.
- `SectionCalculateResponse`: `profileKind`, `name?`, `params`, `areaMm2`, `IyMm4`, `IzMm4`, `JxMm4`, `WyMm3`, `WzMm3`, `WxMm3`, `massKgPerM`, optional `warnings`.
- Добавить Zod-схемы request/response.
- Endpoint/backend не реализовывать.

## Проверки
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
