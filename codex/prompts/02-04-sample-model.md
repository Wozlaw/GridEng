# Task 2.4 — Sample tower segment model

## Задача
Создай `frontend/src/entities/model/sample.ts` с функцией:

```ts
export function createSampleTowerSegmentModel(): GridEngModel;
```

## Требования
- 4 нижних узла прямоугольника.
- 4 верхних узла.
- Вертикальные стойки.
- Диагонали.
- Несколько профилей разных цветов.
- Материал `Steel С245`.
- Один `loadCase` с нулевым ветром.
- Несколько закрепленных нижних узлов.
- Одна узловая сила и один момент.
- Модель проходит `parseGridEngModel` и `validateGridEngModelIntegrity` без errors.

## Проверки
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
