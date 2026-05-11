# Общие правила выполнения

- Работай маленьким diff. Не пытайся выполнить соседние задачи из следующих файлов.
- Перед правками дай краткий план и перечисли файлы, которые планируешь менять.
- Проект уже выполнен до задачи 9.2 включительно. Не откатывай реализованные `loads/moments rendering` и `restraints rendering`, а адаптируй их к новой модели.
- Frontend: `frontend/`, React + TypeScript + Vite + MUI + Three/R3F + Zustand.
- Backend и БД не трогать. Нормативный расчет ветра не реализовывать. API пересчета ЛСК/ГСК не реализовывать в этой ветке.
- После каждой задачи запусти: `cd frontend && npm run build` и `cd frontend && npm run lint`.
- В конце ответа покажи: summary, измененные файлы, команды, результат build/lint, риски/техдолг.


# Task 17.2 — Документация и финальная проверка итерации

## Цель

Зафиксировать новую архитектуру после задач 10–17 и проверить, что приложение не потеряло уже реализованный функционал 1–9.2.

## Сделать

1. Обновить документацию модели:
   - `GridEngModel v0.2`;
   - load-типы;
   - распределенная нагрузка `linear qStart/qEnd`;
   - comments;
   - migration v0.1 → v0.2.
2. Обновить документацию UI:
   - command registry;
   - console commands;
   - notification center;
   - localization;
   - ribbon blocks;
   - project tree/properties behavior.
3. Добавить/обновить checklist ручного тестирования:
   - импорт JSON v0.1;
   - экспорт JSON v0.2;
   - выбор node/member/load/restraint;
   - редактирование node/member/load/restraint;
   - visibility axes/grid/loads/restraints;
   - Fit только по команде;
   - камера не двигается при selection;
   - панель скрывается/меняет ширину и сохраняет состояние;
   - console help/settings/lang/debug;
   - Alert для ошибок/служебных сообщений.
4. Если в проекте есть tests — добавить минимальные тесты на migration/helpers/validation. Если тестовой инфраструктуры frontend нет, не внедрять тяжелую инфраструктуру без отдельного задания; вместо этого добавить clear manual checklist.
5. Обновить `codex/IMPLEMENTATION_PLAN.md` или добавить `codex/docs/ITERATION_AFTER_09_02.md`, чтобы было видно, что старые 10.x real-view задачи отложены/перенумерованы после этой UI/model итерации.

## Проверка

- `npm run build` проходит.
- `npm run lint` проходит.
- Документация отражает фактическую реализацию, а не желаемое состояние.
- В финальном ответе Codex перечисляет оставшиеся риски и технический долг.
