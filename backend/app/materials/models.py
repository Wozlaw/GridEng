"""Domain models for steel material JSON database."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal


ProductType = Literal[
    "sheet",
    "wide_flat",
    "bent_profile",
    "hot_rolled_shape",
    "bar",
]

AmbiguousPolicy = Literal["raise", "first", "strongest", "weakest"]


@dataclass(frozen=True)
class CalculationMaterial:
    """Small DTO compatible with the calculation layer material fields."""

    name: str
    Rt: float
    Rb: float
    E: float
    G: float
    alpha: float
    rho: float

    def as_dict(self) -> dict[str, float | str]:
        return {
            "name": self.name,
            "Rt": self.Rt,
            "Rb": self.Rb,
            "E": self.E,
            "G": self.G,
            "alpha": self.alpha,
            "rho": self.rho,
        }


@dataclass(frozen=True)
class ThicknessRange:
    """Inclusive/exclusive thickness interval in millimeters."""

    min: float | None = None
    max: float | None = None
    min_inclusive: bool = True
    max_inclusive: bool = True

    @classmethod
    def from_dict(cls, data: dict[str, Any] | None) -> "ThicknessRange":
        data = data or {}
        return cls(
            min=data.get("min"),
            max=data.get("max"),
            min_inclusive=bool(data.get("min_inclusive", True)),
            max_inclusive=bool(data.get("max_inclusive", True)),
        )

    def contains(self, value: float | None) -> bool:
        if value is None:
            return False
        if self.min is not None:
            if value < self.min if self.min_inclusive else value <= self.min:
                return False
        if self.max is not None:
            if value > self.max if self.max_inclusive else value >= self.max:
                return False
        return True

    def as_dict(self) -> dict[str, float | bool | None]:
        return {
            "min": self.min,
            "max": self.max,
            "min_inclusive": self.min_inclusive,
            "max_inclusive": self.max_inclusive,
        }


@dataclass(frozen=True)
class SteelProperty:
    """One normative property row for a material and thickness/product interval."""

    property_id: str
    product_types: tuple[str, ...]
    thickness: ThicknessRange
    Rt: float
    Rb: float
    E: float
    G: float
    alpha: float
    rho: float
    strength_class: int | None = None
    sources: tuple[dict[str, Any], ...] = field(default_factory=tuple)
    raw: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(
        cls,
        material_key: str,
        index: int,
        data: dict[str, Any],
        defaults: dict[str, Any],
    ) -> "SteelProperty":
        return cls(
            property_id=str(data.get("property_id") or f"{material_key}_{index:03d}"),
            product_types=tuple(data.get("product_types") or ()),
            thickness=ThicknessRange.from_dict(data.get("thickness")),
            Rt=float(data["Rt"]),
            Rb=float(data["Rb"]),
            E=float(data.get("E", defaults["E"])),
            G=float(data.get("G", defaults["G"])),
            alpha=float(data.get("alpha", defaults["alpha"])),
            rho=float(data.get("rho", defaults["rho"])),
            strength_class=data.get("strength_class"),
            sources=tuple(data.get("sources") or ()),
            raw=dict(data),
        )

    def matches(
        self,
        *,
        thickness: float | None = None,
        product_type: str | None = None,
        strength_class: int | None = None,
        standard: str | None = None,
    ) -> bool:
        if thickness is not None and not self.thickness.contains(float(thickness)):
            return False
        if product_type is not None and product_type not in self.product_types:
            return False
        if strength_class is not None and self.strength_class != strength_class:
            return False
        if standard is not None and not any(src.get("standard") == standard for src in self.sources):
            return False
        return True

    def as_dict(self) -> dict[str, Any]:
        return {
            "property_id": self.property_id,
            "strength_class": self.strength_class,
            "product_types": list(self.product_types),
            "thickness": self.thickness.as_dict(),
            "Rt": self.Rt,
            "Rb": self.Rb,
            "E": self.E,
            "G": self.G,
            "alpha": self.alpha,
            "rho": self.rho,
            "sources": list(self.sources),
        }


@dataclass(frozen=True)
class SteelMaterial:
    """Canonical steel grade with all available normative property rows."""

    key: str
    display_name: str
    aliases: tuple[str, ...]
    kind: str | None
    resolver_policy: str | None
    properties_by_thickness: tuple[SteelProperty, ...]
    raw: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: dict[str, Any], defaults: dict[str, Any]) -> "SteelMaterial":
        key = str(data["key"])
        props = tuple(
            SteelProperty.from_dict(key, i, prop, defaults)
            for i, prop in enumerate(data.get("properties_by_thickness") or (), start=1)
        )
        return cls(
            key=key,
            display_name=str(data.get("display_name", key)),
            aliases=tuple(data.get("aliases") or ()),
            kind=data.get("kind"),
            resolver_policy=data.get("resolver_policy"),
            properties_by_thickness=props,
            raw=dict(data),
        )

    def as_dict(self) -> dict[str, Any]:
        return {
            "key": self.key,
            "display_name": self.display_name,
            "aliases": list(self.aliases),
            "kind": self.kind,
            "resolver_policy": self.resolver_policy,
            "properties_by_thickness": [p.as_dict() for p in self.properties_by_thickness],
        }


@dataclass(frozen=True)
class ResolvedSteelMaterial:
    """Concrete material property row selected for calculation."""

    material: SteelMaterial
    property: SteelProperty

    @property
    def key(self) -> str:
        return self.material.key

    @property
    def display_name(self) -> str:
        return self.material.display_name

    def to_calculation_material(self, material_cls: type | None = None, *, use_display_name: bool = False) -> Any:
        name = self.display_name if use_display_name else self.key
        args = (
            name,
            self.property.Rt,
            self.property.Rb,
            self.property.E,
            self.property.G,
            self.property.alpha,
            self.property.rho,
        )
        if material_cls is not None:
            return material_cls(*args)
        return CalculationMaterial(*args)

    def to_crossection_material_kwargs(self, *, use_display_name: bool = False) -> dict[str, Any]:
        """Return kwargs compatible with current app.lib.Crossection.Material."""
        name = self.display_name if use_display_name else self.key
        return {
            "name": name,
            "Rt": self.property.Rt,
            "Rb": self.property.Rb,
            "E": self.property.E,
            "G": self.property.G,
            "alpha": self.property.alpha,
            "rho": self.property.rho,
            "α": self.property.alpha,
            "ρ": self.property.rho,
        }

    def as_dict(self) -> dict[str, Any]:
        return {
            "key": self.key,
            "display_name": self.display_name,
            **self.property.as_dict(),
        }
