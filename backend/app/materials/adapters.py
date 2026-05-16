"""Adapters for legacy calculation classes."""

from __future__ import annotations

from typing import Any

from .models import AmbiguousPolicy
from .service import (
    list_steels,
    material_thickness_from_profile,
    product_type_from_profile,
    resolve_steel,
)


class Steel:
    """Compatibility adapter for the former app.lib.Crossection.Steel API."""

    @staticmethod
    def getSteeltList(
        thickness: float | None = None,
        product_type: str | None = None,
        profile_method: str | None = None,
        dimensions: dict[str, float] | None = None,
        strength_class: int | None = None,
        standard: str | None = None,
    ) -> list[str]:
        return [
            material.key
            for material in list_steels(
                thickness=thickness,
                product_type=product_type,
                profile_method=profile_method,
                dimensions=dimensions,
                strength_class=strength_class,
                standard=standard,
            )
        ]

    @staticmethod
    def getSteelList(*args: Any, **kwargs: Any) -> list[str]:
        """Correct spelling alias."""
        return Steel.getSteeltList(*args, **kwargs)

    @staticmethod
    def getSteel(
        name: str,
        thickness: float | None = None,
        product_type: str | None = None,
        profile_method: str | None = None,
        dimensions: dict[str, float] | None = None,
        strength_class: int | None = None,
        standard: str | None = None,
        property_id: str | None = None,
        ambiguous: AmbiguousPolicy = "weakest",
        material_cls: type | None = None,
        use_display_name: bool = False,
    ) -> Any:
        """Resolve steel and return CalculationMaterial or passed calculation material class."""
        resolved = resolve_steel(
            name,
            thickness=thickness,
            product_type=product_type,
            profile_method=profile_method,
            dimensions=dimensions,
            strength_class=strength_class,
            standard=standard,
            property_id=property_id,
            ambiguous=ambiguous,
        )
        return resolved.to_calculation_material(material_cls, use_display_name=use_display_name)


__all__ = [
    "Steel",
    "material_thickness_from_profile",
    "product_type_from_profile",
]
