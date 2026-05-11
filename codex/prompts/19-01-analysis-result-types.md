# Task 19.1 — Analysis result types

## Задача

Добавь типы результатов расчета в `frontend/src/entities/model/results.ts`.

## Типы

- `NodeDisplacement`: `ux`, `uy`, `uz`, `rx`, `ry`, `rz`.
- `MemberForces`: optional `n`, `qy`, `qz`, `mx`, `my`, `mz`.
- `MemberStresses`: optional `sigmaMaxMPa`, `utilization`.
- `AnalysisResults`: `loadCaseId`, `nodeDisplacements`, `memberForces`, `memberStresses`.

## Требования

- Добавить `results?: AnalysisResults[]` в `GridEngModel` без отката модели нагрузок v0.2.
- Обновить Zod schema.
- Обновить sample model с mock results для нескольких стержней.
- Согласовать `loadCaseId` с текущей структурой `loadCases` после задач 10.x.

## Проверки

```bash
cd frontend && npm run build
cd frontend && npm run lint
```
