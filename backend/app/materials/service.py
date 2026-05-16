"""Service helpers over the material repository."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from .models import AmbiguousPolicy, ResolvedSteelMaterial, SteelMaterial
from .repository import STEELS_DB_PATH, SteelMaterialRepository


@lru_cache(maxsize=1)
def get_steel_repository(path: str | Path = STEELS_DB_PATH) -> SteelMaterialRepository:
    """Return cached read-only steel repository."""
    return SteelMaterialRepository.from_file(path)


def reset_steel_repository_cache() -> None:
    """Clear repository cache; mainly for tests and dev reloads."""
    get_steel_repository.cache_clear()


def list_steels(
    *,
    thickness: float | None = None,
    product_type: str | None = None,
    profile_method: str | None = None,
    dimensions: dict[str, float] | None = None,
    strength_class: int | None = None,
    standard: str | None = None,
) -> list[SteelMaterial]:
    """List canonical steel grades filtered by profile/material constraints."""
    resolved_product_type, resolved_thickness = _resolve_profile_filters(
        product_type=product_type,
        thickness=thickness,
        profile_method=profile_method,
        dimensions=dimensions,
    )
    return get_steel_repository().list_materials(
        thickness=resolved_thickness,
        product_type=resolved_product_type,
        strength_class=strength_class,
        standard=standard,
    )


def list_steel_options(
    *,
    thickness: float | None = None,
    product_type: str | None = None,
    profile_method: str | None = None,
    dimensions: dict[str, float] | None = None,
    strength_class: int | None = None,
    standard: str | None = None,
) -> list[ResolvedSteelMaterial]:
    """List concrete property rows filtered by profile/material constraints."""
    resolved_product_type, resolved_thickness = _resolve_profile_filters(
        product_type=product_type,
        thickness=thickness,
        profile_method=profile_method,
        dimensions=dimensions,
    )
    return get_steel_repository().list_options(
        thickness=resolved_thickness,
        product_type=resolved_product_type,
        strength_class=strength_class,
        standard=standard,
    )


def resolve_steel(
    name: str,
    *,
    thickness: float | None = None,
    product_type: str | None = None,
    profile_method: str | None = None,
    dimensions: dict[str, float] | None = None,
    strength_class: int | None = None,
    standard: str | None = None,
    property_id: str | None = None,
    ambiguous: AmbiguousPolicy = "raise",
) -> ResolvedSteelMaterial:
    """Resolve a canonical steel grade to a calculation-ready property row."""
    resolved_product_type, resolved_thickness = _resolve_profile_filters(
        product_type=product_type,
        thickness=thickness,
        profile_method=profile_method,
        dimensions=dimensions,
    )
    if resolved_thickness is None:
        raise ValueError("thickness or profile_method + dimensions is required to resolve steel")

    return get_steel_repository().resolve(
        name,
        thickness=resolved_thickness,
        product_type=resolved_product_type,
        strength_class=strength_class,
        standard=standard,
        property_id=property_id,
        ambiguous=ambiguous,
    )


def material_thickness_from_profile(method_name: str, dimensions: dict[str, float]) -> float:
    """Return representative material thickness by Crossection shape method."""
    if method_name in {"LShape", "LBendShape", "PipeShape", "SquarePipeShape"}:
        return float(dimensions["t"])
    if method_name == "CBendShape":
        return float(dimensions["s"])
    if method_name in {"CShape", "IShape", "TShape"}:
        return float(max(dimensions["s"], dimensions["t"]))
    if method_name == "RectShape":
        return float(min(dimensions["h"], dimensions.get("b", dimensions["h"])))
    if method_name == "CircleShape":
        return float(dimensions["D"])
    if method_name == "HexShape":
        return float(dimensions["h"])
    raise ValueError(f"Unsupported profile method '{method_name}'")


def product_type_from_profile(method_name: str) -> str:
    """Map Crossection shape method to material database product_type."""
    if method_name in {"LBendShape", "CBendShape", "SquarePipeShape", "PipeShape"}:
        return "bent_profile"
    if method_name in {"LShape", "CShape", "IShape", "TShape"}:
        return "hot_rolled_shape"
    if method_name in {"CircleShape", "RectShape", "HexShape"}:
        return "bar"
    raise ValueError(f"Unsupported profile method '{method_name}'")


def _resolve_profile_filters(
    *,
    product_type: str | None,
    thickness: float | None,
    profile_method: str | None,
    dimensions: dict[str, float] | None,
) -> tuple[str | None, float | None]:
    if profile_method is None:
        return product_type, thickness

    resolved_product_type = product_type or product_type_from_profile(profile_method)
    resolved_thickness = thickness
    if resolved_thickness is None and dimensions is not None:
        resolved_thickness = material_thickness_from_profile(profile_method, dimensions)
    return resolved_product_type, resolved_thickness
