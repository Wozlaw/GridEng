# Task 7.3 — Tolerance merge DXF nodes

## Задача
Реализуй объединение близких точек в `frontend/src/features/import-dxf/mergeDxfNodes.ts`.

## Требования
- Точки ближе `toleranceMm` считаются одним узлом.
- Стабильные node ids: `N1`, `N2`, ...
- Вернуть nodes и mapping endpoints.
- Посчитать `mergedNodesCount`.
- Не использовать чистый `O(n^2)` на больших моделях.
- Использовать spatial hash/grid с размером ячейки `toleranceMm`.
- Добавить комментарии к алгоритму.

## Проверки
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
