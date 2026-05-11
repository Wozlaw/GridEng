# Task 18.3 — Real view rendering

## Задача

Добавь режим `real view` в `Viewport3D`.

## Требования

- Если `viewMode === "real"`, вместо линий рисовать extruded geometry вдоль стержня.
- Использовать `getSectionOutline(profile)`.
- Учитывать member/profile rotation и offset по ЛСК Y/Z.
- Boolean-обрезку соединений не делать.
- Для сложных/ошибочных профилей fallback на цилиндр/box.
- Выбранный member всё равно подсвечивать согласно правилам задач 15.x.
- Selection не должен вызывать изменение камеры.

## Проверки

```bash
cd frontend && npm run build
cd frontend && npm run lint
```
