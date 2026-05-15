from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class CrossSectionValidationError(ValueError):
    """Raised when a sortament dataset is structurally invalid."""


class StandardInfo(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    profile_types: list[str] = Field(default_factory=list)


class SourceInfo(BaseModel):
    model_config = ConfigDict(extra="allow")

    file: str | None = None
    table: str | None = None
    basis: str | None = None


class ValidationInfo(BaseModel):
    model_config = ConfigDict(extra="allow")

    status: Literal["pending", "approved", "rejected", "manual", "auto_extracted"] = "pending"
    checked_at: str | None = None
    notes: str | None = None


class ShapeSpec(BaseModel):
    model_config = ConfigDict(extra="forbid")

    method: str = Field(..., min_length=1)
    dimensions_mm: dict[str, float] = Field(..., min_length=1)

    @field_validator("dimensions_mm")
    @classmethod
    def dimensions_must_be_positive(cls, value: dict[str, float]) -> dict[str, float]:
        for key, raw in value.items():
            if not isinstance(key, str) or not key:
                raise ValueError("dimension name must be a non-empty string")
            if not isinstance(raw, (int, float)):
                raise ValueError(f"dimension {key!r} must be numeric")
            if float(raw) < 0:
                raise ValueError(f"dimension {key!r} must be >= 0")
        return {key: float(raw) for key, raw in value.items()}


class CrossSectionProfile(BaseModel):
    """Single normalized profile record inside one ГОСТ dataset."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(..., min_length=1)
    profile_type: str = Field(..., min_length=1)
    gost_number: str = Field(..., min_length=1)
    designation: str = Field(..., min_length=1)
    display_name: str = Field(..., min_length=1)
    shape: ShapeSpec
    series: str | None = None

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


class CrossSectionCatalogItem(BaseModel):
    """Lightweight DTO for catalog/search use before API layer exists."""

    id: str
    standard_id: str
    standard_name: str
    profile_type: str
    gost_number: str
    designation: str
    display_name: str
    shape_method: str
    dimensions_mm: dict[str, float]

    @classmethod
    def from_profile(cls, profile: CrossSectionProfile) -> "CrossSectionCatalogItem":
        if profile.standard is None:
            raise CrossSectionValidationError(f"profile {profile.id} is not attached to a standard")
        return cls(
            id=profile.id,
            standard_id=profile.standard.id,
            standard_name=profile.standard.name,
            profile_type=profile.profile_type,
            gost_number=profile.gost_number,
            designation=profile.designation,
            display_name=profile.display_name,
            shape_method=profile.shape.method,
            dimensions_mm=profile.shape.dimensions_mm,
        )
