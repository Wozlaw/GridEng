from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

from .factory import CrossSectionFactory
from .models import (
    CrossSectionCatalogItem,
    CrossSectionDataset,
    CrossSectionProfile,
    CrossSectionValidationError,
    StandardInfo,
)


class CrossSectionRegistry:
    """In-memory registry for local JSON sortament files."""

    def __init__(self, datasets: Iterable[CrossSectionDataset]):
        self.datasets: list[CrossSectionDataset] = list(datasets)
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
            dataset = CrossSectionDataset.model_validate(raw)
        except Exception as exc:
            raise CrossSectionValidationError(f"invalid dataset file {path}: {exc}") from exc
        return dataset

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

    def list_standards(self) -> list[StandardInfo]:
        return [dataset.standard for dataset in self.datasets]

    def list_profiles(
        self,
        *,
        standard_id: str | None = None,
        profile_type: str | None = None,
        query: str | None = None,
    ) -> list[CrossSectionCatalogItem]:
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
                    [profile.id, profile.gost_number, profile.designation, profile.display_name, standard.name]
                ).lower()
                if query_lc not in haystack:
                    continue
            result.append(CrossSectionCatalogItem.from_profile(profile))
        return sorted(result, key=lambda item: (item.standard_id, item.profile_type, item.gost_number, item.designation))

    def get_profile(self, profile_id: str) -> CrossSectionProfile:
        try:
            return self._by_profile_id[profile_id]
        except KeyError as exc:
            raise KeyError(f"cross-section profile not found: {profile_id}") from exc

    def build_crossection(self, profile_id: str, *, res: float | None = None):
        return CrossSectionFactory.build(self.get_profile(profile_id), res=res)

    def calculate_params(self, profile_id: str, *, res: float | None = None) -> dict[str, float | str]:
        return CrossSectionFactory.calculate_params(self.get_profile(profile_id), res=res)

    def validate_build_all(self, *, res: float | None = None) -> list[dict[str, str]]:
        """Build every profile and calculate params. Returns a list of errors; empty list means OK."""
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
            "by_standard": by_standard,
            "by_type": by_type,
        }
