# Task 20.2 — DXF import specification documentation

## Задача

Создай/обнови документацию `frontend/docs/dxf-import-spec-v0.1.md`.

## Описать

- поддерживается только `LINE`;
- используются coordinates, `color`, `colorIndex`, `trueColor`, `layer`, `handle`;
- остальные primitives игнорируются, перечислить их явно;
- tolerance соединения линий;
- проверка 2D/3D;
- центрирование по XY;
- Z вверх;
- color/layer groups;
- проверка висячих стержней;
- preview импорта;
- errors/warnings;
- ограничения импорта;
- связь импортированных объектов с `DxfEntitySource` и доступ к служебной информации через консольные debug-команды.

## Ограничения

- Не менять код.

## Проверки

```bash
cd frontend && npm run build
cd frontend && npm run lint
```
