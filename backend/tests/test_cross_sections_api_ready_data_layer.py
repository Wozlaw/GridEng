from pathlib import Path

from app.cross_sections.registry import CrossSectionRegistry


def _registry() -> CrossSectionRegistry:
    data_dir = Path(__file__).resolve().parents[1] / "app" / "cross_sections" / "data"
    return CrossSectionRegistry.from_data_dir(data_dir)


def test_registry_loads_json_files_without_hardcoded_counts():
    data_dir = Path(__file__).resolve().parents[1] / "app" / "cross_sections" / "data"
    registry = CrossSectionRegistry.from_data_dir(data_dir)
    summary = registry.summary()
    json_files_count = len(list(data_dir.glob("profiles.gost_*.json")))
    assert summary["standards"] == json_files_count
    assert summary["profiles"] > 0
    assert summary["profile_types"] > 0


def test_standards_profile_types_and_catalog_items():
    registry = _registry()
    standards = registry.list_standards()
    profile_types = registry.list_profile_types()
    catalog = registry.list_catalog_items(query="50")

    assert standards
    assert profile_types
    assert catalog
    assert all(item.profile_count > 0 for item in standards)
    assert all(item.profile_count > 0 for item in profile_types)


def test_calculated_profile_contract():
    registry = _registry()
    first = registry.list_catalog_items()[0]
    calculated = registry.get_calculated_profile(first.id)

    assert calculated.catalog_item.id == first.id
    assert calculated.geometry
    assert calculated.calculated["A"] > 0
    assert calculated.calculated["axis"] == "XY"
    assert calculated.dataframe_row["profile_id"] == first.id
    assert calculated.dataframe_row["standard_id"] == first.standard_id
    assert calculated.dataframe_row["display_name"] == first.display_name


def test_all_profiles_build():
    registry = _registry()
    assert registry.validate_build_all() == []
