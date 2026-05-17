from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.cross_sections.router import router as cross_sections_router
from app.materials.router import router as materials_router


DEFAULT_CORS_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
)


def resolve_cors_origins() -> list[str]:
    configured = os.getenv("GRIDENG_CORS_ORIGINS", "")
    if configured.strip():
        return [origin.strip() for origin in configured.split(",") if origin.strip()]

    return list(DEFAULT_CORS_ORIGINS)


app = FastAPI(title="My Product API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=resolve_cors_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(
    cross_sections_router,
    prefix="/api/cross-sections",
)
app.include_router(
    materials_router,
    prefix="/api/materials",
)



@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
