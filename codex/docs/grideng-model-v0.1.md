# GridEngModel v0.1

## Назначение

`GridEngModel` — внутренняя каноническая модель frontend приложения GridEng.

Она используется для:
- отображения конструкции в CAD-like интерфейсе;
- импорта/экспорта JSON;
- результата DXF-импорта;
- будущей передачи модели в расчетный backend;
- сохранения моделей в библиотечную БД на следующих этапах.

## Единицы измерения

| Величина | Единица |
|---|---|
| Длина | мм |
| Сила | N или kN |
| Момент | Nmm или kNm |
| Напряжение | MPa |
| Давление ветра | kPa |
| Масса погонная | kg/m |
| Площадь сечения | mm² |
| Моменты инерции | mm⁴ |
| Моменты сопротивления | mm³ |

## Координатная система

- Глобальная ось `Z` направлена вверх.
- Координаты узлов хранятся в мм.
- При импорте DXF модель может центрироваться по проекции узлов на плоскость `XY`.
- `Z` при центрировании не смещается.

## Основные сущности

### Vec3

```ts
type Vec3 = { x: number; y: number; z: number };
```

### ForceVector

```ts
type ForceVector = { fx: number; fy: number; fz: number; unit: "N" | "kN" };
```

### MomentVector

```ts
type MomentVector = { mx: number; my: number; mz: number; unit: "Nmm" | "kNm" };
```

### Restraint

```ts
type Restraint = {
  ux: boolean;
  uy: boolean;
  uz: boolean;
  rx: boolean;
  ry: boolean;
  rz: boolean;
};
```

### Node

```ts
type Node = {
  id: string;
  position: Vec3;
  force?: ForceVector;
  moment?: MomentVector;
  restraint?: Restraint;
};
```

### Member

```ts
type Member = {
  id: string;
  startNodeId: string;
  endNodeId: string;
  profileId: string;
  materialId: string;
  localAxisRotationDeg?: number;
  offsetYmm?: number;
  offsetZmm?: number;
  source?: DxfEntitySource;
};
```

`localAxisRotationDeg` — поворот сечения вокруг локальной оси `X` стержня. Локальная ось `X` направлена от начального узла к конечному.

`offsetYmm` и `offsetZmm` задают смещение сечения относительно расчетной оси стержня по локальным осям `Y` и `Z`.

### DxfEntitySource

```ts
type DxfEntitySource = {
  entityType: "LINE";
  color?: number | string;
  colorIndex?: number;
  trueColor?: number | string;
  layer?: string;
  handle?: string;
};
```

### Profile

```ts
type Profile = {
  id: string;
  name: string;
  kind: "L" | "U" | "I" | "pipe" | "rect" | "custom";
  params: Record<string, number>;
  areaMm2?: number;
  IyMm4?: number;
  IzMm4?: number;
  JxMm4?: number;
  WyMm3?: number;
  WzMm3?: number;
  WxMm3?: number;
  massKgPerM?: number;
  defaultLocalAxisRotationDeg?: number;
  defaultOffsetYmm?: number;
  defaultOffsetZmm?: number;
  color?: string;
};
```

### WindLoad

```ts
type WindLoad = {
  direction: Vec3;
  nominalPressureKPa: number;
  comment?: string;
};
```

Нулевой вектор направления ветра означает отсутствие ветровой нагрузки.

## Минимальный пример JSON

```json
{
  "schemaVersion": "0.1",
  "name": "Sample model",
  "units": {
    "length": "mm",
    "force": "N",
    "moment": "Nmm",
    "stress": "MPa",
    "windPressure": "kPa"
  },
  "nodes": [
    { "id": "N1", "position": { "x": 0, "y": 0, "z": 0 } },
    { "id": "N2", "position": { "x": 1000, "y": 0, "z": 0 } }
  ],
  "members": [
    {
      "id": "M1",
      "startNodeId": "N1",
      "endNodeId": "N2",
      "profileId": "P1",
      "materialId": "S245"
    }
  ],
  "profiles": [
    {
      "id": "P1",
      "name": "L50x5",
      "kind": "L",
      "params": { "b": 50, "h": 50, "t": 5 },
      "JxMm4": 0,
      "WxMm3": 0,
      "massKgPerM": 3.77
    }
  ],
  "materials": [
    {
      "id": "S245",
      "name": "Steel С245",
      "densityKgM3": 7850,
      "elasticModulusMPa": 206000,
      "shearModulusMPa": 79000,
      "poissonRatio": 0.3
    }
  ],
  "loadCases": [
    {
      "id": "LC1",
      "name": "Default",
      "wind": {
        "direction": { "x": 0, "y": 0, "z": 0 },
        "nominalPressureKPa": 0
      }
    }
  ]
}
```
