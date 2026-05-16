"""Repository for steel material database stored in JSON files."""

from __future__ import annotations

from collections.abc import Iterable
import json
from pathlib import Path

from .exceptions import (
    AmbiguousMaterialPropertyError,
    MaterialNotFoundError,
    MaterialPropertyNotFoundError,
)
from .models import AmbiguousPolicy, ResolvedSteelMaterial, SteelMaterial

PACKAGE_DIR = Path(__file__).resolve().parent
DATA_DIR = PACKAGE_DIR / "data"
STEELS_DB_FILENAME = "materials.steels.json"
STEELS_DB_PATH = DATA_DIR / STEELS_DB_FILENAME


class SteelMaterialRepository:
    """Read-only repository for steel material properties."""

    def __init__(self, database: dict):
        self.database = database
        self.defaults = database.get("defaults") or {}
        self.materials = tuple(
            SteelMaterial.from_dict(item, self.defaults)
            for item in database.get("materials") or ()
        )
        self._index = self._build_index(self.materials)

    @classmethod
    def from_file(cls, path: str | Path = STEELS_DB_PATH) -> "SteelMaterialRepository":
        db_path = Path(path)
        with db_path.open("r", encoding="utf-8") as file:
            return cls(json.load(file))

    @staticmethod
    def _build_index(materials: Iterable[SteelMaterial]) -> dict[str, SteelMaterial]:
        index: dict[str, SteelMaterial] = {}
        for material in materials:
            names = {material.key, material.display_name, *material.aliases}
            for name in names:
                index[name] = material
                index[normalize_steel_key(name)] = material
        return index

    def get(self, name: str) -> SteelMaterial:
        material = self._index.get(name) or self._index.get(normalize_steel_key(name))
        if material is None:
            raise MaterialNotFoundError(f"Material '{name}' was not found")
        return material

    def list_materials(
        self,
        *,
        thickness: float | None = None,
        product_type: str | None = None,
        strength_class: int | None = None,
        standard: str | None = None,
    ) -> list[SteelMaterial]:
        return [
            material
            for material in self.materials
            if any(
                prop.matches(
                    thickness=thickness,
                    product_type=product_type,
                    strength_class=strength_class,
                    standard=standard,
                )
                for prop in material.properties_by_thickness
            )
        ]

    def list_options(
        self,
        *,
        thickness: float | None = None,
        product_type: str | None = None,
        strength_class: int | None = None,
        standard: str | None = None,
    ) -> list[ResolvedSteelMaterial]:
        result: list[ResolvedSteelMaterial] = []
        for material in self.materials:
            for prop in material.properties_by_thickness:
                if prop.matches(
                    thickness=thickness,
                    product_type=product_type,
                    strength_class=strength_class,
                    standard=standard,
                ):
                    result.append(ResolvedSteelMaterial(material, prop))
        return result

    def resolve(
        self,
        name: str,
        *,
        thickness: float,
        product_type: str | None = None,
        strength_class: int | None = None,
        standard: str | None = None,
        property_id: str | None = None,
        ambiguous: AmbiguousPolicy = "raise",
    ) -> ResolvedSteelMaterial:
        material = self.get(name)
        matches = [
            prop
            for prop in material.properties_by_thickness
            if prop.matches(
                thickness=thickness,
                product_type=product_type,
                strength_class=strength_class,
                standard=standard,
            )
        ]
        if property_id is not None:
            matches = [prop for prop in matches if prop.property_id == property_id]

        if not matches:
            raise MaterialPropertyNotFoundError(
                f"Material '{material.key}' has no property row for "
                f"thickness={thickness}, product_type={product_type}, "
                f"strength_class={strength_class}, standard={standard}, property_id={property_id}"
            )

        if len(matches) == 1:
            return ResolvedSteelMaterial(material, matches[0])

        if ambiguous == "first":
            return ResolvedSteelMaterial(material, matches[0])
        if ambiguous == "strongest":
            return ResolvedSteelMaterial(material, max(matches, key=lambda p: (p.Rt, p.Rb)))
        if ambiguous == "weakest":
            return ResolvedSteelMaterial(material, min(matches, key=lambda p: (p.Rt, p.Rb)))

        raise AmbiguousMaterialPropertyError(material.key, matches)


def normalize_steel_key(value: str) -> str:
    """Normalize common Cyrillic steel names to the canonical latin DB key."""
    s = value.strip().replace(" ", "")
    if s.startswith("Ст"):
        suffix = s[2:]
        suffix = suffix.replace("кп", "kp").replace("пс", "ps").replace("сп", "sp")
        return "St" + suffix

    replacements = {
        "А": "A",
        "В": "V",
        "С": "C",
        "Г": "G",
        "Д": "D",
        "К": "K",
        "М": "M",
        "Н": "N",
        "П": "P",
        "Р": "R",
        "Т": "T",
        "Ф": "F",
        "Х": "H",
        "Ю": "Yu",
        "Ч": "Ch",
        "а": "a",
        "в": "v",
        "с": "c",
        "г": "g",
        "д": "d",
        "к": "k",
        "м": "m",
        "н": "n",
        "п": "p",
        "р": "r",
        "т": "t",
        "ф": "f",
        "х": "h",
        "ю": "yu",
        "ч": "ch",
    }
    return "".join(replacements.get(ch, ch) for ch in s)
