from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_list_cross_section_standards() -> None:
    response = client.get("/api/cross-sections/standards")

    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

    first = data[0]
    assert "id" in first
    assert "name" in first
    assert "title" in first
    assert "profile_count" in first


def test_list_cross_section_profile_types() -> None:
    response = client.get("/api/cross-sections/profile-types")

    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

    first = data[0]
    assert "id" in first
    assert "standard_ids" in first
    assert "standard_names" in first
    assert "profile_count" in first


def test_list_cross_section_catalog() -> None:
    response = client.get("/api/cross-sections/catalog")

    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

    first = data[0]
    assert "id" in first
    assert "standard_id" in first
    assert "standard_name" in first
    assert "profile_type" in first
    assert "gost_number" in first
    assert "designation" in first
    assert "display_name" in first


def test_list_cross_section_catalog_with_standard_filter() -> None:
    response = client.get(
        "/api/cross-sections/catalog",
        params={"standard_id": "gost_8509_93"},
    )

    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

    assert all(item["standard_id"] == "gost_8509_93" for item in data)


def test_list_cross_section_catalog_with_profile_type_filter() -> None:
    response = client.get(
        "/api/cross-sections/catalog",
        params={"profile_type": "angle_equal"},
    )

    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

    assert all(item["profile_type"] == "angle_equal" for item in data)


def test_list_cross_section_catalog_with_query_filter() -> None:
    response = client.get(
        "/api/cross-sections/catalog",
        params={"query": "50x5"},
    )

    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

    assert any("50x5" in item["designation"] for item in data)


def test_get_calculated_cross_section_profile() -> None:
    response = client.get("/api/cross-sections/gost_8509_93_angle_equal_50x5")

    assert response.status_code == 200

    data = response.json()

    assert "catalog_item" in data
    assert "geometry" in data
    assert "calculated" in data
    assert "dataframe_row" in data

    catalog_item = data["catalog_item"]
    assert catalog_item["id"] == "gost_8509_93_angle_equal_50x5"
    assert catalog_item["standard_id"] == "gost_8509_93"
    assert catalog_item["profile_type"] == "angle_equal"
    assert catalog_item["shape_method"] == "LShape"

    geometry = data["geometry"]
    assert geometry["h"] == 50
    assert geometry["b"] == 50
    assert geometry["t"] == 5

    calculated = data["calculated"]
    assert calculated["A"] > 0
    assert calculated["Jx"] > 0
    assert calculated["Jy"] > 0

    dataframe_row = data["dataframe_row"]
    assert dataframe_row["profile_id"] == "gost_8509_93_angle_equal_50x5"
    assert dataframe_row["A"] == calculated["A"]


def test_get_cross_section_dataframe_row() -> None:
    response = client.get(
        "/api/cross-sections/gost_8509_93_angle_equal_50x5/dataframe-row"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["profile_id"] == "gost_8509_93_angle_equal_50x5"
    assert data["standard_id"] == "gost_8509_93"
    assert data["profile_type"] == "angle_equal"

    assert data["A"] > 0


def test_get_unknown_cross_section_profile_returns_404() -> None:
    response = client.get("/api/cross-sections/unknown_profile_id")

    assert response.status_code == 404


def test_get_unknown_dataframe_row_returns_404() -> None:
    response = client.get("/api/cross-sections/unknown_profile_id/dataframe-row")

    assert response.status_code == 404
