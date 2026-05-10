# Task 7.5 — DXF to GridEngModel

## Задача
Реализуй конвертацию DXF LINE entities в `GridEngModel` в `frontend/src/features/import-dxf/dxfToGridEngModel.ts`.

## Требования
- Использовать `parseDxfLines`, `normalizeDxfCoordinates`, `mergeDxfNodes`.
- Создать members `M1`, `M2`, ...
- `source.entityType = "LINE"`.
- Сохранять `color` / `colorIndex` / `trueColor` / `layer` / `handle`.
- Группировать стержни по правилу: `trueColor` → `colorIndex` → `layer`.
- Для каждой color group создать временный `Profile` с `kind: "custom"` и id формата `P_COLOR_<key>`.
- Создать default material Steel.
- Создать default loadCase с нулевым ветром.
- Запустить `validateGridEngModelIntegrity`.
- Вернуть `model + preview`.
- Если нет `LINE` — error.
- Нулевая длина — error.
- Висячие стержни — warning.

## Проверки
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
