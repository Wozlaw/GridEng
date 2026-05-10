# Task 7.2 — Parse DXF LINE only

## Задача
Реализуй DXF parser adapter в `frontend/src/features/import-dxf/parseDxfLines.ts`.

## Требования
- Использовать `dxf-parser`.
- Принимать `dxfText: string`.
- Возвращать только `LINE` entities.
- Читать start/end coordinates.
- Читать `color` / `colorIndex` / `trueColor`, если доступны.
- Читать `layer` и `handle`.
- Остальные entity types считать в `ignoredEntitiesCount`.
- Не падать на неизвестных полях.
- Не создавать `GridEngModel`.

## Проверки
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
