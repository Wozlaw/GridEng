import { z } from 'zod';

import type { Id, ProfileKind } from '../model';

const SECTION_PROFILE_KINDS = [
  'L_equal',
  'L_unequal',
  'U',
  'I',
  'pipe',
  'rect_pipe',
  'round_bar',
  'flat_bar',
  'custom',
] as const satisfies readonly ProfileKind[];

const SectionParamsSchema = z.record(z.string(), z.number().finite());
const CrossSectionDimensionsSchema = z.record(z.string(), z.number().finite());
const CrossSectionValueSchema = z.union([z.string(), z.number().finite(), z.boolean(), z.null()]);

export const SectionProfileKindSchema = z.enum(SECTION_PROFILE_KINDS);

export interface SectionCalculateRequest {
  profileKind: ProfileKind;
  name?: string;
  params: Record<string, number>;
  axis: 'YZ';
  materialId?: Id;
}

export interface SectionCalculateResponse {
  profileKind: ProfileKind;
  name?: string;
  params: Record<string, number>;
  areaMm2: number;
  IyMm4: number;
  IzMm4: number;
  JxMm4: number;
  WyMm3: number;
  WzMm3: number;
  WxMm3: number;
  massKgPerM: number;
  warnings?: string[];
}

export interface CrossSectionStandardCatalogItem {
  id: string;
  name: string;
  title: string;
  datasetId: string;
  profileTypes: string[];
  profileCount: number;
}

export interface CrossSectionProfileTypeCatalogItem {
  id: string;
  profileCount: number;
  standardIds: string[];
  standardNames: string[];
}

export interface CrossSectionCatalogFilters {
  standardId?: string;
  profileType?: string;
  query?: string;
}

export interface CrossSectionCatalogItem {
  id: string;
  datasetId: string;
  standardId: string;
  standardName: string;
  profileType: string;
  series?: string | null;
  gostNumber: string;
  designation: string;
  displayName: string;
  shapeMethod: string;
  dimensionsMm: Record<string, number>;
}

export type CrossSectionCalculatedValues = Record<string, string | number | boolean | null>;
export type CrossSectionDataframeRow = Record<string, string | number | boolean | null>;

export interface CrossSectionDetailsResponse {
  catalogItem: CrossSectionCatalogItem;
  geometry: Record<string, number>;
  calculated: CrossSectionCalculatedValues;
  dataframeRow: CrossSectionDataframeRow;
}

export const SectionCalculateRequestSchema: z.ZodType<SectionCalculateRequest> = z.object({
  profileKind: SectionProfileKindSchema,
  name: z.string().min(1).optional(),
  params: SectionParamsSchema,
  axis: z.literal('YZ'),
  materialId: z.string().min(1).optional(),
});

export const SectionCalculateResponseSchema: z.ZodType<SectionCalculateResponse> = z.object({
  profileKind: SectionProfileKindSchema,
  name: z.string().min(1).optional(),
  params: SectionParamsSchema,
  areaMm2: z.number().finite().positive(),
  IyMm4: z.number().finite().nonnegative(),
  IzMm4: z.number().finite().nonnegative(),
  JxMm4: z.number().finite().nonnegative(),
  WyMm3: z.number().finite().nonnegative(),
  WzMm3: z.number().finite().nonnegative(),
  WxMm3: z.number().finite().nonnegative(),
  massKgPerM: z.number().finite().nonnegative(),
  warnings: z.array(z.string()).optional(),
});

export const CrossSectionStandardCatalogItemSchema: z.ZodType<CrossSectionStandardCatalogItem> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  title: z.string().min(1),
  datasetId: z.string().min(1),
  profileTypes: z.array(z.string().min(1)),
  profileCount: z.number().int().nonnegative(),
});

export const CrossSectionProfileTypeCatalogItemSchema: z.ZodType<CrossSectionProfileTypeCatalogItem> = z.object({
  id: z.string().min(1),
  profileCount: z.number().int().nonnegative(),
  standardIds: z.array(z.string().min(1)),
  standardNames: z.array(z.string().min(1)),
});

export const CrossSectionCatalogItemSchema: z.ZodType<CrossSectionCatalogItem> = z.object({
  id: z.string().min(1),
  datasetId: z.string().min(1),
  standardId: z.string().min(1),
  standardName: z.string().min(1),
  profileType: z.string().min(1),
  series: z.string().min(1).nullable().optional(),
  gostNumber: z.string().min(1),
  designation: z.string().min(1),
  displayName: z.string().min(1),
  shapeMethod: z.string().min(1),
  dimensionsMm: CrossSectionDimensionsSchema,
});

export const CrossSectionCalculatedValuesSchema: z.ZodType<CrossSectionCalculatedValues> = z.record(
  z.string(),
  CrossSectionValueSchema,
);

export const CrossSectionDataframeRowSchema: z.ZodType<CrossSectionDataframeRow> = z.record(
  z.string(),
  CrossSectionValueSchema,
);

export const CrossSectionDetailsResponseSchema: z.ZodType<CrossSectionDetailsResponse> = z.object({
  catalogItem: CrossSectionCatalogItemSchema,
  geometry: CrossSectionDimensionsSchema,
  calculated: CrossSectionCalculatedValuesSchema,
  dataframeRow: CrossSectionDataframeRowSchema,
});
