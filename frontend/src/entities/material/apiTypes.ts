import { z } from 'zod';

const ResolveAmbiguousStrategies = ['raise', 'first', 'strongest', 'weakest'] as const;
const DimensionsSchema = z.record(z.string(), z.number().finite());

export interface SteelMaterialCatalogFilters {
  thicknessMm?: number;
  productType?: string;
  strengthClass?: number;
  standard?: string;
}

export interface SteelMaterialCatalogItem {
  key: string;
  displayName: string;
  aliases: string[];
  kind?: string | null;
  resolverPolicy?: string | null;
}

export interface SteelMaterialSourceRef {
  standard?: string | null;
  table?: string | null;
  note?: string | null;
}

export interface SteelMaterialThicknessRange {
  min: number | null;
  max: number | null;
  minInclusive: boolean;
  maxInclusive: boolean;
}

export interface SteelMaterialResolvedProperties {
  key: string;
  displayName: string;
  kind?: string | null;
  resolverPolicy?: string | null;
  propertyId: string;
  strengthClass?: number | null;
  productTypes: string[];
  thickness: SteelMaterialThicknessRange;
  Rt: number;
  Rb: number;
  E: number;
  G: number;
  alpha: number;
  rho: number;
  sourceRefs: SteelMaterialSourceRef[];
}

export interface SteelMaterialDetails extends SteelMaterialCatalogItem {
  propertiesByThickness: SteelMaterialResolvedProperties[];
}

export interface SteelMaterialCalculationMaterial {
  name: string;
  Rt: number;
  Rb: number;
  E: number;
  G: number;
  alpha: number;
  rho: number;
}

export interface SteelMaterialOptionsByProfileRequest extends SteelMaterialCatalogFilters {
  profileMethod: string;
  dimensionsMm: Record<string, number>;
}

export interface SteelMaterialResolveRequest extends SteelMaterialCatalogFilters {
  name: string;
  propertyId?: string;
  ambiguous?: (typeof ResolveAmbiguousStrategies)[number];
  useDisplayName?: boolean;
}

export interface SteelMaterialResolveByProfileRequest extends SteelMaterialResolveRequest {
  profileMethod: string;
  dimensionsMm: Record<string, number>;
}

const SteelMaterialCatalogFiltersObject = z.object({
  thicknessMm: z.number().finite().positive().optional(),
  productType: z.string().min(1).optional(),
  strengthClass: z.number().int().positive().optional(),
  standard: z.string().min(1).optional(),
});
export const SteelMaterialCatalogFiltersSchema: z.ZodType<SteelMaterialCatalogFilters> = SteelMaterialCatalogFiltersObject;

const SteelMaterialCatalogItemObject = z.object({
  key: z.string().min(1),
  displayName: z.string().min(1),
  aliases: z.array(z.string().min(1)),
  kind: z.string().min(1).nullable().optional(),
  resolverPolicy: z.string().min(1).nullable().optional(),
});
export const SteelMaterialCatalogItemSchema: z.ZodType<SteelMaterialCatalogItem> = SteelMaterialCatalogItemObject;

export const SteelMaterialSourceRefSchema: z.ZodType<SteelMaterialSourceRef> = z.object({
  standard: z.string().min(1).nullable().optional(),
  table: z.string().min(1).nullable().optional(),
  note: z.string().min(1).nullable().optional(),
});

export const SteelMaterialThicknessRangeSchema: z.ZodType<SteelMaterialThicknessRange> = z.object({
  min: z.number().finite().nullable(),
  max: z.number().finite().nullable(),
  minInclusive: z.boolean(),
  maxInclusive: z.boolean(),
});

export const SteelMaterialResolvedPropertiesSchema: z.ZodType<SteelMaterialResolvedProperties> = z.object({
  key: z.string().min(1),
  displayName: z.string().min(1),
  kind: z.string().min(1).nullable().optional(),
  resolverPolicy: z.string().min(1).nullable().optional(),
  propertyId: z.string().min(1),
  strengthClass: z.number().int().positive().nullable().optional(),
  productTypes: z.array(z.string().min(1)),
  thickness: SteelMaterialThicknessRangeSchema,
  Rt: z.number().finite(),
  Rb: z.number().finite(),
  E: z.number().finite(),
  G: z.number().finite(),
  alpha: z.number().finite(),
  rho: z.number().finite(),
  sourceRefs: z.array(SteelMaterialSourceRefSchema),
});

export const SteelMaterialDetailsSchema: z.ZodType<SteelMaterialDetails> = SteelMaterialCatalogItemObject.extend({
  propertiesByThickness: z.array(SteelMaterialResolvedPropertiesSchema),
});

export const SteelMaterialCalculationMaterialSchema: z.ZodType<SteelMaterialCalculationMaterial> = z.object({
  name: z.string().min(1),
  Rt: z.number().finite(),
  Rb: z.number().finite(),
  E: z.number().finite(),
  G: z.number().finite(),
  alpha: z.number().finite(),
  rho: z.number().finite(),
});

export const SteelMaterialOptionsByProfileRequestSchema: z.ZodType<SteelMaterialOptionsByProfileRequest> =
  SteelMaterialCatalogFiltersObject.extend({
    profileMethod: z.string().min(1),
    dimensionsMm: DimensionsSchema,
  });

export const SteelMaterialResolveRequestSchema: z.ZodType<SteelMaterialResolveRequest> =
  SteelMaterialCatalogFiltersObject.extend({
    name: z.string().min(1),
    propertyId: z.string().min(1).optional(),
    ambiguous: z.enum(ResolveAmbiguousStrategies).optional(),
    useDisplayName: z.boolean().optional(),
  });

export const SteelMaterialResolveByProfileRequestSchema: z.ZodType<SteelMaterialResolveByProfileRequest> =
  SteelMaterialCatalogFiltersObject.extend({
    name: z.string().min(1),
    propertyId: z.string().min(1).optional(),
    ambiguous: z.enum(ResolveAmbiguousStrategies).optional(),
    useDisplayName: z.boolean().optional(),
    profileMethod: z.string().min(1),
    dimensionsMm: DimensionsSchema,
  });
