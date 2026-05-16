from __future__ import annotations

import pytest

from app.materials import (
    AmbiguousMaterialPropertyError,
    MaterialPropertyNotFoundError,
    Steel,
    get_steel_repository,
    list_steels,
    material_thickness_from_profile,
    product_type_from_profile,
    resolve_steel,
)


def test_repository_loads_materials_database() -> None:
    repo = get_steel_repository()
    assert repo.get("C345").display_name == "С345"
    assert repo.get("С345").key == "C345"
    assert repo.get("Ст3сп").key == "St3sp"


def test_resolve_c345_by_hot_rolled_shape_thickness() -> None:
    resolved = resolve_steel("C345", thickness=12, product_type="hot_rolled_shape")
    assert resolved.key == "C345"
    assert resolved.property.Rt == 325
    assert resolved.property.Rb == 470


def test_list_steels_by_profile_method_and_dimensions() -> None:
    materials = list_steels(profile_method="LShape", dimensions={"h": 100, "b": 100, "t": 8})
    keys = {m.key for m in materials}
    assert "C245" in keys
    assert "C345" in keys


def test_profile_helpers() -> None:
    assert material_thickness_from_profile("IShape", {"h": 200, "b": 100, "s": 5.5, "t": 8}) == 8
    assert product_type_from_profile("IShape") == "hot_rolled_shape"
    assert product_type_from_profile("SquarePipeShape") == "bent_profile"


def test_ambiguous_strength_class_requires_disambiguation() -> None:
    with pytest.raises(AmbiguousMaterialPropertyError):
        resolve_steel("09Г2С", thickness=10, product_type="hot_rolled_shape")

    resolved = resolve_steel("09Г2С", thickness=10, product_type="hot_rolled_shape", strength_class=345)
    assert resolved.key == "09G2S"
    assert resolved.property.strength_class == 345


def test_missing_property_raises() -> None:
    with pytest.raises(MaterialPropertyNotFoundError):
        resolve_steel("C590", thickness=120, product_type="hot_rolled_shape")


def test_legacy_steel_adapter_returns_calculation_material() -> None:
    material = Steel.getSteel("С345", profile_method="LShape", dimensions={"h": 100, "b": 100, "t": 8})
    assert material.name == "C345"
    assert material.Rt == 345
