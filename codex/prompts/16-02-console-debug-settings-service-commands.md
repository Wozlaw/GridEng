# Общие правила выполнения

- Работай маленьким diff. Не пытайся выполнить соседние задачи из следующих файлов.
- Перед правками дай краткий план и перечисли файлы, которые планируешь менять.
- Проект уже выполнен до задачи 9.2 включительно. Не откатывай реализованные `loads/moments rendering` и `restraints rendering`, а адаптируй их к новой модели.
- Frontend: `frontend/`, React + TypeScript + Vite + MUI + Three/R3F + Zustand.
- Backend и БД не трогать. Нормативный расчет ветра не реализовывать. API пересчета ЛСК/ГСК не реализовывать в этой ветке.
- После каждой задачи запусти: `cd frontend && npm run build` и `cd frontend && npm run lint`.
- В конце ответа покажи: summary, измененные файлы, команды, результат build/lint, риски/техдолг.


# Task 16.2 — Добавить служебные команды консоли

## Цель

Через консоль должны быть доступны настройки проекта и служебная информация для отладки, которая убрана из основного UI.

## Сделать

### Settings

Реализовать команды:

- `settings.show` — показать UI settings + model.settings;
- `settings.set nodeMergeToleranceMm <number>`;
- `settings.set centerModelByXYProjection true|false`;
- `settings.set language ru|en`;
- `settings.set panel.projectTree.width <number>`;
- `settings.set panel.properties.width <number>`;
- `settings.set visibility.axes true|false`;
- `settings.set visibility.grid true|false`;
- `settings.set visibility.loads true|false`;
- `settings.set visibility.restraints true|false`.

`verticalAxis` только readonly `Z`, менять нельзя.

### Debug/source info

Реализовать команды:

- `debug.selection` — текущий selected entity;
- `debug.model.summary` — счетчики nodes/members/loadCases/loads/restraints/profiles/materials;
- `debug.node <id>`;
- `debug.member <id>`;
- `debug.load <loadCaseId> <loadId>`;
- `debug.source.member <id>` — показать DXF Source/trace, если есть;
- `debug.importMeta` — показать importMeta, DXF tolerance, warnings.

### Placeholder namespaces

- `db.help` — вывести, что DB-команды зарезервированы и не реализованы в этой frontend-итерации.
- `structures.help` — вывести, что каталог конструкций/атлас типовых опор будет backend-сущностью позже.

## UX

- Ошибки аргументов показывать в консоль + MUI Alert warning/error.
- Успешные изменения настроек показывать через Alert success/info.

## Проверка

- Можно посмотреть DXF Source через консоль, хотя его нет в Properties.
- Можно переключить visibility через консоль.
- DB namespace не делает реальных запросов.
- `npm run build` и `npm run lint` проходят.
