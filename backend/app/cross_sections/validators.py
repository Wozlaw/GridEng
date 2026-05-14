from __future__ import annotations

from pathlib import Path

from .registry import CrossSectionRegistry


def validate_data_dir(data_dir: str | Path, *, build_all: bool = True, res: float | None = None) -> dict:
    """Validate all sortament JSON files in data_dir and optionally build all Crossection objects."""
    registry = CrossSectionRegistry.from_data_dir(data_dir)
    build_errors = registry.validate_build_all(res=res) if build_all else []
    return {
        "ok": not build_errors,
        "summary": registry.summary(),
        "build_errors": build_errors,
    }
