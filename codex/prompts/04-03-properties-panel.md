# Task 4.3 — Properties panel

## Задача
Доработай `frontend/src/widgets/properties-panel/PropertiesPanel.tsx`.

## Логика
- Если `selectedEntity` пустой: показать summary модели.
- Если выбран node: координаты, force, moment, restraint.
- Если выбран member: start/end node, profile/material, localAxisRotationDeg, offsetYmm/offsetZmm, source DXF color/layer.
- Если выбран profile: name, kind, area, Iy, Iz, Jx, Wy, Wz, Wx, massKgPerM, default rotation/offset.

Только read-only.

## Проверки
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
