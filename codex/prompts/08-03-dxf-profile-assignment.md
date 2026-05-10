# Task 8.3 — Assign profiles to DXF color groups

## Задача
Доработай DXF import dialog.

## Требования
- Таблица назначения профилей: color/layer group, count, текущий временный profile, select из локального каталога, возможность оставить custom.
- После импорта заменить временные профили выбранными из каталога.
- Members должны ссылаться на выбранный `profileId`.
- Не создавать дубли профилей без необходимости.

## Проверки
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
