import { z } from 'zod';

import { DEFAULT_STEEL } from '../../entities/model';
import {
  SteelMaterialCalculationMaterialSchema,
  SteelMaterialCatalogItemSchema,
  SteelMaterialDetailsSchema,
  SteelMaterialOptionsByProfileRequestSchema,
  SteelMaterialResolvedPropertiesSchema,
  SteelMaterialResolveByProfileRequestSchema,
  SteelMaterialResolveRequestSchema,
  type SteelMaterialCalculationMaterial,
  type SteelMaterialCatalogFilters,
  type SteelMaterialCatalogItem,
  type SteelMaterialDetails,
  type SteelMaterialOptionsByProfileRequest,
  type SteelMaterialResolvedProperties,
  type SteelMaterialResolveByProfileRequest,
  type SteelMaterialResolveRequest,
} from '../../entities/material';
import {
  notifyApiError,
  notifyApiFallbackOnce,
  requestJson,
  shouldUseApiFallback,
  type AdapterRequestOptions,
} from './http';

const LOCAL_STEEL_KEY = 'C245';
const LOCAL_STEEL_PROPERTY_ID = 'local-default';
const LOCAL_PRODUCT_TYPES = ['sheet', 'wide_flat', 'bent_profile', 'hot_rolled_shape'] as const;

const backendThicknessRangeSchema = z.object({
  min: z.number().finite().nullable(),
  max: z.number().finite().nullable(),
  min_inclusive: z.boolean(),
  max_inclusive: z.boolean(),
});

const backendSourceRefSchema = z.object({
  standard: z.string().min(1).nullable().optional(),
  table: z.string().min(1).nullable().optional(),
  note: z.string().min(1).nullable().optional(),
});

const backendSteelSummarySchema = z.object({
  key: z.string().min(1),
  display_name: z.string().min(1),
  aliases: z.array(z.string().min(1)),
  kind: z.string().min(1).nullable().optional(),
  resolver_policy: z.string().min(1).nullable().optional(),
});

const backendSteelPropertySchema = z.object({
  property_id: z.string().min(1),
  strength_class: z.number().int().positive().nullable().optional(),
  product_types: z.array(z.string().min(1)),
  thickness: backendThicknessRangeSchema,
  Rt: z.number().finite(),
  Rb: z.number().finite(),
  E: z.number().finite(),
  G: z.number().finite(),
  alpha: z.number().finite(),
  rho: z.number().finite(),
  sources: z.array(backendSourceRefSchema),
});

const backendSteelDetailsSchema = backendSteelSummarySchema.extend({
  properties_by_thickness: z.array(backendSteelPropertySchema),
});

const backendResolvedSteelSchema = z.object({
  key: z.string().min(1),
  display_name: z.string().min(1),
  property: backendSteelPropertySchema,
});

const backendCalculationMaterialSchema = z.object({
  name: z.string().min(1),
  Rt: z.number().finite(),
  Rb: z.number().finite(),
  E: z.number().finite(),
  G: z.number().finite(),
  alpha: z.number().finite(),
  rho: z.number().finite(),
});

export const materialsApi = {
  async listSteels(
    filters: SteelMaterialCatalogFilters = {},
    options: AdapterRequestOptions = {},
  ): Promise<SteelMaterialCatalogItem[]> {
    try {
      const response = await requestJson({
        path: '/api/materials/steels',
        schema: z.array(backendSteelSummarySchema),
        query: buildMaterialQuery(filters),
        ...options,
      });

      return response.map(mapSteelSummary);
    } catch (error) {
      if (shouldUseApiFallback(error)) {
        if (options.notifyOnError !== false) {
          notifyApiFallbackOnce('materials', 'Material catalog', error);
        }
        return buildLocalSteelCatalog(filters);
      }

      if (options.notifyOnError !== false) {
        notifyApiError('Material catalog', error);
      }
      throw error;
    }
  },

  async listSteelOptions(
    filters: SteelMaterialCatalogFilters = {},
    options: AdapterRequestOptions = {},
  ): Promise<SteelMaterialResolvedProperties[]> {
    try {
      const response = await requestJson({
        path: '/api/materials/steels/options',
        schema: z.array(backendResolvedSteelSchema),
        query: buildMaterialQuery(filters),
        ...options,
      });

      return response.map((item) => mapResolvedSteel(item));
    } catch (error) {
      if (shouldUseApiFallback(error)) {
        if (options.notifyOnError !== false) {
          notifyApiFallbackOnce('materials', 'Material catalog', error);
        }
        return buildLocalSteelOptions(filters);
      }

      if (options.notifyOnError !== false) {
        notifyApiError('Material catalog', error);
      }
      throw error;
    }
  },

  async listSteelOptionsByProfile(
    request: SteelMaterialOptionsByProfileRequest,
    options: AdapterRequestOptions = {},
  ): Promise<SteelMaterialResolvedProperties[]> {
    const normalizedRequest = SteelMaterialOptionsByProfileRequestSchema.parse(request);

    try {
      const response = await requestJson({
        path: '/api/materials/steels/options-by-profile',
        method: 'POST',
        schema: z.array(backendResolvedSteelSchema),
        body: {
          profile_method: normalizedRequest.profileMethod,
          dimensions: normalizedRequest.dimensionsMm,
          product_type: normalizedRequest.productType,
          thickness: normalizedRequest.thicknessMm,
          strength_class: normalizedRequest.strengthClass,
          standard: normalizedRequest.standard,
        },
        ...options,
      });

      return response.map((item) => mapResolvedSteel(item));
    } catch (error) {
      if (shouldUseApiFallback(error)) {
        if (options.notifyOnError !== false) {
          notifyApiFallbackOnce('materials', 'Material catalog', error);
        }
        return buildLocalSteelOptions(normalizedRequest);
      }

      if (options.notifyOnError !== false) {
        notifyApiError('Material catalog', error);
      }
      throw error;
    }
  },

  async getSteelDetails(name: string, options: AdapterRequestOptions = {}): Promise<SteelMaterialDetails> {
    try {
      const response = await requestJson({
        path: `/api/materials/steels/${encodeURIComponent(name)}`,
        schema: backendSteelDetailsSchema,
        ...options,
      });

      return mapSteelDetails(response);
    } catch (error) {
      if (shouldUseApiFallback(error)) {
        const localFallback = buildLocalSteelDetails(name);
        if (localFallback != null) {
          if (options.notifyOnError !== false) {
            notifyApiFallbackOnce('materials', 'Material catalog', error);
          }
          return localFallback;
        }
      }

      if (options.notifyOnError !== false) {
        notifyApiError('Material catalog', error);
      }
      throw error;
    }
  },

  async getSteelOptions(
    name: string,
    filters: SteelMaterialCatalogFilters = {},
    options: AdapterRequestOptions = {},
  ): Promise<SteelMaterialResolvedProperties[]> {
    try {
      const response = await requestJson({
        path: `/api/materials/steels/${encodeURIComponent(name)}/options`,
        schema: z.array(backendResolvedSteelSchema),
        query: buildMaterialQuery(filters),
        ...options,
      });

      return response.map((item) => mapResolvedSteel(item));
    } catch (error) {
      if (shouldUseApiFallback(error) && matchesLocalSteelName(name)) {
        if (options.notifyOnError !== false) {
          notifyApiFallbackOnce('materials', 'Material catalog', error);
        }
        return buildLocalSteelOptions(filters);
      }

      if (options.notifyOnError !== false) {
        notifyApiError('Material catalog', error);
      }
      throw error;
    }
  },

  async resolveSteel(
    request: SteelMaterialResolveRequest,
    options: AdapterRequestOptions = {},
  ): Promise<SteelMaterialCalculationMaterial> {
    const normalizedRequest = SteelMaterialResolveRequestSchema.parse(request);

    try {
      const response = await requestJson({
        path: '/api/materials/steels/resolve',
        method: 'POST',
        schema: backendCalculationMaterialSchema,
        body: {
          name: normalizedRequest.name,
          thickness: normalizedRequest.thicknessMm,
          product_type: normalizedRequest.productType,
          strength_class: normalizedRequest.strengthClass,
          standard: normalizedRequest.standard,
          property_id: normalizedRequest.propertyId,
          ambiguous: normalizedRequest.ambiguous,
          use_display_name: normalizedRequest.useDisplayName,
        },
        ...options,
      });

      return SteelMaterialCalculationMaterialSchema.parse(response);
    } catch (error) {
      if (shouldUseApiFallback(error)) {
        const localFallback = buildLocalCalculationMaterial(normalizedRequest);
        if (localFallback != null) {
          if (options.notifyOnError !== false) {
            notifyApiFallbackOnce('materials', 'Material catalog', error);
          }
          return localFallback;
        }
      }

      if (options.notifyOnError !== false) {
        notifyApiError('Material catalog', error);
      }
      throw error;
    }
  },

  async resolveSteelByProfile(
    request: SteelMaterialResolveByProfileRequest,
    options: AdapterRequestOptions = {},
  ): Promise<SteelMaterialCalculationMaterial> {
    const normalizedRequest = SteelMaterialResolveByProfileRequestSchema.parse(request);

    try {
      const response = await requestJson({
        path: '/api/materials/steels/resolve-by-profile',
        method: 'POST',
        schema: backendCalculationMaterialSchema,
        body: {
          name: normalizedRequest.name,
          profile_method: normalizedRequest.profileMethod,
          dimensions: normalizedRequest.dimensionsMm,
          product_type: normalizedRequest.productType,
          thickness: normalizedRequest.thicknessMm,
          strength_class: normalizedRequest.strengthClass,
          standard: normalizedRequest.standard,
          property_id: normalizedRequest.propertyId,
          ambiguous: normalizedRequest.ambiguous,
          use_display_name: normalizedRequest.useDisplayName,
        },
        ...options,
      });

      return SteelMaterialCalculationMaterialSchema.parse(response);
    } catch (error) {
      if (shouldUseApiFallback(error)) {
        const localFallback = buildLocalCalculationMaterial(normalizedRequest);
        if (localFallback != null) {
          if (options.notifyOnError !== false) {
            notifyApiFallbackOnce('materials', 'Material catalog', error);
          }
          return localFallback;
        }
      }

      if (options.notifyOnError !== false) {
        notifyApiError('Material catalog', error);
      }
      throw error;
    }
  },
};

function mapSteelSummary(item: z.infer<typeof backendSteelSummarySchema>): SteelMaterialCatalogItem {
  return SteelMaterialCatalogItemSchema.parse({
    key: item.key,
    displayName: item.display_name,
    aliases: item.aliases,
    kind: item.kind ?? null,
    resolverPolicy: item.resolver_policy ?? null,
  });
}

function mapResolvedSteel(
  item: z.infer<typeof backendResolvedSteelSchema>,
  context?: Pick<SteelMaterialCatalogItem, 'kind' | 'resolverPolicy'>,
): SteelMaterialResolvedProperties {
  return SteelMaterialResolvedPropertiesSchema.parse({
    key: item.key,
    displayName: item.display_name,
    kind: context?.kind ?? null,
    resolverPolicy: context?.resolverPolicy ?? null,
    propertyId: item.property.property_id,
    strengthClass: item.property.strength_class ?? null,
    productTypes: item.property.product_types,
    thickness: {
      min: item.property.thickness.min,
      max: item.property.thickness.max,
      minInclusive: item.property.thickness.min_inclusive,
      maxInclusive: item.property.thickness.max_inclusive,
    },
    Rt: item.property.Rt,
    Rb: item.property.Rb,
    E: item.property.E,
    G: item.property.G,
    alpha: item.property.alpha,
    rho: item.property.rho,
    sourceRefs: item.property.sources.map((source) => ({
      standard: source.standard ?? null,
      table: source.table ?? null,
      note: source.note ?? null,
    })),
  });
}

function mapSteelDetails(item: z.infer<typeof backendSteelDetailsSchema>): SteelMaterialDetails {
  const summary = mapSteelSummary(item);

  return SteelMaterialDetailsSchema.parse({
    ...summary,
    propertiesByThickness: item.properties_by_thickness.map((property) =>
      mapResolvedSteel(
        {
          key: item.key,
          display_name: item.display_name,
          property,
        },
        summary,
      ),
    ),
  });
}

function buildMaterialQuery(filters: SteelMaterialCatalogFilters): Record<string, string | number | undefined> {
  return {
    thickness: filters.thicknessMm,
    product_type: filters.productType,
    strength_class: filters.strengthClass,
    standard: filters.standard,
  };
}

function buildLocalSteelCatalog(filters: SteelMaterialCatalogFilters): SteelMaterialCatalogItem[] {
  return matchesLocalSteelFilters(filters) ? [getLocalSteelSummary()] : [];
}

function buildLocalSteelOptions(filters: SteelMaterialCatalogFilters): SteelMaterialResolvedProperties[] {
  return matchesLocalSteelFilters(filters) ? [getLocalResolvedProperties()] : [];
}

function buildLocalSteelDetails(name: string): SteelMaterialDetails | null {
  if (!matchesLocalSteelName(name)) {
    return null;
  }

  const summary = getLocalSteelSummary();
  return SteelMaterialDetailsSchema.parse({
    ...summary,
    propertiesByThickness: [getLocalResolvedProperties()],
  });
}

function buildLocalCalculationMaterial(
  request: Pick<SteelMaterialResolveRequest, 'name' | 'productType' | 'propertyId'>,
): SteelMaterialCalculationMaterial | null {
  if (!matchesLocalSteelName(request.name)) {
    return null;
  }

  if (!matchesLocalSteelProductType(request.productType)) {
    return null;
  }

  if (request.propertyId != null && request.propertyId !== LOCAL_STEEL_PROPERTY_ID) {
    return null;
  }

  return SteelMaterialCalculationMaterialSchema.parse({
    name: DEFAULT_STEEL.name,
    Rt: DEFAULT_STEEL.yieldStrengthMPa ?? 0,
    Rb: DEFAULT_STEEL.yieldStrengthMPa ?? 0,
    E: DEFAULT_STEEL.elasticModulusMPa ?? 0,
    G: resolveDefaultShearModulus(),
    alpha: 0.000012,
    rho: DEFAULT_STEEL.densityKgPerM3 ?? 0,
  });
}

function getLocalSteelSummary(): SteelMaterialCatalogItem {
  return SteelMaterialCatalogItemSchema.parse({
    key: LOCAL_STEEL_KEY,
    displayName: DEFAULT_STEEL.name,
    aliases: [DEFAULT_STEEL.id, DEFAULT_STEEL.name, LOCAL_STEEL_KEY],
    kind: 'structural_steel',
    resolverPolicy: null,
  });
}

function getLocalResolvedProperties(): SteelMaterialResolvedProperties {
  return SteelMaterialResolvedPropertiesSchema.parse({
    key: LOCAL_STEEL_KEY,
    displayName: DEFAULT_STEEL.name,
    kind: 'structural_steel',
    resolverPolicy: null,
    propertyId: LOCAL_STEEL_PROPERTY_ID,
    strengthClass: DEFAULT_STEEL.yieldStrengthMPa ?? null,
    productTypes: [...LOCAL_PRODUCT_TYPES],
    thickness: {
      min: null,
      max: null,
      minInclusive: true,
      maxInclusive: true,
    },
    Rt: DEFAULT_STEEL.yieldStrengthMPa ?? 0,
    Rb: DEFAULT_STEEL.yieldStrengthMPa ?? 0,
    E: DEFAULT_STEEL.elasticModulusMPa ?? 0,
    G: resolveDefaultShearModulus(),
    alpha: 0.000012,
    rho: DEFAULT_STEEL.densityKgPerM3 ?? 0,
    sourceRefs: [
      {
        standard: 'Local fallback',
        note: 'Frontend fixture based on DEFAULT_STEEL',
      },
    ],
  });
}

function resolveDefaultShearModulus(): number {
  if (DEFAULT_STEEL.shearModulusMPa != null) {
    return DEFAULT_STEEL.shearModulusMPa;
  }

  const elasticModulus = DEFAULT_STEEL.elasticModulusMPa;
  const poissonRatio = DEFAULT_STEEL.poissonRatio;
  if (elasticModulus == null || poissonRatio == null) {
    return 0;
  }

  return elasticModulus / (2 * (1 + poissonRatio));
}

function matchesLocalSteelFilters(filters: SteelMaterialCatalogFilters): boolean {
  return matchesLocalSteelProductType(filters.productType);
}

function matchesLocalSteelProductType(productType: string | undefined): boolean {
  if (productType == null) {
    return true;
  }

  return LOCAL_PRODUCT_TYPES.includes(productType as (typeof LOCAL_PRODUCT_TYPES)[number]);
}

function matchesLocalSteelName(name: string): boolean {
  const normalizedName = name.trim().toLowerCase();
  if (normalizedName.length === 0) {
    return false;
  }

  return [LOCAL_STEEL_KEY, DEFAULT_STEEL.id, DEFAULT_STEEL.name].some(
    (candidate) => candidate.toLowerCase() === normalizedName,
  );
}
