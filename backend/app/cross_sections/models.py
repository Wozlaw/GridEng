from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class CrossSectionValidationError(ValueError):
    """Raised when a sortament dataset or profile is structurally invalid."""


class StandardInfo(BaseModel):
    """Metadata for one standard. One JSON file contains one standard."""

    model_config = ConfigDict(extra="allow")

    id: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    profile_types: list[str] = Field(default_factory=list)


class SourceInfo(BaseModel):
    """Source metadata for a dataset file."""

    model_config = ConfigDict(extra="allow")

    file: str | None = None
    table: str | None = None
    basis: str | None = None
    notes: str | None = None


class ValidationInfo(BaseModel):
    """Validation status for a whole dataset."""

    model_config = ConfigDict(extra="allow")

    status: Literal["pending", "approved", "rejected", "manual", "auto_extracted"] = "pending"
    checked_at: str | None = None
    notes: str | None = None


class ShapeSpec(BaseModel):
    """Shape-constructor specification for Crossection factory."""

    model_config = ConfigDict(extra="forbid")

    method: str = Field(..., min_length=1)
    dimensions_mm: dict[str, float] = Field(..., min_length=1)

    @field_validator("dimensions_mm")
    @classmethod
    def dimensions_must_be_numeric_and_valid(cls, value: dict[str, float]) -> dict[str, float]:
        zero_allowed = {"delta", "r"}
        normalized: dict[str, float] = {}
        for key, raw in value.items():
            if not isinstance(key, str) or not key:
                raise ValueError("dimension name must be a non-empty string")
            if not isinstance(raw, (int, float)):
                raise ValueError(f"dimension {key!r} must be numeric")

            number = float(raw)
            if key in zero_allowed:
                if number < 0:
                    raise ValueError(f"dimension {key!r} must be >= 0")
            elif number <= 0:
                raise ValueError(f"dimension {key!r} must be > 0")
            normalized[key] = number
        return normalized


class CrossSectionProfile(BaseModel):
    """Single normalized profile record inside one ГОСТ dataset."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(..., min_length=1)
    profile_type: str = Field(..., min_length=1)
    gost_number: str = Field(..., min_length=1)
    designation: str = Field(..., min_length=1)
    display_name: str = Field(..., min_length=1)
    # Optional profile subtype marker, currently used by ГОСТ 8240-97 швеллеры: У, П, Э, Л, С.
    series: str | None = None
    shape: ShapeSpec

    # Enriched by registry at load time. These fields are intentionally absent in JSON elements.
    standard: StandardInfo | None = None
    dataset_id: str | None = None


class CrossSectionDataset(BaseModel):
    """One file = one ГОСТ standard and its profiles."""

    model_config = ConfigDict(extra="forbid")

    schema_version: str = Field(..., min_length=1)
    dataset_id: str = Field(..., min_length=1)
    generated_at: str | None = None
    unit_system: str = "mm"
    storage_policy: str | dict[str, Any] | None = None
    standard: StandardInfo
    source: SourceInfo = Field(default_factory=SourceInfo)
    validation: ValidationInfo = Field(default_factory=ValidationInfo)
    profiles: list[CrossSectionProfile] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_dataset(self) -> "CrossSectionDataset":
        if self.unit_system != "mm":
            raise ValueError("only unit_system='mm' is supported by the current data layer")
        if not self.profiles:
            raise ValueError("dataset must contain at least one profile")
        ids: set[str] = set()
        for profile in self.profiles:
            if profile.id in ids:
                raise ValueError(f"duplicate profile id inside dataset: {profile.id}")
            ids.add(profile.id)
            profile.standard = self.standard
            profile.dataset_id = self.dataset_id
        return self


class StandardCatalogItem(BaseModel):
    """DTO for future GET /cross-sections/standards."""

    id: str
    name: str
    title: str
    dataset_id: str
    profile_types: list[str]
    profile_count: int

    @classmethod
    def from_dataset(cls, dataset: CrossSectionDataset) -> "StandardCatalogItem":
        actual_types = sorted({profile.profile_type for profile in dataset.profiles})
        return cls(
            id=dataset.standard.id,
            name=dataset.standard.name,
            title=dataset.standard.title,
            dataset_id=dataset.dataset_id,
            profile_types=actual_types,
            profile_count=len(dataset.profiles),
        )


class ProfileTypeCatalogItem(BaseModel):
    """DTO for future GET /cross-sections/profile-types."""

    id: str
    profile_count: int
    standard_ids: list[str]
    standard_names: list[str]


class CrossSectionCatalogItem(BaseModel):
    """Lightweight DTO for catalog/search use before API layer exists."""

    id: str
    standard_id: str
    standard_name: str
    dataset_id: str
    profile_type: str
    series: str | None = None
    gost_number: str
    designation: str
    display_name: str
    shape_method: str
    dimensions_mm: dict[str, float]

    @classmethod
    def from_profile(cls, profile: CrossSectionProfile) -> "CrossSectionCatalogItem":
        if profile.standard is None or profile.dataset_id is None:
            raise CrossSectionValidationError(f"profile {profile.id} is not attached to a dataset/standard")
        return cls(
            id=profile.id,
            standard_id=profile.standard.id,
            standard_name=profile.standard.name,
            dataset_id=profile.dataset_id,
            profile_type=profile.profile_type,
            series=profile.series,
            gost_number=profile.gost_number,
            designation=profile.designation,
            display_name=profile.display_name,
            shape_method=profile.shape.method,
            dimensions_mm=profile.shape.dimensions_mm,
        )


class CalculatedProfile(BaseModel):
    """DTO for future GET /cross-sections/{profile_id}."""

    catalog_item: CrossSectionCatalogItem
    geometry: dict[str, float]
    calculated: dict[str, float | str]
    dataframe_row: dict[str, Any]
