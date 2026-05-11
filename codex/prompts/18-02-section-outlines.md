# Task 18.2 — Section outlines

## Задача

Реализуй генерацию 2D контуров сечений в `frontend/src/entities/section/sectionOutline.ts`.

## API

```ts
export type Vec2 = { x: number; y: number };
export function getSectionOutline(profile: Profile): Vec2[];
```

## Поддержать

- `rect`.
- `pipe` как аппроксимация окружности.
- `L` как ломаный контур уголка.
- `U` упрощенно.
- `I` упрощенно.
- `custom` fallback как rectangle по area или default size.

## Ограничения

- Не делать boolean-обрезку.
- Не менять расчетную модель нагрузок v0.2.
- Не смешивать контур профиля с визуальным picking-слоем из задач 15.x.

## Проверки

```bash
cd frontend && npm run build
cd frontend && npm run lint
```
