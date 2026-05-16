from __future__ import annotations

from typing import Any

from .models import CrossSectionProfile, CrossSectionValidationError

try:
    from app.lib.Crossection import Crossection  # expected project location
except ImportError:  # pragma: no cover - useful for local standalone validation
    try:
        from Crossection import Crossection  # type: ignore
    except ImportError as exc:  # pragma: no cover
        Crossection = None  # type: ignore[assignment]
        _CROSSECTION_IMPORT_ERROR = exc
    else:
        _CROSSECTION_IMPORT_ERROR = None
else:
    _CROSSECTION_IMPORT_ERROR = None


class CrossSectionFactory:
    """Builds Crossection instances from normalized JSON profile records."""

    METHOD_REQUIRED_DIMENSIONS: dict[str, set[str]] = {
        "LShape": {"h", "b", "t", "R", "r"},
        "CircleShape": {"D"},
        "RectShape": {"h", "b"},
        "HexShape": {"h"},
        "PipeShape": {"D", "t"},
        "SquarePipeShape": {"h", "b", "t", "r"},
        "CShape": {"h", "b", "s", "t", "R", "r"},
        "IShape": {"h", "b", "s", "t", "R", "r"},
        "TShape": {"h", "b", "s", "t", "R", "r"},
        "CBendShape": {"h", "b", "s", "R"},
    }

    @classmethod
    def validate_shape_spec(cls, profile: CrossSectionProfile) -> None:
        method = profile.shape.method
        dims = profile.shape.dimensions_mm
        required = cls.METHOD_REQUIRED_DIMENSIONS.get(method)
        if required is None:
            raise CrossSectionValidationError(f"profile {profile.id}: unsupported shape.method={method!r}")
        missing = required - set(dims)
        if missing:
            raise CrossSectionValidationError(
                f"profile {profile.id}: shape.method={method!r} misses dimensions {sorted(missing)}"
            )

    @classmethod
    def build(cls, profile: CrossSectionProfile, *, cache_props: bool = True, res: float | None = None):
        """Create a Crossection and apply the shape constructor from profile.shape."""
        if Crossection is None:  # pragma: no cover
            raise CrossSectionValidationError(
                "Cannot import Crossection. Put this package under backend/app or make app.lib.Crossection importable."
            ) from _CROSSECTION_IMPORT_ERROR

        cls.validate_shape_spec(profile)
        cs = Crossection(name=profile.id, cacheProps=cache_props)
        method_name = profile.shape.method
        method = getattr(cs, method_name, None)
        if method is None:
            raise CrossSectionValidationError(f"profile {profile.id}: Crossection has no method {method_name!r}")
        kwargs: dict[str, Any] = dict(profile.shape.dimensions_mm)
        if res is not None:
            kwargs["res"] = res
        try:
            result = method(**kwargs)
        except Exception as exc:
            raise CrossSectionValidationError(
                f"profile {profile.id}: failed to build Crossection via {method_name}: {exc}"
            ) from exc
        result.name = profile.id
        return result

    @classmethod
    def calculate_params(cls, profile: CrossSectionProfile, *, res: float | None = None) -> dict[str, float | str]:
        cs = cls.build(profile, res=res)
        return cs.calculateParams()
