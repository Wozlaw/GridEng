from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path
from typing import Any, Iterable

from .factory import CrossSectionFactory
from .models import (
    CalculatedProfile,
    CrossSectionCatalogItem,
    CrossSectionDataset,
    CrossSectionProfile,
    CrossSectionValidationError,
    ProfileTypeCatalogItem,
    StandardCatalogItem,
)


class CrossSectionRegistry:
    """In-memory registry for local JSON sortament files."""

    def __init__(self, datasets: Iterable[CrossSectionDataset]):
        self.datasets: list[CrossSectionDataset] = sorted(list(datasets), key=lambda dataset: dataset.standard.id)
        self._by_profile_id: dict[str, CrossSectionProfile] = {}
        self._by_standard_id: dict[str, CrossSectionDataset] = {}
        self._build_indexes()

    @classmethod
    def from_data_dir(cls, data_dir: str | Path, pattern: str = "profiles.gost_*.json") -> "CrossSectionRegistry":
        path = Path(data_dir)
        if not path.exists():
            raise FileNotFoundError(f"cross-section data dir not found: {path}")
        files = sorted(path.glob(pattern))
        if not files:
            raise FileNotFoundError(f"no sortament JSON files found in {path} by pattern {pattern!r}")
        return cls(cls._load_dataset(file) for file in files)

    @staticmethod
    def _load_dataset(path: Path) -> CrossSectionDataset:
        with path.open("r", encoding="utf-8") as fh:
            raw = json.load(fh)
        try:
            return CrossSectionDataset.model_validate(raw)
        except Exception as exc:
            raise CrossSectionValidationError(f"invalid dataset file {path}: {exc}") from exc

    def _build_indexes(self) -> None:
        for dataset in self.datasets:
            if dataset.standard.id in self._by_standard_id:
                raise CrossSectionValidationError(f"duplicate standard id: {dataset.standard.id}")
            self._by_standard_id[dataset.standard.id] = dataset
            for profile in dataset.profiles:
                if profile.id in self._by_profile_id:
                    raise CrossSectionValidationError(f"duplicate profile id: {profile.id}")
                self._by_profile_id[profile.id] = profile
                CrossSectionFactory.validate_shape_spec(profile)

    def list_standards(self) -> list[StandardCatalogItem]:
        """Return standards with profile counts. Future API: GET /cross-sections/standards."""
        return [StandardCatalogItem.from_dataset(dataset) for dataset in self.datasets]

    def get_standard(self, standard_id: str) -> StandardCatalogItem:
        try:
            dataset = self._by_standard_id[standard_id]
        except KeyError as exc:
            raise KeyError(f"cross-section standard not found: {standard_id}") from exc
        return StandardCatalogItem.from_dataset(dataset)

    def list_profile_types(self, *, standard_id: str | None = None) -> list[ProfileTypeCatalogItem]:
        """Return available profile types with counts. Future API: GET /cross-sections/profile-types."""
        grouped: dict[str, dict[str, Any]] = defaultdict(lambda: {"count": 0, "standard_ids": set(), "standard_names": set()})
        for profile in self._by_profile_id.values():
            standard = profile.standard
            if standard is None:
                continue
            if standard_id is not None and standard.id != standard_id:
                continue
            item = grouped[profile.profile_type]
            item["count"] += 1
            item["standard_ids"].add(standard.id)
            item["standard_names"].add(standard.name)

        return [
            ProfileTypeCatalogItem(
                id=profile_type,
                profile_count=payload["count"],
                standard_ids=sorted(payload["standard_ids"]),
                standard_names=sorted(payload["standard_names"]),
            )
            for profile_type, payload in sorted(grouped.items())
        ]

    def list_catalog_items(
        self,
        *,
        standard_id: str | None = None,
        profile_type: str | None = None,
        query: str | None = None,
    ) -> list[CrossSectionCatalogItem]:
        """Return lightweight profile catalog items. Future API: GET /cross-sections/catalog."""
        query_lc = query.lower() if query else None
        result: list[CrossSectionCatalogItem] = []
        for profile in self._by_profile_id.values():
            standard = profile.standard
            if standard is None:
                continue
            if standard_id is not None and standard.id != standard_id:
                continue
            if profile_type is not None and profile.profile_type != profile_type:
                continue
            if query_lc is not None:
                haystack = " ".join(
                    [
                        profile.id,
                        profile.gost_number,
                        profile.designation,
                        profile.display_name,
                        profile.profile_type,
                        standard.id,
                        standard.name,
                        profile.series or "",
                    ]
                ).lower()
                if query_lc not in haystack:
                    continue
            result.append(CrossSectionCatalogItem.from_profile(profile))
        return sorted(result, key=lambda item: (item.standard_id, item.profile_type, item.gost_number, item.designation))

    # Backward-compatible alias used by the existing tests/code.
    def list_profiles(
        self,
        *,
        standard_id: str | None = None,
        profile_type: str | None = None,
        query: str | None = None,
    ) -> list[CrossSectionCatalogItem]:
        return self.list_catalog_items(standard_id=standard_id, profile_type=profile_type, query=query)

    def get_profile(self, profile_id: str) -> CrossSectionProfile:
        try:
            return self._by_profile_id[profile_id]
        except KeyError as exc:
            raise KeyError(f"cross-section profile not found: {profile_id}") from exc

    def get_catalog_item(self, profile_id: str) -> CrossSectionCatalogItem:
        return CrossSectionCatalogItem.from_profile(self.get_profile(profile_id))

    def build_crossection(self, profile_id: str, *, res: float | None = None):
        return CrossSectionFactory.build(self.get_profile(profile_id), res=res)

    def calculate_params(self, profile_id: str, *, res: float | None = None) -> dict[str, float | str]:
        return CrossSectionFactory.calculate_params(self.get_profile(profile_id), res=res)

    def get_dataframe_row(self, profile_id: str, *, res: float | None = None) -> dict[str, Any]:
        """Return a flat row suitable for frontend dataframe/state storage."""
        catalog_item = self.get_catalog_item(profile_id)
        calculated = self.calculate_params(profile_id, res=res)
        return {
            "profile_id": catalog_item.id,
            "standard_id": catalog_item.standard_id,
            "standard_name": catalog_item.standard_name,
            "dataset_id": catalog_item.dataset_id,
            "profile_type": catalog_item.profile_type,
            "series": catalog_item.series,
            "gost_number": catalog_item.gost_number,
            "designation": catalog_item.designation,
            "display_name": catalog_item.display_name,
            "shape_method": catalog_item.shape_method,
            **calculated,
        }

    def get_calculated_profile(self, profile_id: str, *, res: float | None = None) -> CalculatedProfile:
        """Return geometry + calculated params + frontend dataframe row for one profile."""
        catalog_item = self.get_catalog_item(profile_id)
        calculated = self.calculate_params(profile_id, res=res)
        dataframe_row = {
            "profile_id": catalog_item.id,
            "standard_id": catalog_item.standard_id,
            "standard_name": catalog_item.standard_name,
            "dataset_id": catalog_item.dataset_id,
            "profile_type": catalog_item.profile_type,
            "series": catalog_item.series,
            "gost_number": catalog_item.gost_number,
            "designation": catalog_item.designation,
            "display_name": catalog_item.display_name,
            "shape_method": catalog_item.shape_method,
            **calculated,
        }
        return CalculatedProfile(
            catalog_item=catalog_item,
            geometry=catalog_item.dimensions_mm,
            calculated=calculated,
            dataframe_row=dataframe_row,
        )

    def validate_build_all(self, *, res: float | None = None) -> list[dict[str, str]]:
        """Build every profile and calculate params. Returns errors; empty list means OK."""
        errors: list[dict[str, str]] = []
        for profile_id in sorted(self._by_profile_id):
            try:
                self.calculate_params(profile_id, res=res)
            except Exception as exc:  # intentionally broad for smoke validation report
                errors.append({"profile_id": profile_id, "error": str(exc)})
        return errors

    def summary(self) -> dict[str, int | dict[str, int]]:
        by_standard = {dataset.standard.id: len(dataset.profiles) for dataset in self.datasets}
        by_type: dict[str, int] = {}
        for profile in self._by_profile_id.values():
            by_type[profile.profile_type] = by_type.get(profile.profile_type, 0) + 1
        return {
            "standards": len(self.datasets),
            "profiles": len(self._by_profile_id),
            "profile_types": len(by_type),
            "by_standard": by_standard,
            "by_type": by_type,
        }
