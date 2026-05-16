"""Materials data layer."""

from .adapters import Steel
from .exceptions import (
    AmbiguousMaterialPropertyError,
    MaterialNotFoundError,
    MaterialPropertyNotFoundError,
    MaterialsRepositoryError,
)
from .models import (
    CalculationMaterial,
    ProductType,
    ResolvedSteelMaterial,
    SteelMaterial,
    SteelProperty,
    ThicknessRange,
)
from .repository import (
    DATA_DIR,
    STEELS_DB_FILENAME,
    STEELS_DB_PATH,
    SteelMaterialRepository,
    normalize_steel_key,
)
from .service import (
    get_steel_repository,
    list_steel_options,
    list_steels,
    material_thickness_from_profile,
    product_type_from_profile,
    reset_steel_repository_cache,
    resolve_steel,
)

__all__ = [
    "AmbiguousMaterialPropertyError",
    "CalculationMaterial",
    "DATA_DIR",
    "MaterialNotFoundError",
    "MaterialPropertyNotFoundError",
    "MaterialsRepositoryError",
    "ProductType",
    "ResolvedSteelMaterial",
    "STEELS_DB_FILENAME",
    "STEELS_DB_PATH",
    "Steel",
    "SteelMaterial",
    "SteelMaterialRepository",
    "SteelProperty",
    "ThicknessRange",
    "get_steel_repository",
    "list_steel_options",
    "list_steels",
    "material_thickness_from_profile",
    "normalize_steel_key",
    "product_type_from_profile",
    "reset_steel_repository_cache",
    "resolve_steel",
]
