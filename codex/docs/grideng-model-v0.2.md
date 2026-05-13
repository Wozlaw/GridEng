# GridEngModel v0.2

## Назначение

`GridEngModel v0.2` — текущая каноническая frontend-модель GridEng.

Она используется для:
- runtime-состояния редактора;
- JSON import/export;
- результата DXF import v0.1;
- выбора и редактирования `node/member/load/restraint`;
- визуализации wireframe, real view, loads, moments, restraints, wind и stress-map;
- хранения mock/real analysis results;
- будущей передачи модели в расчетный backend.

## Версия и миграция

- Актуальная версия схемы: `schemaVersion: "0.2"`.
- Runtime принимает legacy `v0.1` JSON только через migration pass.
- После миграции модель проходит через актуальные Zod-схемы и integrity validation.
- Экспорт выполняется только как `v0.2`.

Практические случаи миграции:
- legacy nodal force/moment -> `nodal_concentrated`;
- legacy concentrated member force -> placeholder `member_distributed`;
- legacy concentrated member moment -> placeholder `member_distributed`;
- legacy `units.pressure: "kPa"` -> `"Pa"`;
- legacy `wind.nominalPressureKPa` -> `wind.nominalPressurePa`;
- legacy single `results` object -> нормализуется в `results: AnalysisResults[]`.

## Верхнеуровневая структура

```ts
type GridEngModel = {
  schemaVersion: "0.2";
  name: string;
  units: ModelUnits;
  settings: ModelSettings;
  nodes: Node[];
  members: Member[];
  profiles: Profile[];
  materials: Material[];
  restraints: Restraint[];
  loadCases: LoadCase[];
  importMeta?: ImportMeta;
  results?: AnalysisResults[];
};
```

Ключевые правила:
- `Node` не хранит нагрузки или закрепления внутри себя;
- закрепления живут в `restraints[]`;
- нагрузки живут в `loadCases[].loads`;
- материал задаётся на `Member` через `materialId`, а не на `Profile`;
- `results` хранится как массив по `loadCaseId`, а не как одиночный объект.

## Единицы

| Величина | Поле |
|---|---|
| Длина | `units.length` |
| Сила | `units.force` |
| Момент | `units.moment` |
| Напряжение | `units.stress` |
| Давление | `units.pressure` |
| Масса | `units.mass` |

В текущем sample/runtime проект использует:
- длина: `mm`
- сила: `N`
- момент: `Nmm`
- напряжение: `MPa`
- давление: `Pa`
- масса: `kg`

## Координатная система

- Глобальная ось `Z` направлена вверх.
- Координаты узлов хранятся в мм.
- `model.settings.verticalAxis` в текущей итерации фиксирован как `Z`.
- При DXF import может использоваться центрирование только по `XY`.
- Локальная ось `X` элемента направлена от `startNodeId` к `endNodeId`.
- `localAxisRotationDeg` задаёт поворот профиля вокруг локальной оси `X`.
- `offsetYmm` и `offsetZmm` задают эксцентриситет по локальным `Y/Z`.

## Базовые типы

### Vec3

```ts
type Vec3 = { x: number; y: number; z: number };
```

### ForceVector и MomentVector

```ts
type ForceVector = Vec3;
type MomentVector = Vec3;
```

Обе сущности хранятся в глобальных координатах. Отдельного локального load-CS в `v0.2` нет.

## Основные сущности

### Node

```ts
type Node = {
  id: string;
  position: Vec3;
  label?: string;
  comment?: string;
  source?: SourceRef;
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
  groupId?: string;
  label?: string;
  comment?: string;
  source?: SourceRef;
};
```

`Member` может переопределять профильные дефолты:
- `localAxisRotationDeg`
- `offsetYmm`
- `offsetZmm`

### Profile

```ts
type Profile = {
  id: string;
  name: string;
  kind: ProfileKind;
  params: Record<string, number>;
  comment?: string;
  defaultLocalAxisRotationDeg: number;
  defaultOffsetYmm: number;
  defaultOffsetZmm: number;
  massKgPerM?: number;
  section: {
    areaMm2?: number;
    IyMm4?: number;
    IzMm4?: number;
    JxMm4?: number;
    WyMm3?: number;
    WzMm3?: number;
    WxMm3?: number;
  };
  color?: string;
};
```

Обязательные для договорённости поля профиля:
- `JxMm4`
- `WxMm3`
- `massKgPerM`
- `defaultLocalAxisRotationDeg`
- `defaultOffsetYmm`
- `defaultOffsetZmm`

`Profile` не хранит `materialId`.

### Material

```ts
type Material = {
  id: string;
  name: string;
  comment?: string;
  elasticModulusMPa?: number;
  shearModulusMPa?: number;
  poissonRatio?: number;
  densityKgPerM3?: number;
  yieldStrengthMPa?: number;
};
```

### Restraint

```ts
type Restraint = {
  id: string;
  nodeId: string;
  comment?: string;
  ux: boolean;
  uy: boolean;
  uz: boolean;
  rx: boolean;
  ry: boolean;
  rz: boolean;
};
```

Закрепления живут отдельным массивом `restraints[]`, а не внутри `Node`.

## LoadCase, loads и ветер

```ts
type LoadCase = {
  id: string;
  name: string;
  comment?: string;
  loads: Load[];
  wind: WindLoadDefinition;
};
```

### WindLoadDefinition

```ts
type WindLoadDefinition = {
  direction: Vec3;
  nominalPressurePa: number;
  comment?: string;
};
```

Правила:
- ненулевой `direction` хранится нормализованным;
- нулевой `direction` означает, что ветер отключен;
- нормативный wind calculator в этой итерации не реализуется.

## Нагрузки v0.2

В `v0.2` нагрузки живут внутри `loadCases[].loads` и имеют явный discriminated union `Load`.

### Nodal concentrated load

```ts
type NodalConcentratedLoad = {
  id: string;
  type: "nodal_concentrated";
  kind: "force" | "moment";
  name: string;
  comment?: string;
  coordinateSystem: "global";
  direction: Vec3;
  target: { type: "node"; nodeId: string };
  magnitude: number;
};
```

### Member distributed load

```ts
type MemberDistributedLoad = {
  id: string;
  type: "member_distributed";
  kind: "force" | "moment";
  name: string;
  comment?: string;
  coordinateSystem: "global";
  direction: Vec3;
  target: { type: "member"; memberId: string };
  distribution:
    | {
        type: "linear";
        qStart: number;
        qEnd: number;
        xStartRel?: number;
        xEndRel?: number;
      }
    | {
        type: "function";
        expression: string;
        variables?: Record<string, number>;
        comment?: string;
      };
};
```

Поддержано в UI/scene сейчас:
- `nodal_concentrated`;
- `member_distributed` c `distribution.type === "linear"`;
- representative-visualization для распределённых нагрузок.

Пока остаётся placeholder:
- `member_distributed` с `distribution.type === "function"`;
- полноценная визуализация distributed `moment`.

## DXF source и importMeta

Для сущностей, пришедших из DXF, сохраняется `source`:

```ts
type DxfEntitySource = {
  source: "dxf";
  entityType: "LINE";
  color?: string | number;
  colorIndex?: number;
  trueColor?: string | number;
  layer?: string;
  handle?: string;
};
```

На уровне модели может храниться:

```ts
type ImportMeta = {
  source: "dxf" | "json" | "manual";
  dxf?: {
    fileName: string;
    importedLineCount: number;
    skippedEntityCount: number;
    hasNonZeroZ: boolean;
    assumedOrientation: "xy" | "3d";
    toleranceMm: number;
    colorProfileMap: Record<string, string>;
    layerMap: Record<string, string>;
    warnings: string[];
  };
};
```

Это используется для:
- DXF preview/debug;
- `debug.source.member`;
- `debug.importMeta`;
- повторного анализа tolerance/grouping metadata.

## Results

В `v0.2` результаты расчёта хранятся как массив:

```ts
type AnalysisResults = {
  loadCaseId: string;
  nodeDisplacements: Record<
    string,
    { ux: number; uy: number; uz: number; rx: number; ry: number; rz: number }
  >;
  memberForces: Record<
    string,
    { n?: number; qy?: number; qz?: number; mx?: number; my?: number; mz?: number }
  >;
  memberStresses: Record<
    string,
    { sigmaMaxMPa?: number; utilization?: number }
  >;
};
```

Правила:
- один объект `AnalysisResults` относится к одному `loadCaseId`;
- `results?: AnalysisResults[]` может отсутствовать полностью;
- legacy single-result JSON нормализуется в массив;
- stress-map в UI использует `utilization`, а если его нет, fallback на `sigmaMaxMPa`.

## Validation

Текущий validator проверяет:
- schema errors;
- duplicate ids;
- missing references;
- zero-length members;
- hanging members;
- isolated nodes;
- invalid direction;
- invalid distributed range;
- zero magnitude loads;
- reserved function placeholders.

Результат имеет вид:

```ts
type ModelValidationResult = {
  ok: boolean;
  errors: ModelValidationIssue[];
  warnings: ModelValidationIssue[];
  issues: ModelValidationIssue[];
};
```

## Минимальный пример

```json
{
  "schemaVersion": "0.2",
  "name": "Sample model",
  "units": {
    "length": "mm",
    "force": "N",
    "moment": "Nmm",
    "stress": "MPa",
    "pressure": "Pa",
    "mass": "kg"
  },
  "settings": {
    "nodeMergeToleranceMm": 1,
    "centerModelByXYProjection": true,
    "verticalAxis": "Z"
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
      "materialId": "MAT1",
      "localAxisRotationDeg": 0,
      "offsetYmm": 0,
      "offsetZmm": 0
    }
  ],
  "profiles": [
    {
      "id": "P1",
      "name": "L90x6",
      "kind": "L_equal",
      "params": { "b": 90, "t": 6 },
      "defaultLocalAxisRotationDeg": 0,
      "defaultOffsetYmm": 0,
      "defaultOffsetZmm": 0,
      "massKgPerM": 8.1,
      "section": {
        "areaMm2": 1030,
        "IyMm4": 789000,
        "IzMm4": 312000,
        "JxMm4": 13800,
        "WyMm3": 17600,
        "WzMm3": 7000,
        "WxMm3": 2300
      }
    }
  ],
  "materials": [
    {
      "id": "MAT1",
      "name": "Steel C245",
      "elasticModulusMPa": 206000,
      "poissonRatio": 0.3,
      "densityKgPerM3": 7850,
      "yieldStrengthMPa": 245
    }
  ],
  "restraints": [],
  "loadCases": [
    {
      "id": "LC1",
      "name": "LC1",
      "loads": [
        {
          "id": "load-1",
          "type": "nodal_concentrated",
          "kind": "force",
          "name": "Top load",
          "coordinateSystem": "global",
          "direction": { "x": 0, "y": 0, "z": -1 },
          "target": { "type": "node", "nodeId": "N2" },
          "magnitude": 1000
        }
      ],
      "wind": {
        "direction": { "x": 0, "y": 0, "z": 0 },
        "nominalPressurePa": 0
      }
    }
  ],
  "importMeta": {
    "source": "manual"
  },
  "results": [
    {
      "loadCaseId": "LC1",
      "nodeDisplacements": {
        "N2": { "ux": 0, "uy": 0, "uz": -2.4, "rx": 0, "ry": 0, "rz": 0 }
      },
      "memberForces": {
        "M1": { "n": 1000, "qy": 0, "qz": 0, "mx": 0, "my": 0, "mz": 0 }
      },
      "memberStresses": {
        "M1": { "sigmaMaxMPa": 42.5, "utilization": 0.31 }
      }
    }
  ]
}
```
