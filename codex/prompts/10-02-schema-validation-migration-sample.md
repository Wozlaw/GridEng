# Общие правила выполнения

- Работай маленьким diff. Не пытайся выполнить соседние задачи из следующих файлов.
- Перед правками дай краткий план и перечисли файлы, которые планируешь менять.
- Проект уже выполнен до задачи 9.2 включительно. Не откатывай реализованные `loads/moments rendering` и `restraints rendering`, а адаптируй их к новой модели.
- Frontend: `frontend/`, React + TypeScript + Vite + MUI + Three/R3F + Zustand.
- Backend и БД не трогать. Нормативный расчет ветра не реализовывать. API пересчета ЛСК/ГСК не реализовывать в этой ветке.
- После каждой задачи запусти: `cd frontend && npm run build` и `cd frontend && npm run lint`.
- В конце ответа покажи: summary, измененные файлы, команды, результат build/lint, риски/техдолг.


# Task 10.2 — Обновить schema, validation, sample и миграцию JSON

## Контекст

После Task 10.1 типы модели расширены до `GridEngModel v0.2`. Нужно привести runtime-схемы, валидатор, sample-модель и JSON import к новой структуре.

## Сделать

1. Обновить `frontend/src/entities/model/schema.ts` под новую модель `Load`.
2. Обновить `frontend/src/entities/model/validation.ts`:
   - проверять существование target node/member;
   - проверять `direction`;
   - проверять `coordinateSystem === 'global'`;
   - проверять `xStartRel/xEndRel` для `linear`;
   - добавлять warnings для `function` distribution как unsupported placeholder.
3. Обновить `frontend/src/entities/model/sample.ts`:
   - минимум одна узловая force-нагрузка;
   - минимум одна узловая moment-нагрузка;
   - минимум одна распределенная linear-нагрузка на стержень;
   - заполнить `comment` на 1–2 сущностях для проверки UI.
4. Добавить миграцию v0.1 → v0.2:
   - создать `frontend/src/entities/model/migrations.ts` или аналогичный файл;
   - экспортировать `migrateGridEngModelToCurrent(input): GridEngModel`;
   - импорт JSON должен вызывать миграцию до validation/store set.
5. Правила миграции старого `ConcentratedLoad.vector`:
   - ненулевой `force` → `NodalConcentratedLoad` с `kind: 'force'`;
   - ненулевой `moment` → `NodalConcentratedLoad` с `kind: 'moment'`;
   - если force и moment ненулевые — создать две нагрузки;
   - `description` перенести в `comment`, `name` сформировать безопасно;
   - нулевой vector мигрировать с warning.
6. Добавить math helpers для нагрузок в `shared/math` или `entities/model/geometry.ts`, не дублировать в компонентах.

## Ограничения

- Если старые member-target concentrated loads реально встречаются, не скрывать проблему: добавить warning и безопасное отображение. Не придумывать расчетную конвертацию без задания.
- Не менять публичный backend API.

## Проверка

- Старый sample/JSON v0.1 импортируется и превращается в v0.2.
- Новый sample v0.2 проходит schema + validation.
- `npm run build` и `npm run lint` проходят.
