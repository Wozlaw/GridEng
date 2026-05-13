import { z } from 'zod';

export const IdSchema = z.string().min(1);

export const Vec3Schema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  z: z.number().finite(),
});

export const UnitSystemSchema = z.object({
  length: z.enum(['mm', 'm']),
  force: z.enum(['N', 'kN']),
  moment: z.enum(['Nmm', 'kNm']),
  stress: z.literal('MPa'),
  pressure: z.literal('Pa'),
  mass: z.literal('kg'),
});

export const ForceMomentVectorSchema = z.object({
  force: Vec3Schema,
  moment: Vec3Schema,
});

export const WindLoadDefinitionSchema = z.object({
  direction: Vec3Schema,
  nominalPressurePa: z.number().finite().nonnegative(),
  comment: z.string().optional(),
});

export const DxfColorValueSchema = z.union([z.string(), z.number().finite()]);

export const SourceRefSchema = z.object({
  source: z.enum(['dxf', 'json', 'manual']),
  entityType: z.literal('LINE').optional(),
  color: DxfColorValueSchema.optional(),
  layer: z.string().optional(),
  colorIndex: z.number().int().optional(),
  trueColor: DxfColorValueSchema.optional(),
  handle: z.string().optional(),
});

export const NodeSchema = z.object({
  id: IdSchema,
  position: Vec3Schema,
  label: z.string().optional(),
  comment: z.string().optional(),
  source: SourceRefSchema.optional(),
});

export const MemberSchema = z.object({
  id: IdSchema,
  startNodeId: IdSchema,
  endNodeId: IdSchema,
  profileId: IdSchema,
  materialId: IdSchema,
  localAxisRotationDeg: z.number().finite().optional(),
  offsetYmm: z.number().finite().optional(),
  offsetZmm: z.number().finite().optional(),
  groupId: IdSchema.optional(),
  label: z.string().optional(),
  comment: z.string().optional(),
  source: SourceRefSchema.optional(),
});

export const SectionPropertiesSchema = z.object({
  areaMm2: z.number().finite().positive().optional(),
  JxMm4: z.number().finite().nonnegative().optional(),
  IyMm4: z.number().finite().nonnegative().optional(),
  IzMm4: z.number().finite().nonnegative().optional(),
  WxMm3: z.number().finite().nonnegative().optional(),
  WyMm3: z.number().finite().nonnegative().optional(),
  WzMm3: z.number().finite().nonnegative().optional(),
});

export const ProfileSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  kind: z.enum([
    'L_equal',
    'L_unequal',
    'U',
    'I',
    'pipe',
    'rect_pipe',
    'round_bar',
    'flat_bar',
    'custom',
  ]),
  params: z.record(z.string(), z.number().finite()),
  comment: z.string().optional(),
  defaultLocalAxisRotationDeg: z.number().finite().default(0),
  defaultOffsetYmm: z.number().finite().default(0),
  defaultOffsetZmm: z.number().finite().default(0),
  massKgPerM: z.number().finite().nonnegative().optional(),
  section: SectionPropertiesSchema,
  color: z.string().optional(),
});

export const MaterialSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  comment: z.string().optional(),
  elasticModulusMPa: z.number().finite().positive().optional(),
  shearModulusMPa: z.number().finite().positive().optional(),
  poissonRatio: z.number().finite().min(0).max(0.5).optional(),
  densityKgPerM3: z.number().finite().positive().optional(),
  yieldStrengthMPa: z.number().finite().positive().optional(),
});

export const RestraintSchema = z.object({
  id: IdSchema,
  nodeId: IdSchema,
  comment: z.string().optional(),
  ux: z.boolean(),
  uy: z.boolean(),
  uz: z.boolean(),
  rx: z.boolean(),
  ry: z.boolean(),
  rz: z.boolean(),
});

export const LoadTargetSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('node'), nodeId: IdSchema }),
  z.object({ type: z.literal('member'), memberId: IdSchema }),
]);

export const ConcentratedLoadSchema = z.object({
  id: IdSchema,
  target: LoadTargetSchema,
  vector: ForceMomentVectorSchema,
  description: z.string().optional(),
});

export const LoadCoordinateSystemSchema = z.literal('global');
export const LoadKindSchema = z.enum(['force', 'moment']);
export const LoadDistributionTypeSchema = z.enum(['linear', 'function']);

export const LoadBaseSchema = z.object({
  id: IdSchema,
  kind: LoadKindSchema,
  name: z.string().min(1),
  comment: z.string().optional(),
  coordinateSystem: LoadCoordinateSystemSchema,
  direction: Vec3Schema,
});

export const NodalConcentratedLoadSchema = LoadBaseSchema.extend({
  type: z.literal('nodal_concentrated'),
  target: z.object({
    type: z.literal('node'),
    nodeId: IdSchema,
  }),
  magnitude: z.number().finite(),
});

export const LinearLoadDistributionSchema = z.object({
  type: z.literal('linear'),
  qStart: z.number().finite(),
  qEnd: z.number().finite(),
  xStartRel: z.number().finite().min(0).max(1).default(0),
  xEndRel: z.number().finite().min(0).max(1).default(1),
});

export const FunctionLoadDistributionReservedSchema = z.object({
  type: z.literal('function'),
  expression: z.string().min(1),
  variables: z.record(z.string(), z.number().finite()).optional(),
  comment: z.string().optional(),
});

export const MemberDistributedLoadSchema = LoadBaseSchema.extend({
  type: z.literal('member_distributed'),
  target: z.object({
    type: z.literal('member'),
    memberId: IdSchema,
  }),
  distribution: z.discriminatedUnion('type', [
    LinearLoadDistributionSchema,
    FunctionLoadDistributionReservedSchema,
  ]),
});

export const LoadSchema = z.discriminatedUnion('type', [
  NodalConcentratedLoadSchema,
  MemberDistributedLoadSchema,
]);

export const LoadCaseSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  comment: z.string().optional(),
  loads: z.array(LoadSchema),
  wind: WindLoadDefinitionSchema,
});

export const ModelSettingsSchema = z.object({
  nodeMergeToleranceMm: z.number().finite().positive(),
  centerModelByXYProjection: z.boolean(),
  verticalAxis: z.literal('Z'),
});

export const DxfImportMetaSchema = z.object({
  fileName: z.string().min(1),
  importedLineCount: z.number().int().nonnegative(),
  skippedEntityCount: z.number().int().nonnegative(),
  hasNonZeroZ: z.boolean(),
  assumedOrientation: z.literal('XY_Z_UP').optional(),
  toleranceMm: z.number().finite().positive(),
  colorProfileMap: z.record(z.string(), IdSchema),
  layerMap: z.record(z.string(), z.string()),
  warnings: z.array(z.string()),
});

export const AnalysisResultsSchema = z.object({
  loadCaseId: IdSchema,
  nodeDisplacements: z.record(IdSchema, z.object({
    ux: z.number().finite(),
    uy: z.number().finite(),
    uz: z.number().finite(),
    rx: z.number().finite(),
    ry: z.number().finite(),
    rz: z.number().finite(),
  })),
  memberForces: z.record(IdSchema, z.object({
    n: z.number().finite().optional(),
    qy: z.number().finite().optional(),
    qz: z.number().finite().optional(),
    mx: z.number().finite().optional(),
    my: z.number().finite().optional(),
    mz: z.number().finite().optional(),
  })),
  memberStresses: z.record(IdSchema, z.object({
    sigmaMaxMPa: z.number().finite().optional(),
    utilization: z.number().finite().optional(),
  })),
});

export const AnalysisResultsCollectionSchema = z.union([
  z.array(AnalysisResultsSchema),
  AnalysisResultsSchema,
]).transform((value) => (Array.isArray(value) ? value : [value]));

export const GridEngModelSchema = z.object({
  schemaVersion: z.literal('0.2'),
  name: z.string().min(1),
  units: UnitSystemSchema,
  settings: ModelSettingsSchema,
  nodes: z.array(NodeSchema),
  members: z.array(MemberSchema),
  profiles: z.array(ProfileSchema),
  materials: z.array(MaterialSchema),
  restraints: z.array(RestraintSchema),
  loadCases: z.array(LoadCaseSchema),
  importMeta: z.object({
    source: z.enum(['dxf', 'json', 'manual']),
    dxf: DxfImportMetaSchema.optional(),
  }).optional(),
  results: AnalysisResultsCollectionSchema.optional(),
});

export type GridEngModelFromSchema = z.infer<typeof GridEngModelSchema>;
