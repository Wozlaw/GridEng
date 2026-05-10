# Task 11.1 — Analysis result types

## Задача
Добавь типы результатов расчета в `frontend/src/entities/model/results.ts`.

## Типы
- `NodeDisplacement`: `ux, uy, uz, rx, ry, rz`.
- `MemberForces`: optional `n, qy, qz, mx, my, mz`.
- `MemberStresses`: optional `sigmaMaxMPa, utilization`.
- `AnalysisResults`: `loadCaseId`, `nodeDisplacements`, `memberForces`, `memberStresses`.

## Требования
- Добавить `results?: AnalysisResults[]` в `GridEngModel`.
- Обновить Zod schema.
- Обновить sample model с mock results для нескольких стержней.

## Проверки
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
