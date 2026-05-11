# Общие правила выполнения

- Работай маленьким diff. Не пытайся выполнить соседние задачи из следующих файлов.
- Перед правками дай краткий план и перечисли файлы, которые планируешь менять.
- Проект уже выполнен до задачи 9.2 включительно. Не откатывай реализованные `loads/moments rendering` и `restraints rendering`, а адаптируй их к новой модели.
- Frontend: `frontend/`, React + TypeScript + Vite + MUI + Three/R3F + Zustand.
- Backend и БД не трогать. Нормативный расчет ветра не реализовывать. API пересчета ЛСК/ГСК не реализовывать в этой ветке.
- После каждой задачи запусти: `cd frontend && npm run build` и `cd frontend && npm run lint`.
- В конце ответа покажи: summary, измененные файлы, команды, результат build/lint, риски/техдолг.


# Task 10.1 — Обновить типы модели: нагрузки v0.2 и комментарии

## Контекст

Текущая модель `GridEngModel v0.1` хранит нагрузки как `loadCases[].loads[]` с `ConcentratedLoad.vector.force/moment`. Нужно перейти к пользовательской модели нагрузок с явным `kind`, поддержкой узловой сосредоточенной и стержневой распределенной нагрузки.

## Сделать

1. В `frontend/src/entities/model/types.ts` обновить модель до `schemaVersion: '0.2'`.
2. Добавить типы:
   - `LoadCoordinateSystem = 'global'`;
   - `LoadKind = 'force' | 'moment'`;
   - `LoadType = 'nodal_concentrated' | 'member_distributed'`;
   - `LoadDistributionType = 'linear' | 'function'`.
3. Добавить `LoadBase`, `NodalConcentratedLoad`, `MemberDistributedLoad`, `LinearLoadDistribution`, `FunctionLoadDistributionReserved`, `Load`.
4. В `LoadCase.loads` заменить старый `ConcentratedLoad[]` на `Load[]`.
5. Добавить `comment?: string` к пользовательским сущностям:
   - `Node`;
   - `Member`;
   - `Profile`;
   - `Material`;
   - `Restraint`;
   - `LoadCase`;
   - `WindLoadDefinition` уже имеет `comment`, проверь и сохрани;
   - все новые load-типы.
6. Не переносить `materialId` из `Member` в `Profile`. Материал остается свойством элемента.
7. Оставить только ГСК для всех нагрузок: `coordinateSystem: 'global'`.
8. Для распределенной нагрузки реализовать только `linear` через `qStart/qEnd`, но тип `function` зарезервировать без UI-редактора.

## Ограничения

- Не менять backend.
- Не реализовывать расчет распределенных нагрузок.
- Не делать ЛСК в UI.
- Не ломать экспорт/импорт старых JSON: миграция будет в следующей задаче.

## Проверка

- TypeScript типы компилируются.
- Старые импорты из `entities/model` не сломаны.
- `npm run build` и `npm run lint` проходят.
