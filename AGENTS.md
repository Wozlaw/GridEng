# Project instructions for Codex
## Stack
- Frontend: React + TypeScript + Vite, каталог `frontend/`.
- Backend: FastAPI, Python 3.10+, каталог `backend/`.
- API prefix пока не используется; health endpoint: `GET /health`.
## Commands
- Frontend install: `cd frontend && npm install`
- Frontend dev: `cd frontend && npm run dev`
- Frontend build: `cd frontend && npm run build`
- Backend venv: `cd backend && source .venv/bin/activate`
- Backend dev: `cd backend && fastapi dev app/main.py`
- Backend tests: `cd backend && pytest`
## Working agreements
- Перед правками дай краткий план и перечисли файлы, которые планируешь менять.
- Для новой backend-логики добавляй или обновляй pytest-тесты.
- Для новой frontend-логики не смешивай API-клиент, состояние и UI в одном большом
компоненте.
- Не меняй публичный API без явного указания.
- После завершения покажи summary, тесты и риски.
