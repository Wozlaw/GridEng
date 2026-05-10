# GridEng — дополнительная инструкция для Codex

## Текущий фокус проекта

Основная задача текущего этапа — frontend приложения для расчета стержневых металлоконструкций с прицелом на опоры ЛЭП свыше 35 кВ.

## Границы работ

- Backend расчетное ядро в `backend/app/lib` не менять без отдельного явного задания.
- БД не реализовывать.
- Контракты API не реализовывать преждевременно, кроме типов будущего API расчета характеристик сечений.
- Любой импорт модели должен приводить данные к `GridEngModel v0.1`.
- Внутренний JSON модели должен оставаться версионированным.

## Frontend архитектура

```text
frontend/src/
  app/
    layout/
    providers/
    store/
  entities/
    model/
    section/
  features/
    import-dxf/
    import-json/
    export-json/
    selection/
    view-modes/
  widgets/
    viewport-3d/
    project-tree/
    properties-panel/
  shared/
    math/
    ui/
    utils/
```

## DXF import v0.1

Поддерживается только:
- `LINE`;
- координаты начала и конца;
- color / colorIndex / trueColor;
- layer;
- handle, если доступен.

Игнорируется:
- POLYLINE;
- LWPOLYLINE;
- INSERT;
- BLOCK;
- TEXT;
- MTEXT;
- DIMENSION;
- HATCH;
- ARC;
- CIRCLE;
- ELLIPSE;
- SPLINE;
- XREF;
- layouts.

## Геометрические соглашения

- Координаты модели — в мм.
- Ось Z направлена вверх.
- При нормализации DXF модель центрируется по bbox проекции точек на плоскость XY.
- Z не центрируется.
- Если модель 2D, допускается принудительная ориентация в плоскости XY с `Z = 0`.
- Слияние близких точек выполняется по `toleranceMm`.

## Профили

`Profile` должен поддерживать:
- `JxMm4`;
- `WxMm3`;
- `massKgPerM`;
- `defaultLocalAxisRotationDeg`;
- `defaultOffsetYmm`;
- `defaultOffsetZmm`.

`Member` должен поддерживать override:
- `localAxisRotationDeg`;
- `offsetYmm`;
- `offsetZmm`.

Поворот профиля задается вокруг локальной оси X стержня.

## Отчет после каждой задачи

В конце каждого ответа Codex должен показать:

1. Summary изменений.
2. Список измененных файлов.
3. Какие команды запускались.
4. Результат build/lint.
5. Риски и технический долг.
