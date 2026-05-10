# Project Instructions for Codex

## Current Focus

GridEng is an application for analysis of frame and steel structures.

The main focus of the current stage is the frontend:
- CAD-like interface;
- internal `GridEngModel v0.1`;
- JSON import/export;
- DXF import v0.1;
- 3D scene and visualization modes.

## Work Boundaries

- Do not change `backend/app/lib` without an explicit separate task.
- Do not implement a database at this stage.
- Do not implement permanent backend API contracts prematurely, except the explicitly requested frontend-only section API contract types.
- Any model import must normalize data to `GridEngModel v0.1`.
- Internal JSON model format must remain versioned.
- Do not change the public API without an explicit instruction.

## Frontend Architecture

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

- Do not mix API client, state, and UI in one large frontend component.
- Prefer keeping layout composition in `app/` and reusable domain/UI blocks in `entities/`, `features/`, `widgets/`, and `shared/`.

## DXF Import v0.1

Supported only:
- `LINE`;
- start/end coordinates;
- `color` / `colorIndex` / `trueColor`;
- `layer`;
- `handle`, if available.

Ignored:
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
- `ELLIPSE`;
- `SPLINE`;
- `XREF`;
- layouts;
- any other DXF primitive outside the v0.1 scope.

Geometry conventions:
- model coordinates are in mm;
- global `Z` axis points upward;
- DXF normalization may center the model on the `XY` plane only;
- `Z` is not centered;
- if the model is detected as 2D, it may be forced into the `XY` plane with `Z = 0`;
- close points are merged using `toleranceMm`.

## Model Expectations

`Profile` must support:
- `JxMm4`;
- `WxMm3`;
- `massKgPerM`;
- `defaultLocalAxisRotationDeg`;
- `defaultOffsetYmm`;
- `defaultOffsetZmm`.

`Member` must support overrides:
- `localAxisRotationDeg`;
- `offsetYmm`;
- `offsetZmm`.

Profile rotation is defined around the member local `X` axis.

## Stack

- Frontend: React + TypeScript + Vite, directory `frontend/`.
- Backend: FastAPI, Python 3.10+, directory `backend/`.
- API prefix is not used yet; health endpoint: `GET /health`.

## Commands

- Frontend install: `cd frontend && npm install`
- Frontend dev: `cd frontend && npm run dev`
- Frontend build: `cd frontend && npm run build`
- Frontend lint: `cd frontend && npm run lint`
- Backend venv (PowerShell): `cd backend && .\.venv\Scripts\Activate.ps1`
- Backend dev: `cd backend && fastapi dev app/main.py`
- Backend tests: `cd backend && pytest`

## Working Agreements

- Before editing files, give a short plan and list the files you expect to change.
- For new backend logic, add or update `pytest` tests.
- For frontend tasks that change frontend code, run `cd frontend && npm run build` and `cd frontend && npm run lint`.
- If build or lint cannot be run, or fail due to existing project state, state that explicitly in the report.
- Do not change application code when the task is documentation-only unless explicitly asked.

## Final Report

After each completed task, show:
1. Summary.
2. Changed files.
3. Commands run.
4. Build/lint or other relevant check results.
5. Risks and technical debt.
