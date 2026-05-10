# Task 9.1 — Load and moment vectors rendering

## Задача
Добавь визуализацию нагрузок:
- `frontend/src/widgets/viewport-3d/LoadVectors.tsx`
- `frontend/src/widgets/viewport-3d/MomentVectors.tsx`

## Требования
- Силы рисовать стрелками.
- Моменты — упрощенно дуговой или круговой стрелкой.
- Масштаб авто-нормализовать по max force/moment.
- Учитывать `visibility.loads` и `visibility.moments`.
- Использовать первый `loadCase`, пока active loadCase не введен.

## Проверки
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
