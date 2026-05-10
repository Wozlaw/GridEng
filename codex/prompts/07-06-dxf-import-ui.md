# Task 7.6 — DXF import UI

## Задача
Реализуй UI импорта DXF:
- `frontend/src/features/import-dxf/ImportDxfButton.tsx`
- `frontend/src/features/import-dxf/DxfImportDialog.tsx`
- `frontend/src/features/import-dxf/DxfImportPreview.tsx`

## Требования
- Кнопка в `TopMenu`.
- Выбор `.dxf` файла.
- Настройки: `toleranceMm`, `centerOnXY`, `force2DToXY`.
- Preview: counts, 2D/3D, zRange, mergedNodesCount, danglingMembersCount, colorGroups, warnings/errors.
- Если errors нет, кнопка `Import` заменяет текущую `model` в store.
- Если errors есть, `Import` disabled.
- Пока не делать назначение реальных профилей из каталога.

## Проверки
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
