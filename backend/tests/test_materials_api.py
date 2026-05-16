from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.materials.router import router as materials_router
from app.materials.service import reset_steel_repository_cache


def build_test_client() -> TestClient:
    app = FastAPI()
    app.include_router(materials_router, prefix="/api")
    return TestClient(app)


def setup_function() -> None:
    reset_steel_repository_cache()


def test_list_steels_returns_canonical_materials() -> None:
    client = build_test_client()

    response = client.get("/api/materials/steels")

    assert response.status_code == 200
    payload = response.json()
    keys = {item["key"] for item in payload}
    assert "C345" in keys
    assert "St3sp" in keys
    assert any(item["key"] == "C345" and item["display_name"] == "С345" for item in payload)


def test_get_steel_by_cyrillic_alias_returns_canonical_entry() -> None:
    client = build_test_client()

    response = client.get("/api/materials/steels/С345")

    assert response.status_code == 200
    payload = response.json()
    assert payload["key"] == "C345"
    assert payload["display_name"] == "С345"
    assert payload["properties_by_thickness"]
    assert all("Rt" in prop and "Rb" in prop for prop in payload["properties_by_thickness"])


def test_resolve_steel_by_query_params_for_sheet_thickness() -> None:
    client = build_test_client()

    response = client.get(
        "/api/materials/steels/C345/resolve",
        params={"thickness": 12, "product_type": "sheet"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload == {
        "name": "C345",
        "Rt": 325.0,
        "Rb": 470.0,
        "E": 206000.0,
        "G": 79000.0,
        "alpha": 0.000012,
        "rho": 7850.0,
    }


def test_resolve_steel_by_profile_derives_hot_rolled_shape_thickness() -> None:
    client = build_test_client()

    response = client.post(
        "/api/materials/steels/resolve-by-profile",
        json={
            "name": "C345",
            "profile_method": "LShape",
            "dimensions": {"h": 50, "b": 50, "t": 5},
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["name"] == "C345"
    assert payload["Rt"] == 345.0
    assert payload["Rb"] == 480.0


def test_options_by_profile_filters_materials_for_profile_thickness() -> None:
    client = build_test_client()

    response = client.post(
        "/api/materials/steels/options-by-profile",
        json={
            "profile_method": "LShape",
            "dimensions": {"h": 50, "b": 50, "t": 5},
        },
    )

    assert response.status_code == 200
    payload = response.json()
    keys = {item["key"] for item in payload}
    assert "C245" in keys
    assert "C345" in keys
    assert all("hot_rolled_shape" in item["property"]["product_types"] for item in payload)


def test_ambiguous_material_returns_409_with_matches() -> None:
    client = build_test_client()

    response = client.get(
        "/api/materials/steels/09G2S/resolve",
        params={"thickness": 20, "product_type": "hot_rolled_shape"},
    )

    assert response.status_code == 409
    payload = response.json()["detail"]
    assert payload["material_key"] == "09G2S"
    assert len(payload["matches"]) > 1


def test_ambiguous_material_can_be_resolved_by_strength_class() -> None:
    client = build_test_client()

    response = client.post(
        "/api/materials/steels/resolve",
        json={
            "name": "09Г2С",
            "thickness": 20,
            "product_type": "hot_rolled_shape",
            "strength_class": 345,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["name"] == "09G2S"
    assert payload["Rt"] == 345.0
    assert payload["Rb"] == 480.0


def test_unknown_material_returns_404() -> None:
    client = build_test_client()

    response = client.get("/api/materials/steels/UNKNOWN_STEEL")

    assert response.status_code == 404
    assert "was not found" in response.json()["detail"]


def test_unsupported_profile_returns_422() -> None:
    client = build_test_client()

    response = client.post(
        "/api/materials/steels/resolve-by-profile",
        json={
            "name": "C345",
            "profile_method": "UnknownShape",
            "dimensions": {"t": 5},
        },
    )

    assert response.status_code == 422
    assert "Unsupported profile method" in response.json()["detail"]
