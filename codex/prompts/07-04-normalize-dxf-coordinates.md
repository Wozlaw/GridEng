# Task 7.4 — Normalize DXF coordinates

## Задача
Реализуй нормализацию координат в `frontend/src/features/import-dxf/normalizeDxfCoordinates.ts`.

## Требования
1. 3D если `maxZ - minZ > toleranceMm`, иначе 2D.
2. Если 2D и `force2DToXY = true`, всем `Z = 0`.
3. Если `centerOnXY = true`: центр bbox по X/Y сместить в `(0,0)`, Z не центрировать.
4. Вернуть normalized lines и diagnostics: `is3D`, `zRange`, `xyCenterShift`.

## Проверки
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
