from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.cross_sections.registry import CrossSectionRegistry


router = APIRouter(tags=["cross-sections"])


@lru_cache(maxsize=1)
def get_cross_section_registry() -> CrossSectionRegistry:
    """
    Lazy singleton registry.

    Registry loads local JSON files from:
        backend/app/cross_sections/data/

    The function is cached because the assortment database is static
    during application runtime.
    """
    data_dir = Path(__file__).resolve().parent / "data"
    return CrossSectionRegistry.from_data_dir(data_dir)


@router.get("/standards")
def list_standards() -> list[dict[str, Any]]:
    """
    Return available GOST standards with profile counts.
    """
    registry = get_cross_section_registry()
    return [item.model_dump() for item in registry.list_standards()]


@router.get("/profile-types")
def list_profile_types() -> list[dict[str, Any]]:
    """
    Return available profile types with profile counts.
    """
    registry = get_cross_section_registry()
    return [item.model_dump() for item in registry.list_profile_types()]


@router.get("/catalog")
def list_catalog(
    standard_id: str | None = Query(default=None),
    profile_type: str | None = Query(default=None),
    query: str | None = Query(default=None),
) -> list[dict[str, Any]]:
    """
    Return compact catalog items for frontend selectors.

    Optional filters:
    - standard_id
    - profile_type
    - query
    """
    registry = get_cross_section_registry()

    items = registry.list_catalog_items(
        standard_id=standard_id,
        profile_type=profile_type,
        query=query,
    )

    return [item.model_dump() for item in items]


@router.get("/{profile_id}")
def get_calculated_profile(profile_id: str) -> dict[str, Any]:
    """
    Return full profile data with calculated Crossection parameters.
    """
    registry = get_cross_section_registry()

    try:
        calculated = registry.get_calculated_profile(profile_id)
    except KeyError as exc:
        raise HTTPException(
            status_code=404,
            detail=f"Cross-section profile not found: {profile_id}",
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    return calculated.model_dump()


@router.get("/{profile_id}/dataframe-row")
def get_dataframe_row(profile_id: str) -> dict[str, Any]:
    """
    Return flattened profile row for frontend dataframe usage.
    """
    registry = get_cross_section_registry()

    try:
        return registry.get_dataframe_row(profile_id)
    except KeyError as exc:
        raise HTTPException(
            status_code=404,
            detail=f"Cross-section profile not found: {profile_id}",
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc
