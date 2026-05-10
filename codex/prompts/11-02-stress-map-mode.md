# Task 11.2 — Stress map mode

## Задача
Добавь режим `stress-map`.

## Требования
- Если `viewMode === "stress-map"`, members окрашивать по `sigmaMaxMPa` или `utilization`.
- Добавить legend overlay.
- Если results нет — warning в status bar или overlay.
- Min/max вычислять по текущим результатам.
- Выбранный member всё равно подсвечивать.

## Проверки
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
