"""Exceptions for material data access."""

from __future__ import annotations

from collections.abc import Sequence


class MaterialsRepositoryError(Exception):
    """Base exception for material repository errors."""


class MaterialNotFoundError(MaterialsRepositoryError):
    """Raised when a material key, display name, or alias is absent in DB."""


class MaterialPropertyNotFoundError(MaterialsRepositoryError):
    """Raised when no property row matches requested filters."""


class AmbiguousMaterialPropertyError(MaterialsRepositoryError):
    """Raised when several property rows match and no disambiguator is supplied."""

    def __init__(self, material_key: str, matches: Sequence[object]):
        self.material_key = material_key
        self.matches = list(matches)
        ids = ", ".join(getattr(row, "property_id", "<unknown>") for row in self.matches)
        super().__init__(
            f"Material '{material_key}' has {len(matches)} matching property rows: {ids}. "
            "Pass strength_class or property_id, or set ambiguous='weakest'/'strongest'/'first'."
        )
