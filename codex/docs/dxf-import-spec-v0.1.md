# DXF Import Specification v0.1

## Назначение

DXF import v0.1 предназначен для быстрого получения стержневой расчетной схемы из заранее подготовленного DXF-файла.

Мы не реализуем универсальный CAD-импорт. Мы задаем спецификацию исходной DXF-модели.

## Поддерживаемые DXF entities

Поддерживается только:

- `LINE`

Для каждой линии читаются:
- координаты начала `start`;
- координаты конца `end`;
- `color`, если доступен;
- `colorIndex`, если доступен;
- `trueColor`, если доступен;
- `layer`, если доступен;
- `handle`, если доступен.

Канонический frontend-тип:

```ts
type DxfLineEntity = {
  start: Vec3;
  end: Vec3;
  color?: string | number;
  colorIndex?: number;
  trueColor?: string | number;
  layer?: string;
  handle?: string;
};
```

## Игнорируемые entities

Игнорируются:

- `POLYLINE`;
- `LWPOLYLINE`;
- `INSERT`;
- `BLOCK`;
- `TEXT`;
- `MTEXT`;
- `DIMENSION`;
- `HATCH`;
- `ARC`;
- `CIRCLE`;
- `SPLINE`;
- `ELLIPSE`;
- `XREF`;
- layouts.

Дополнительно:
- не выполняется раскрытие `BLOCK`/`INSERT`;
- не выполняется обработка nested entities;
- не выполняется реконструкция полилиний в наборы стержней.

## Геометрические соглашения

- Единицы модели — мм.
- Ось `Z` направлена вверх.
- Одна линия `LINE` соответствует одному стержню.
- Начало и конец линии соответствуют начальному и конечному узлу стержня.
- Локальная ось `X` элемента направлена от начала `LINE` к концу `LINE`.
- Цвет линии используется для группировки стержней по профилям.
- `layer` используется как fallback-признак группировки.
- На этапе `v0.1` нет boolean-обрезки, соединительных фасок и сложной CAD-геометрии.

## Текущий pipeline

Импорт построен как последовательность:

1. `parseDxfLines(dxfText)` — читает только `LINE`;
2. `normalizeDxfCoordinates(...)` — определяет 2D/3D, при необходимости прижимает модель к `XY`, центрирует по `XY`;
3. `mergeDxfNodes(...)` — сливает близкие точки по `toleranceMm`;
4. `convertDxfToGridEngModel(...)` — строит `GridEngModel v0.2`, preview и import metadata.

Все импортируемые данные в итоге приводятся к `GridEngModel v0.2`.

## Параметры импорта

```ts
type DxfImportSettings = {
  toleranceMm: number;
  centerOnXY: boolean;
  force2DToXY: boolean;
};
```

## Tolerance соединения линий

Параметр:

```ts
toleranceMm: number
```

Точки, расстояние между которыми меньше или равно `toleranceMm`, считаются одним узлом.

Рекомендуемое значение по умолчанию:

```text
1 мм
```

Текущая реализация использует spatial hash, а не полный `O(n^2)` проход по всем точкам.

## Проверка 2D/3D

Модель считается 3D, если:

```text
maxZ - minZ > toleranceMm
```

Иначе модель считается 2D.

Если модель 2D и включен параметр `force2DToXY`, всем узлам задается:

```text
Z = 0
```

В preview это отражается как:
- `is3D: boolean`
- `zRange: { min: number; max: number }`

## Центрирование модели

Если включен параметр `centerOnXY`:

```text
X' = X - centerX
Y' = Y - centerY
Z' = Z
```

`Z` не центрируется.

## Color groups

Группировка выполняется по приоритету:

1. trueColor, если задан;
2. colorIndex, если задан;
3. layer, если задан;
4. `UNASSIGNED`, если не задано ничего.

Каждая группа получает временный профиль:

```text
P_COLOR_<key>
```

Имя временного профиля:

```text
DXF <key>
```

Пользователь затем может назначить группе реальный профиль из каталога.

## Висячие стержни

Стержень считается висячим, если хотя бы один его конец имеет степень соединения `1`.

Это warning, а не error.

## Preview импорта

До подтверждения импорта пользователь должен видеть preview со следующими данными:

- `linesCount`
- `ignoredEntitiesCount`
- `is3D`
- `zRange`
- `nodesCount`
- `membersCount`
- `mergedNodesCount`
- `danglingMembersCount`
- `colorGroups`
- `warnings`
- `errors`

Канонический тип:

```ts
type DxfImportPreview = {
  linesCount: number;
  ignoredEntitiesCount: number;
  is3D: boolean;
  zRange: { min: number; max: number };
  nodesCount: number;
  membersCount: number;
  mergedNodesCount: number;
  danglingMembersCount: number;
  colorGroups: DxfColorGroup[];
  warnings: string[];
  errors: string[];
};
```

## Ошибки импорта

`Errors`:
- в файле нет `LINE`;
- DXF parser не смог разобрать файл;
- после merge не удалось сопоставить endpoint с узлом;
- есть стержень нулевой длины после слияния узлов;
- не удалось сформировать валидную `GridEngModel`.

`Warnings`:
- найдены висячие стержни;
- найдены изолированные узлы;
- часть entities проигнорирована;
- модель распознана как 2D;
- validator вернул non-blocking warnings.

## Приведение к GridEngModel v0.2

DXF import создает:
- `nodes[]` и `members[]` на основе `LINE`;
- временные `profiles[]` по color/layer groups;
- default material;
- default `loadCase` c нулевым ветром;
- `importMeta.source = "dxf"`.

Для импортированных элементов сохраняется `source`:

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

На уровне модели сохраняется `importMeta.dxf`, включая:
- `fileName`
- `importedLineCount`
- `skippedEntityCount`
- `hasNonZeroZ`
- `assumedOrientation`
- `toleranceMm`
- `colorProfileMap`
- `layerMap`
- `warnings`

## Console/debug access

После импорта доступны служебные команды:
- `debug.source.member <memberId>` — показывает `DxfEntitySource` конкретного элемента;
- `debug.importMeta` — показывает метаданные последнего импорта;
- `debug.selection` — помогает проверить связь scene/tree selection с импортированными объектами.

## Ограничения v0.1

В этой версии осознанно не поддерживаются:
- `POLYLINE`, `LWPOLYLINE`, `ARC`, `CIRCLE`, `SPLINE`, `TEXT`, `MTEXT` и прочие non-`LINE` примитивы;
- `BLOCK` и `INSERT`;
- автоматическое распознавание профилей по геометрии DXF;
- автоматическое создание материалов;
- boolean-геометрия, подрезки, пластины, отверстия и solid-моделирование;
- DXF как источник готовых нагрузок или закреплений.
