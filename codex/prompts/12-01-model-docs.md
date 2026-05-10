# Task 12.1 — GridEngModel documentation

## Задача
Создай документацию `frontend/docs/grideng-model-v0.1.md`.

## Описать
- назначение `GridEngModel`;
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
- windLoad;
- DXF importMeta;
- results;
- пример минимального JSON;
- правила: Z вверх, координаты в мм, силы в N/kN, моменты в Nmm/kNm, offset по ЛСК Y/Z, `localAxisRotationDeg` вокруг ЛСК X.
- `Profile` должен явно содержать `JxMm4`, `WxMm3`, `massKgPerM`, `defaultLocalAxisRotationDeg`, `defaultOffsetYmm`, `defaultOffsetZmm`.
- `Member` должен явно описывать override `localAxisRotationDeg`, `offsetYmm`, `offsetZmm`.
- для `WindLoad` нулевой `direction` означает отсутствие ветра.

Не менять код.
