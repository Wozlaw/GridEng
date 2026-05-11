# Task 20.1 — GridEngModel v0.2 documentation

## Задача

Создай/обнови документацию `frontend/docs/grideng-model-v0.2.md`.

## Описать

- назначение `GridEngModel`;
- `schemaVersion: "0.2"` и миграцию v0.1 → v0.2;
- единицы измерения;
- `Vec3`;
- `ForceVector`;
- `MomentVector`;
- nodes;
- members;
- `DxfEntitySource`;
- profiles;
- materials;
- loadCases;
- новую модель нагрузок v0.2:
  - `Load` как union type;
  - `ConcentratedNodeLoad`;
  - `DistributedMemberLoad`;
  - `kind: "force" | "moment"`;
  - только ГСК для задания нагрузок;
  - распределение `linear` через `qStart` и `qEnd`;
  - фундамент под будущий функциональный закон распределения без реализации функции;
- `WindLoadDefinition`: ручной ввод направления и номинального давления, нулевой direction означает отсутствие ветра;
- `comment` для пользовательских сущностей;
- DXF `importMeta`;
- `results`;
- пример минимального JSON;
- правила: Z вверх, координаты в мм, силы в N/kN, моменты в Nmm/kNm, offset по ЛСК Y/Z, `localAxisRotationDeg` вокруг ЛСК X.

## Отдельно зафиксировать

- `Profile` должен явно содержать `JxMm4`, `WxMm3`, `massKgPerM`, `defaultLocalAxisRotationDeg`, `defaultOffsetYmm`, `defaultOffsetZmm`.
- `Member` должен явно описывать override `localAxisRotationDeg`, `offsetYmm`, `offsetZmm`.
- Материал остается свойством элемента (`member.materialId`), не свойством профиля.
- Закрепления хранятся в `restraints[]`, не внутри `Node`.

## Ограничения

- Не менять код, кроме ссылок на документацию, если это уже предусмотрено в проекте.

## Проверки

```bash
cd frontend && npm run build
cd frontend && npm run lint
```
