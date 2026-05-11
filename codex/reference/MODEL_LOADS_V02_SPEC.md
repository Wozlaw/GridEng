# Спецификация модели нагрузок GridEngModel v0.2

## Цель

Расширить текущую `GridEngModel v0.1`, где `LoadCase.loads` содержит только `ConcentratedLoad` с `vector.force` и `vector.moment`, до модели, пригодной для пользовательского редактирования узловых и стержневых нагрузок.

## Версия схемы

Рекомендуемое решение: поднять `GridEngModel.schemaVersion` до `'0.2'`.

Импорт JSON должен принимать старую `'0.1'` модель и мигрировать ее в `'0.2'` без потери данных.

## Базовые типы

```ts
export type LoadCoordinateSystem = 'global';
export type LoadKind = 'force' | 'moment';
export type LoadType = 'nodal_concentrated' | 'member_distributed';
export type LoadDistributionType = 'linear' | 'function';

export interface LoadBase {
  id: Id;
  type: LoadType;
  kind: LoadKind;
  name: string;
  comment?: string;
  coordinateSystem: LoadCoordinateSystem; // only 'global' in this iteration
  direction: Vec3; // normalized non-zero global vector
}
```

## Узловая сосредоточенная нагрузка

```ts
export interface NodalConcentratedLoad extends LoadBase {
  type: 'nodal_concentrated';
  target: { type: 'node'; nodeId: Id };
  magnitude: number; // model.units.force if kind='force'; model.units.moment if kind='moment'
}
```

## Распределенная нагрузка по стержню

```ts
export interface LinearLoadDistribution {
  type: 'linear';
  qStart: number; // force/length or moment/length depending on load.kind
  qEnd: number;
  xStartRel?: number; // default 0, range [0, 1]
  xEndRel?: number;   // default 1, range [0, 1]
}

export interface FunctionLoadDistributionReserved {
  type: 'function';
  expression: string;
  variables?: Record<string, number>;
  comment?: string;
}

export interface MemberDistributedLoad extends LoadBase {
  type: 'member_distributed';
  target: { type: 'member'; memberId: Id };
  distribution: LinearLoadDistribution | FunctionLoadDistributionReserved;
}
```

В этой итерации UI создает и редактирует только `distribution.type === 'linear'`.

`function` допускается как зарезервированная структура, но не должна иметь редактор и не должна участвовать в расчете/визуализации кроме безопасного placeholder-сообщения.

## Итоговый тип

```ts
export type Load = NodalConcentratedLoad | MemberDistributedLoad;

export interface LoadCase {
  id: Id;
  name: string;
  comment?: string;
  loads: Load[];
  wind: WindLoadDefinition;
}
```

## Миграция v0.1 → v0.2

Старый формат:

```ts
export interface ConcentratedLoad {
  id: Id;
  target: LoadTarget;
  vector: ForceMomentVector;
  description?: string;
}
```

Правила миграции:

1. Если `vector.force` ненулевой, создать `NodalConcentratedLoad`/сосредоточенную нагрузку с `kind: 'force'`, `direction = normalize(vector.force)`, `magnitude = length(vector.force)`.
2. Если `vector.moment` ненулевой, создать отдельную нагрузку с `kind: 'moment'`.
3. Если одновременно force и moment ненулевые — разделить на две нагрузки, чтобы новая модель соблюдала `kind` как пользовательскую сущность.
4. Если обе компоненты нулевые — сохранить как force-нагрузку с direction `{x:0,y:0,z:1}`, magnitude `0`, но добавить warning в миграцию/validation.
5. `description` переносить в `comment`, а `name` формировать как `Нагрузка {n}` или по description, если оно короткое и человекочитаемое.
6. Если старый target был `member`, мигрировать в `NodalConcentratedLoad` нельзя. На этот случай создать `MemberDistributedLoad` нельзя автоматически. Сохранять как unsupported legacy concentrated member load не надо. Лучше создать warning и мигрировать в сосредоточенную нагрузку на member только если будет введен отдельный тип. В этой итерации Codex должен проверить фактическое использование старого `target.member` и выбрать безопасную совместимость.

## Хелперы

Создать хелперы, чтобы не дублировать математику в UI/scene/API:

- `normalizeVec3(vec): Vec3 | null`;
- `vec3Length(vec): number`;
- `scaleVec3(vec, factor): Vec3`;
- `resolveConcentratedLoadVector(load): ForceMomentVector`;
- `resolveDistributedLoadVectors(load): { start: Vec3; end: Vec3 }`;
- `getLoadUnits(load, units): string`.

## Валидация

- `direction` должен быть ненулевым для ненулевых нагрузок.
- `coordinateSystem` пока только `'global'`.
- `xStartRel/xEndRel` в диапазоне `[0, 1]`, `xStartRel < xEndRel`.
- `qStart/qEnd` допускаются отрицательными: знак можно использовать для направления, но предпочтительно задавать знак через направление и положительный модуль. Если допускаешь отрицательные значения, явно показывай это в UI.
- target node/member должен существовать.
- `name` не должен быть пустым; при пустом вводе ставить fallback.
