import { z } from 'zod';

import {
  DEFAULT_WIND_CALCULATION_MODE,
  DEFAULT_WIND_GAMMA_F_BY_MODE,
  DEFAULT_WIND_TERRAIN_TYPE,
} from './defaults';
import {
  AnalysisResultsCollectionSchema,
  ConcentratedLoadSchema,
  DxfImportMetaSchema,
  GridEngModelSchema,
  LoadCaseSchema,
  MaterialSchema,
  MemberSchema,
  ModelSettingsSchema,
  NodeSchema,
  ProfileSchema,
  RestraintSchema,
} from './schema';
import { normalizeVec3, vec3Length } from './geometry';
import type {
  ConcentratedLoad,
  GridEngModel,
  Load,
  MemberDistributedLoad,
  NodalConcentratedLoad,
  Vec3,
} from './types';

const DEFAULT_LOAD_DIRECTION: Vec3 = { x: 0, y: 0, z: 1 };

const LegacyUnitSystemSchema = z.object({
  length: z.enum(['mm', 'm']),
  force: z.enum(['N', 'kN']),
  moment: z.enum(['Nmm', 'kNm']),
  stress: z.literal('MPa'),
  pressure: z.enum(['kPa', 'Pa']),
  mass: z.literal('kg'),
});

const LegacyWindLoadDefinitionSchema = z.object({
  direction: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
    z: z.number().finite(),
  }),
  nominalPressurePa: z.number().finite().nonnegative().optional(),
  nominalPressureKPa: z.number().finite().nonnegative().optional(),
  comment: z.string().optional(),
}).transform((wind) => ({
  direction: wind.direction,
  nominalPressurePa: wind.nominalPressurePa ?? ((wind.nominalPressureKPa ?? 0) * 1000),
  terrainType: DEFAULT_WIND_TERRAIN_TYPE,
  gammaF: DEFAULT_WIND_GAMMA_F_BY_MODE.simple,
  calculationMode: DEFAULT_WIND_CALCULATION_MODE,
  comment: wind.comment,
}));

const GridEngModelV01Schema = z.object({
  schemaVersion: z.literal('0.1'),
  name: z.string().min(1),
  units: LegacyUnitSystemSchema,
  settings: ModelSettingsSchema,
  nodes: z.array(NodeSchema),
  members: z.array(MemberSchema),
  profiles: z.array(ProfileSchema),
  materials: z.array(MaterialSchema),
  restraints: z.array(RestraintSchema),
  loadCases: z.array(z.object({
    id: LoadCaseSchema.shape.id,
    name: LoadCaseSchema.shape.name,
    loads: z.array(ConcentratedLoadSchema),
    wind: LegacyWindLoadDefinitionSchema,
  })),
  importMeta: z.object({
    source: z.enum(['dxf', 'json', 'manual']),
    dxf: DxfImportMetaSchema.optional(),
  }).optional(),
  results: AnalysisResultsCollectionSchema.optional(),
});

type GridEngModelV01 = z.infer<typeof GridEngModelV01Schema>;

export interface GridEngModelMigrationResult {
  model: GridEngModel;
  warnings: string[];
}

export function migrateGridEngModelToCurrent(input: unknown): GridEngModel {
  return migrateGridEngModelToCurrentDetailed(input).model;
}

export function migrateGridEngModelToCurrentDetailed(input: unknown): GridEngModelMigrationResult {
  const schemaVersion = readSchemaVersion(input);

  if (schemaVersion === '0.1') {
    const legacyModel = GridEngModelV01Schema.parse(input);
    return migrateV01ToV02(legacyModel);
  }

  const normalized = normalizeCurrentModelInput(input);

  return {
    model: GridEngModelSchema.parse(normalized.model) as GridEngModel,
    warnings: normalized.warnings,
  };
}

function migrateV01ToV02(model: GridEngModelV01): GridEngModelMigrationResult {
  const warnings: string[] = [];

  const nextModel: GridEngModel = {
    ...model,
    schemaVersion: '0.2',
    units: {
      ...model.units,
      pressure: 'Pa',
    },
    loadCases: model.loadCases.map((loadCase, loadCaseIndex) => ({
      id: loadCase.id,
      name: loadCase.name,
      comment: undefined,
      wind: {
        ...loadCase.wind,
      },
      loads: loadCase.loads.flatMap((load, loadIndex) =>
        migrateLegacyConcentratedLoad(loadCaseIndex, loadIndex, load, warnings),
      ),
    })),
  };

  return {
    model: nextModel,
    warnings,
  };
}

function normalizeCurrentModelInput(input: unknown): GridEngModelMigrationResult {
  if (!isRecord(input)) {
    return {
      model: input as GridEngModel,
      warnings: [],
    };
  }

  const warnings: string[] = [];
  const nextModel: Record<string, unknown> = { ...input };

  if (isRecord(nextModel.units)) {
    const nextUnits: Record<string, unknown> = { ...nextModel.units };

    if (nextUnits.pressure === 'kPa') {
      nextUnits.pressure = 'Pa';
      warnings.push('Legacy units.pressure value "kPa" was normalized to "Pa".');
    }

    nextModel.units = nextUnits;
  }

  if (Array.isArray(nextModel.loadCases)) {
    nextModel.loadCases = nextModel.loadCases.map((loadCase, loadCaseIndex) => {
      if (!isRecord(loadCase)) {
        return loadCase;
      }

      const nextLoadCase: Record<string, unknown> = { ...loadCase };

      if (isRecord(loadCase.wind)) {
        nextLoadCase.wind = normalizeCurrentWindInput(loadCase.wind, loadCaseIndex, warnings);
      }

      return nextLoadCase;
    });
  }

  return {
    model: nextModel as unknown as GridEngModel,
    warnings,
  };
}

function normalizeCurrentWindInput(
  wind: Record<string, unknown>,
  loadCaseIndex: number,
  warnings: string[],
): Record<string, unknown> {
  const nextWind: Record<string, unknown> = { ...wind };

  if (typeof nextWind.nominalPressurePa === 'number' && Number.isFinite(nextWind.nominalPressurePa)) {
    delete nextWind.nominalPressureKPa;
    return nextWind;
  }

  if (typeof nextWind.nominalPressureKPa === 'number' && Number.isFinite(nextWind.nominalPressureKPa)) {
    nextWind.nominalPressurePa = nextWind.nominalPressureKPa * 1000;
    delete nextWind.nominalPressureKPa;
    warnings.push(`Legacy loadCases[${loadCaseIndex}].wind.nominalPressureKPa was migrated to nominalPressurePa.`);
  }

  const calculationMode = nextWind.calculationMode === 'sp20' || nextWind.calculationMode === 'pue'
    ? nextWind.calculationMode
    : nextWind.calculationMode === 'simple'
      ? nextWind.calculationMode
      : DEFAULT_WIND_CALCULATION_MODE;
  nextWind.calculationMode = calculationMode;

  if (nextWind.terrainType !== 'A' && nextWind.terrainType !== 'B' && nextWind.terrainType !== 'C') {
    nextWind.terrainType = DEFAULT_WIND_TERRAIN_TYPE;
  }

  if (typeof nextWind.gammaF !== 'number' || !Number.isFinite(nextWind.gammaF) || nextWind.gammaF <= 0) {
    nextWind.gammaF = DEFAULT_WIND_GAMMA_F_BY_MODE[calculationMode];
  }

  return nextWind;
}

function migrateLegacyConcentratedLoad(
  loadCaseIndex: number,
  loadIndex: number,
  load: ConcentratedLoad,
  warnings: string[],
): Load[] {
  const forceMagnitude = vec3Length(load.vector.force);
  const momentMagnitude = vec3Length(load.vector.moment);
  const forceDirection = normalizeVec3(load.vector.force) ?? DEFAULT_LOAD_DIRECTION;
  const momentDirection = normalizeVec3(load.vector.moment) ?? DEFAULT_LOAD_DIRECTION;
  const baseName = buildLegacyLoadName(load.description, loadCaseIndex, loadIndex);
  const splitNeeded = forceMagnitude > 0 && momentMagnitude > 0;

  if (load.target.type === 'member') {
    if (forceMagnitude === 0 && momentMagnitude === 0) {
      warnings.push(`Legacy member load ${load.id} had zero force and moment vectors. Migrated as unsupported placeholder.`);
      return [
        createLegacyMemberPlaceholderLoad({
          id: load.id,
          name: baseName,
          comment: appendMigrationComment(load.description, 'Migrated from unsupported legacy concentrated member load with zero vector.'),
          memberId: load.target.memberId,
          kind: 'force',
          direction: DEFAULT_LOAD_DIRECTION,
          magnitude: 0,
        }),
      ];
    }

    const placeholders: Load[] = [];

    if (forceMagnitude > 0) {
      warnings.push(`Legacy concentrated member force load ${load.id} was migrated to unsupported placeholder for manual review.`);
      placeholders.push(createLegacyMemberPlaceholderLoad({
        id: splitNeeded ? `${load.id}__force` : load.id,
        name: splitNeeded ? `${baseName} (force)` : baseName,
        comment: appendMigrationComment(load.description, 'Migrated from unsupported legacy concentrated member force load.'),
        memberId: load.target.memberId,
        kind: 'force',
        direction: forceDirection,
        magnitude: forceMagnitude,
      }));
    }

    if (momentMagnitude > 0) {
      warnings.push(`Legacy concentrated member moment load ${load.id} was migrated to unsupported placeholder for manual review.`);
      placeholders.push(createLegacyMemberPlaceholderLoad({
        id: splitNeeded ? `${load.id}__moment` : load.id,
        name: splitNeeded ? `${baseName} (moment)` : baseName,
        comment: appendMigrationComment(load.description, 'Migrated from unsupported legacy concentrated member moment load.'),
        memberId: load.target.memberId,
        kind: 'moment',
        direction: momentDirection,
        magnitude: momentMagnitude,
      }));
    }

    return placeholders;
  }

  if (forceMagnitude === 0 && momentMagnitude === 0) {
    warnings.push(`Legacy nodal load ${load.id} had zero force and moment vectors. Migrated as zero force load for review.`);
    return [
      createNodalLoad({
        id: load.id,
        name: baseName,
        comment: appendMigrationComment(load.description, 'Migrated from legacy zero vector concentrated load.'),
        nodeId: load.target.nodeId,
        kind: 'force',
        direction: DEFAULT_LOAD_DIRECTION,
        magnitude: 0,
      }),
    ];
  }

  const nextLoads: Load[] = [];

  if (forceMagnitude > 0) {
    nextLoads.push(createNodalLoad({
      id: splitNeeded ? `${load.id}__force` : load.id,
      name: splitNeeded ? `${baseName} (force)` : baseName,
      comment: load.description,
      nodeId: load.target.nodeId,
      kind: 'force',
      direction: forceDirection,
      magnitude: forceMagnitude,
    }));
  }

  if (momentMagnitude > 0) {
    nextLoads.push(createNodalLoad({
      id: splitNeeded ? `${load.id}__moment` : load.id,
      name: splitNeeded ? `${baseName} (moment)` : baseName,
      comment: load.description,
      nodeId: load.target.nodeId,
      kind: 'moment',
      direction: momentDirection,
      magnitude: momentMagnitude,
    }));
  }

  return nextLoads;
}

function createNodalLoad({
  id,
  name,
  comment,
  nodeId,
  kind,
  direction,
  magnitude,
}: {
  id: string;
  name: string;
  comment?: string;
  nodeId: string;
  kind: NodalConcentratedLoad['kind'];
  direction: Vec3;
  magnitude: number;
}): NodalConcentratedLoad {
  return {
    id,
    type: 'nodal_concentrated',
    kind,
    name,
    comment,
    coordinateSystem: 'global',
    direction,
    target: {
      type: 'node',
      nodeId,
    },
    magnitude,
  };
}

function createLegacyMemberPlaceholderLoad({
  id,
  name,
  comment,
  memberId,
  kind,
  direction,
  magnitude,
}: {
  id: string;
  name: string;
  comment?: string;
  memberId: string;
  kind: MemberDistributedLoad['kind'];
  direction: Vec3;
  magnitude: number;
}): MemberDistributedLoad {
  return {
    id,
    type: 'member_distributed',
    kind,
    name,
    comment,
    coordinateSystem: 'global',
    direction,
    target: {
      type: 'member',
      memberId,
    },
    distribution: {
      type: 'function',
      expression: 'legacy_concentrated_member_load_placeholder',
      variables: {
        magnitude,
      },
      comment: 'Placeholder created during v0.1 to v0.2 migration. Review manually.',
    },
  };
}

function buildLegacyLoadName(description: string | undefined, loadCaseIndex: number, loadIndex: number): string {
  const normalized = description?.trim();
  if (normalized != null && normalized.length > 0 && normalized.length <= 64) {
    return normalized;
  }

  return `Load ${loadCaseIndex + 1}.${loadIndex + 1}`;
}

function appendMigrationComment(description: string | undefined, appendix: string): string {
  const normalized = description?.trim();
  return normalized != null && normalized.length > 0
    ? `${normalized}. ${appendix}`
    : appendix;
}

function readSchemaVersion(input: unknown): string | undefined {
  if (typeof input !== 'object' || input == null || !('schemaVersion' in input)) {
    return undefined;
  }

  const rawVersion = (input as { schemaVersion?: unknown }).schemaVersion;
  return typeof rawVersion === 'string' ? rawVersion : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}
