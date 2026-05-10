# Task 10.1 — Local member frame math

## Задача
Реализуй расчет локального базиса стержня в `frontend/src/shared/math/localFrame.ts`.

## API
```ts
export function computeMemberLocalFrame(start: Vec3, end: Vec3, localAxisRotationDeg: number): {
  xAxis: Vec3;
  yAxis: Vec3;
  zAxis: Vec3;
};
```

## Требования
- Локальная ось `X` направлена от start к end.
- `localAxisRotationDeg` — поворот вокруг локальной `X`.
- Вернуть unit vectors.
- Обработать вертикальные и почти вертикальные стержни.
- Добавить комментарии.
- Смысл соответствует backend `Beam.alpha`: поворот вокруг собственной оси стержня.

## Проверки
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
