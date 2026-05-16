"""FastAPI router for steel material database.

The router intentionally lives inside ``app.materials`` so the API layer can
include it the same way as domain routers such as ``cross_sections``::

    from app.materials.router import router as materials_router
    app.include_router(materials_router, prefix="/api")

Expected public base path after integration: ``/api/materials``.
"""

from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field

from . import (
    AmbiguousMaterialPropertyError,
    MaterialNotFoundError,
    MaterialPropertyNotFoundError,
    ProductType,
    ResolvedSteelMaterial,
    SteelMaterial,
    get_steel_repository,
    list_steel_options,
    list_steels,
    resolve_steel,
)

router = APIRouter(prefix="/materials", tags=["materials"])
HTTP_422 = getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422)


class ThicknessRangeResponse(BaseModel):
    """Thickness interval in millimeters."""

    min: float | None = None
    max: float | None = None
    min_inclusive: bool = True
    max_inclusive: bool = True


class SourceResponse(BaseModel):
    """Normative source reference for a material property row."""

    model_config = ConfigDict(extra="allow")

    standard: str | None = None
    table: str | None = None
    note: str | None = None


class SteelPropertyResponse(BaseModel):
    """Concrete calculation properties for a steel and thickness/product range."""

    property_id: str
    strength_class: int | None = None
    product_types: list[str]
    thickness: ThicknessRangeResponse
    Rt: float = Field(description="Design/yield resistance, MPa")
    Rb: float = Field(description="Ultimate tensile resistance, MPa")
    E: float = Field(description="Elastic modulus, MPa")
    G: float = Field(description="Shear modulus, MPa")
    alpha: float = Field(description="Thermal expansion coefficient, 1/C")
    rho: float = Field(description="Density, kg/m3")
    sources: list[SourceResponse] = Field(default_factory=list)


class SteelSummaryResponse(BaseModel):
    """Canonical steel grade summary."""

    key: str
    display_name: str
    aliases: list[str] = Field(default_factory=list)
    kind: str | None = None
    resolver_policy: str | None = None


class SteelResponse(SteelSummaryResponse):
    """Canonical steel grade with all available property rows."""

    properties_by_thickness: list[SteelPropertyResponse]


class ResolvedSteelResponse(BaseModel):
    """Concrete material option selected for calculation."""

    key: str
    display_name: str
    property: SteelPropertyResponse


class CalculationMaterialResponse(BaseModel):
    """Material DTO compatible with the calculation layer."""

    name: str
    Rt: float
    Rb: float
    E: float
    G: float
    alpha: float
    rho: float


class ResolveSteelRequest(BaseModel):
    """Request for resolving a steel grade by explicit thickness."""

    name: str = Field(description="Steel key, display name, or alias, e.g. C345, С345, 09Г2С")
    thickness: float = Field(gt=0, description="Representative material thickness, mm")
    product_type: ProductType | None = None
    strength_class: int | None = None
    standard: str | None = None
    property_id: str | None = None
    ambiguous: Literal["raise", "first", "strongest", "weakest"] = "raise"
    use_display_name: bool = False


class ResolveSteelByProfileRequest(BaseModel):
    """Request for resolving a steel grade by Crossection profile method and dimensions."""

    name: str = Field(description="Steel key, display name, or alias")
    profile_method: str = Field(description="Crossection method name, e.g. LShape, IShape, PipeShape")
    dimensions: dict[str, float] = Field(description="Profile dimensions in millimeters")
    product_type: ProductType | None = None
    thickness: float | None = Field(default=None, gt=0, description="Override representative thickness, mm")
    strength_class: int | None = None
    standard: str | None = None
    property_id: str | None = None
    ambiguous: Literal["raise", "first", "strongest", "weakest"] = "raise"
    use_display_name: bool = False


class SteelOptionsByProfileRequest(BaseModel):
    """Request for listing material options suitable for a selected profile."""

    profile_method: str = Field(description="Crossection method name")
    dimensions: dict[str, float] = Field(description="Profile dimensions in millimeters")
    product_type: ProductType | None = None
    thickness: float | None = Field(default=None, gt=0, description="Override representative thickness, mm")
    strength_class: int | None = None
    standard: str | None = None


class ErrorResponse(BaseModel):
    detail: str


class AmbiguousSteelErrorResponse(BaseModel):
    detail: str
    material_key: str
    matches: list[SteelPropertyResponse]


@router.get(
    "/steels",
    response_model=list[SteelSummaryResponse],
    summary="List steel grades",
)
def api_list_steels(
    thickness: float | None = Query(default=None, gt=0),
    product_type: ProductType | None = None,
    strength_class: int | None = None,
    standard: str | None = None,
) -> list[SteelSummaryResponse]:
    """Return canonical steel grades, optionally filtered by thickness/product constraints."""
    materials = list_steels(
        thickness=thickness,
        product_type=product_type,
        strength_class=strength_class,
        standard=standard,
    )
    return [_steel_summary_response(item) for item in materials]


@router.get(
    "/steels/options",
    response_model=list[ResolvedSteelResponse],
    summary="List concrete steel property options",
)
def api_list_steel_options(
    thickness: float | None = Query(default=None, gt=0),
    product_type: ProductType | None = None,
    strength_class: int | None = None,
    standard: str | None = None,
) -> list[ResolvedSteelResponse]:
    """Return concrete property rows matching explicit thickness/product filters."""
    options = list_steel_options(
        thickness=thickness,
        product_type=product_type,
        strength_class=strength_class,
        standard=standard,
    )
    return [_resolved_response(item) for item in options]


@router.post(
    "/steels/options-by-profile",
    response_model=list[ResolvedSteelResponse],
    responses={422: {"model": ErrorResponse}},
    summary="List steel options suitable for a selected profile",
)
def api_list_steel_options_by_profile(request: SteelOptionsByProfileRequest) -> list[ResolvedSteelResponse]:
    """Return concrete property rows after resolving representative profile thickness."""
    try:
        options = list_steel_options(
            thickness=request.thickness,
            product_type=request.product_type,
            profile_method=request.profile_method,
            dimensions=request.dimensions,
            strength_class=request.strength_class,
            standard=request.standard,
        )
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=HTTP_422, detail=str(exc)) from exc
    return [_resolved_response(item) for item in options]


@router.get(
    "/steels/{name}",
    response_model=SteelResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Get steel grade",
)
def api_get_steel(name: str) -> SteelResponse:
    """Return a canonical steel grade with all available thickness-dependent rows."""
    try:
        return _steel_response(get_steel_repository().get(name))
    except MaterialNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get(
    "/steels/{name}/options",
    response_model=list[ResolvedSteelResponse],
    responses={404: {"model": ErrorResponse}},
    summary="List property options for one steel grade",
)
def api_get_steel_options(
    name: str,
    thickness: float | None = Query(default=None, gt=0),
    product_type: ProductType | None = None,
    strength_class: int | None = None,
    standard: str | None = None,
) -> list[ResolvedSteelResponse]:
    """Return property rows for one steel grade after optional filters."""
    try:
        material = get_steel_repository().get(name)
    except MaterialNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    options = [
        ResolvedSteelMaterial(material, prop)
        for prop in material.properties_by_thickness
        if prop.matches(
            thickness=thickness,
            product_type=product_type,
            strength_class=strength_class,
            standard=standard,
        )
    ]
    return [_resolved_response(item) for item in options]


@router.get(
    "/steels/{name}/resolve",
    response_model=CalculationMaterialResponse,
    responses={
        404: {"model": ErrorResponse},
        409: {"model": AmbiguousSteelErrorResponse},
        422: {"model": ErrorResponse},
    },
    summary="Resolve steel by explicit thickness",
)
def api_resolve_steel(
    name: str,
    thickness: float = Query(gt=0),
    product_type: ProductType | None = None,
    strength_class: int | None = None,
    standard: str | None = None,
    property_id: str | None = None,
    ambiguous: Literal["raise", "first", "strongest", "weakest"] = "raise",
    use_display_name: bool = False,
) -> CalculationMaterialResponse:
    """Resolve a steel grade to the calculation-layer Material fields."""
    return _resolve_to_calculation_response(
        name=name,
        thickness=thickness,
        product_type=product_type,
        strength_class=strength_class,
        standard=standard,
        property_id=property_id,
        ambiguous=ambiguous,
        use_display_name=use_display_name,
    )


@router.post(
    "/steels/resolve",
    response_model=CalculationMaterialResponse,
    responses={
        404: {"model": ErrorResponse},
        409: {"model": AmbiguousSteelErrorResponse},
        422: {"model": ErrorResponse},
    },
    summary="Resolve steel by explicit request body",
)
def api_resolve_steel_post(request: ResolveSteelRequest) -> CalculationMaterialResponse:
    """Resolve a steel grade by explicit thickness using a JSON body."""
    return _resolve_to_calculation_response(**request.model_dump())


@router.post(
    "/steels/resolve-by-profile",
    response_model=CalculationMaterialResponse,
    responses={
        404: {"model": ErrorResponse},
        409: {"model": AmbiguousSteelErrorResponse},
        422: {"model": ErrorResponse},
    },
    summary="Resolve steel by selected profile",
)
def api_resolve_steel_by_profile(request: ResolveSteelByProfileRequest) -> CalculationMaterialResponse:
    """Resolve a steel grade after deriving representative thickness/product type from profile."""
    try:
        resolved = resolve_steel(
            request.name,
            thickness=request.thickness,
            product_type=request.product_type,
            profile_method=request.profile_method,
            dimensions=request.dimensions,
            strength_class=request.strength_class,
            standard=request.standard,
            property_id=request.property_id,
            ambiguous=request.ambiguous,
        )
        return CalculationMaterialResponse(
            **resolved.to_calculation_material(use_display_name=request.use_display_name).as_dict()
        )
    except MaterialNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except MaterialPropertyNotFoundError as exc:
        raise HTTPException(status_code=HTTP_422, detail=str(exc)) from exc
    except AmbiguousMaterialPropertyError as exc:
        raise _ambiguous_http_exception(exc) from exc
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=HTTP_422, detail=str(exc)) from exc


def _resolve_to_calculation_response(**kwargs: Any) -> CalculationMaterialResponse:
    use_display_name = bool(kwargs.pop("use_display_name", False))
    try:
        resolved = resolve_steel(**kwargs)
        return CalculationMaterialResponse(
            **resolved.to_calculation_material(use_display_name=use_display_name).as_dict()
        )
    except MaterialNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except MaterialPropertyNotFoundError as exc:
        raise HTTPException(status_code=HTTP_422, detail=str(exc)) from exc
    except AmbiguousMaterialPropertyError as exc:
        raise _ambiguous_http_exception(exc) from exc
    except ValueError as exc:
        raise HTTPException(status_code=HTTP_422, detail=str(exc)) from exc


def _ambiguous_http_exception(exc: AmbiguousMaterialPropertyError) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail={
            "detail": str(exc),
            "material_key": exc.material_key,
            "matches": [_property_response(prop).model_dump() for prop in exc.matches],
        },
    )


def _steel_summary_response(material: SteelMaterial) -> SteelSummaryResponse:
    return SteelSummaryResponse(
        key=material.key,
        display_name=material.display_name,
        aliases=list(material.aliases),
        kind=material.kind,
        resolver_policy=material.resolver_policy,
    )


def _steel_response(material: SteelMaterial) -> SteelResponse:
    return SteelResponse(
        **_steel_summary_response(material).model_dump(),
        properties_by_thickness=[_property_response(prop) for prop in material.properties_by_thickness],
    )


def _resolved_response(resolved: ResolvedSteelMaterial) -> ResolvedSteelResponse:
    return ResolvedSteelResponse(
        key=resolved.key,
        display_name=resolved.display_name,
        property=_property_response(resolved.property),
    )


def _property_response(prop: Any) -> SteelPropertyResponse:
    return SteelPropertyResponse(
        property_id=prop.property_id,
        strength_class=prop.strength_class,
        product_types=list(prop.product_types),
        thickness=ThicknessRangeResponse(**prop.thickness.as_dict()),
        Rt=prop.Rt,
        Rb=prop.Rb,
        E=prop.E,
        G=prop.G,
        alpha=prop.alpha,
        rho=prop.rho,
        sources=[SourceResponse(**src) for src in prop.sources],
    )
