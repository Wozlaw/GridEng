from pathlib import Path

from app.cross_sections.registry import CrossSectionRegistry
from app.cross_sections.factory import CrossSectionFactory


def test_registry_loads_all_datasets():
    data_dir = Path(__file__).resolve().parents[1] / "app" / "cross_sections" / "data"
    registry = CrossSectionRegistry.from_data_dir(data_dir)
    summary = registry.summary()

    json_files_count = len(list(data_dir.glob("profiles.gost_*.json")))

    assert summary["standards"] == json_files_count
    assert summary["profiles"] > 0


def test_catalog_search_and_build_smoke():
    data_dir = Path(__file__).resolve().parents[1] / "app" / "cross_sections" / "data"
    registry = CrossSectionRegistry.from_data_dir(data_dir)
    items = registry.list_profiles(query="50x5")
    assert any(item.id == "gost_8509_93_angle_equal_50x5" for item in items)
    params = registry.calculate_params("gost_8509_93_angle_equal_50x5")
    assert params["A"] > 0
    assert params["axis"] == "XY"


def test_all_profiles_build():
    data_dir = Path(__file__).resolve().parents[1] / "app" / "cross_sections" / "data"
    registry = CrossSectionRegistry.from_data_dir(data_dir)
    assert registry.validate_build_all() == []
