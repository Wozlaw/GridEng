# Общие правила выполнения

- Работай маленьким diff. Не пытайся выполнить соседние задачи из следующих файлов.
- Перед правками дай краткий план и перечисли файлы, которые планируешь менять.
- Проект уже выполнен до задачи 9.2 включительно. Не откатывай реализованные `loads/moments rendering` и `restraints rendering`, а адаптируй их к новой модели.
- Frontend: `frontend/`, React + TypeScript + Vite + MUI + Three/R3F + Zustand.
- Backend и БД не трогать. Нормативный расчет ветра не реализовывать. API пересчета ЛСК/ГСК не реализовывать в этой ветке.
- После каждой задачи запусти: `cd frontend && npm run build` и `cd frontend && npm run lint`.
- В конце ответа покажи: summary, измененные файлы, команды, результат build/lint, риски/техдолг.


# Task 11.1 — Обновить selection и store под load/restraint

## Цель

Добавить отдельный выбор конкретной нагрузки и закрепления, чтобы дерево, сцена и Properties работали с одной сущностью, а не только с load case.

## Сделать

1. В `frontend/src/features/selection/types.ts` расширить `SelectedEntity`:
   - `node`;
   - `member`;
   - `profile`;
   - `material`;
   - `loadCase`;
   - `load` с полями `loadCaseId`, `loadId`;
   - `restraint` с `restraintId` и/или `nodeId`.
2. Обновить все места, где selection сравнивается по `type`.
3. В `frontend/src/app/store/modelStore.ts` добавить actions:
   - `selectLoad(loadCaseId, loadId)`;
   - `selectRestraint(restraintId)`;
   - `clearSelection()`;
   - безопасные selectors/getters для selected node/member/load/restraint.
4. Не вызывать fit/camera update при selection. Selection не должен менять позицию, масштаб или target камеры.
5. Обновить status bar / debug вывод, если он использует selected entity.

## Критерии приемки

- При выборе нагрузки из дерева можно получить именно эту нагрузку в Properties.
- При выборе закрепления можно подсветить связанную ноду.
- Существующий выбор node/member не сломан.
- Камера не двигается при выборе.

## Проверка

`cd frontend && npm run build`
`cd frontend && npm run lint`
