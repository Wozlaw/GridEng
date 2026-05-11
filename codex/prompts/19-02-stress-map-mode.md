# Task 19.2 — Stress map mode

## Задача

Добавь режим `stress-map`.

## Требования

- Если `viewMode === "stress-map"`, members окрашивать по `sigmaMaxMPa` или `utilization`.
- Добавить legend overlay.
- Если `results` нет — показать warning через единый notification center / MUI Alert, а не через нативный `alert`.
- Min/max вычислять по текущим результатам.
- Выбранный member всё равно подсвечивать.
- Не ломать режимы отображения нагрузок, закреплений, picking-слой и static camera behavior.

## Проверки

```bash
cd frontend && npm run build
cd frontend && npm run lint
```
