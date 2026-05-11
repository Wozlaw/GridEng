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
