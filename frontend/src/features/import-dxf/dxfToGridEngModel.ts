import {
  validateGridEngModelIntegrity,
  type DxfEntitySource,
  type DxfColorValue,
  type GridEngModel,
  type Member,
  type ModelValidationIssue,
  type Profile,
} from '../../entities/model';
import { DEFAULT_STEEL, DEFAULT_UNITS, NO_WIND } from '../../entities/model/defaults';
import { mergeDxfNodes } from './mergeDxfNodes';
import { normalizeDxfCoordinates } from './normalizeDxfCoordinates';
import { parseDxfLines } from './parseDxfLines';
import type {
  DxfColorGroup,
  DxfImportOptions,
  DxfImportPreview,
  DxfLineEntity,
  DxfToGridEngModelResult,
} from './types';

interface CreateModelFromLinesContext {
  lines: DxfLineEntity[];
  ignoredEntitiesCount: number;
  options: DxfImportOptions;
}

interface ColorGroupSeed {
  key: string;
  color?: DxfColorValue;
  colorIndex?: number;
  trueColor?: DxfColorValue;
  layer?: string;
}

export function convertDxfToGridEngModel(
  dxfText: string,
  options: DxfImportOptions,
): DxfToGridEngModelResult {
  try {
    const parsed = parseDxfLines(dxfText);
    return createModelFromDxfLines(parsed.lines, options, parsed.ignoredEntitiesCount);
  } catch (error) {
    return {
      model: null,
      preview: {
        ...createEmptyPreview(),
        errors: [formatUnknownError(error)],
      },
    };
  }
}

export function createModelFromDxfLines(
  lines: DxfLineEntity[],
  options: DxfImportOptions,
  ignoredEntitiesCount = 0,
): DxfToGridEngModelResult {
  return buildModelFromLines({
    lines,
    ignoredEntitiesCount,
    options,
  });
}

function buildModelFromLines({
  lines,
  ignoredEntitiesCount,
  options,
}: CreateModelFromLinesContext): DxfToGridEngModelResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const preview: DxfImportPreview = {
    ...createEmptyPreview(),
    linesCount: lines.length,
    ignoredEntitiesCount,
  };

  if (ignoredEntitiesCount > 0) {
    warnings.push(`Ignored ${ignoredEntitiesCount} non-LINE DXF entities.`);
  }

  if (lines.length === 0) {
    errors.push('DXF file does not contain any LINE entities.');
    return {
      model: null,
      preview: {
        ...preview,
        warnings,
        errors,
      },
    };
  }

  const normalized = normalizeDxfCoordinates(lines, options);
  preview.is3D = normalized.diagnostics.is3D;
  preview.zRange = normalized.diagnostics.zRange;

  if (!normalized.diagnostics.is3D) {
    warnings.push(
      options.force2DToXY
        ? 'DXF geometry was recognized as 2D and projected to the XY plane with Z=0.'
        : 'DXF geometry was recognized as 2D.',
    );
  }

  const merged = mergeDxfNodes(normalized.lines, options.toleranceMm);
  preview.nodesCount = merged.nodes.length;
  preview.mergedNodesCount = merged.mergedNodesCount;

  const colorGroups = new Map<string, DxfColorGroup>();
  const colorProfileMap: Record<string, string> = {};
  const layerMap: Record<string, string> = {};
  const members: Member[] = [];

  for (const [lineIndex, line] of normalized.lines.entries()) {
    const endpointIds = merged.endpointNodeIds[lineIndex];
    if (endpointIds == null) {
      errors.push(`LINE at index ${lineIndex} could not be mapped to merged DXF nodes.`);
      continue;
    }

    if (endpointIds.startNodeId === endpointIds.endNodeId) {
      errors.push(`LINE at index ${lineIndex} collapses to zero length after node merge.`);
      continue;
    }

    const group = getOrCreateColorGroup(colorGroups, line);
    colorProfileMap[group.key] = group.profileId ?? createProfileId(group.key);
    group.profileId = colorProfileMap[group.key];

    if (line.layer) {
      layerMap[line.layer] = group.key;
    }

    group.membersCount += 1;
    members.push({
      id: `M${members.length + 1}`,
      startNodeId: endpointIds.startNodeId,
      endNodeId: endpointIds.endNodeId,
      profileId: group.profileId,
      materialId: 'MAT_STEEL',
      groupId: group.key,
      source: buildSourceRef(line),
    });
  }

  preview.membersCount = members.length;
  preview.colorGroups = Array.from(colorGroups.values());

  const model = createDxfModel({
    fileName: options.fileName,
    toleranceMm: options.toleranceMm,
    centerOnXY: options.centerOnXY,
    is3D: normalized.diagnostics.is3D,
    nodes: merged.nodes,
    members,
    profiles: preview.colorGroups.map(createTemporaryProfile),
    colorProfileMap,
    layerMap,
    warnings,
  });

  const validationReport = validateGridEngModelIntegrity(model);
  preview.danglingMembersCount = countValidationIssues(validationReport.warnings, 'hanging_member');

  appendValidationIssues(warnings, validationReport.warnings);
  appendValidationIssues(errors, validationReport.errors);

  preview.warnings = warnings;
  preview.errors = errors;
  model.importMeta = {
    source: 'dxf',
    dxf: {
      fileName: options.fileName,
      importedLineCount: members.length,
      skippedEntityCount: ignoredEntitiesCount,
      hasNonZeroZ: normalized.diagnostics.is3D,
      assumedOrientation: normalized.diagnostics.is3D ? undefined : 'XY_Z_UP',
      toleranceMm: options.toleranceMm,
      colorProfileMap,
      layerMap,
      warnings: preview.warnings,
    },
  };

  return {
    model: preview.errors.length === 0 ? model : null,
    preview,
  };
}

function createDxfModel({
  fileName,
  toleranceMm,
  centerOnXY,
  is3D,
  nodes,
  members,
  profiles,
  colorProfileMap,
  layerMap,
  warnings,
}: {
  fileName: string;
  toleranceMm: number;
  centerOnXY: boolean;
  is3D: boolean;
  nodes: GridEngModel['nodes'];
  members: Member[];
  profiles: Profile[];
  colorProfileMap: Record<string, string>;
  layerMap: Record<string, string>;
  warnings: string[];
}): GridEngModel {
  return {
    schemaVersion: '0.1',
    name: stripDxfExtension(fileName),
    units: { ...DEFAULT_UNITS },
    settings: {
      nodeMergeToleranceMm: toleranceMm,
      centerModelByXYProjection: centerOnXY,
      verticalAxis: 'Z',
    },
    nodes,
    members,
    profiles,
    materials: [
      {
        ...DEFAULT_STEEL,
        id: 'MAT_STEEL',
        name: 'Steel',
      },
    ],
    restraints: [],
    loadCases: [
      {
        id: 'LC1',
        name: 'LC1',
        loads: [],
        wind: { ...NO_WIND },
      },
    ],
    importMeta: {
      source: 'dxf',
      dxf: {
        fileName,
        importedLineCount: members.length,
        skippedEntityCount: 0,
        hasNonZeroZ: is3D,
        assumedOrientation: is3D ? undefined : 'XY_Z_UP',
        toleranceMm,
        colorProfileMap,
        layerMap,
        warnings,
      },
    },
  };
}

function getOrCreateColorGroup(
  colorGroups: Map<string, DxfColorGroup>,
  line: DxfLineEntity,
): DxfColorGroup {
  const seed = createColorGroupSeed(line);
  const existing = colorGroups.get(seed.key);
  if (existing != null) {
    return existing;
  }

  const next: DxfColorGroup = {
    ...seed,
    membersCount: 0,
    profileId: createProfileId(seed.key),
  };
  colorGroups.set(seed.key, next);
  return next;
}

function createColorGroupSeed(line: DxfLineEntity): ColorGroupSeed {
  if (line.trueColor != null) {
    return {
      key: `TRUECOLOR_${sanitizeGroupToken(String(line.trueColor))}`,
      color: line.color,
      trueColor: line.trueColor,
      layer: line.layer,
    };
  }

  if (typeof line.colorIndex === 'number') {
    return {
      key: `ACI_${sanitizeGroupToken(String(line.colorIndex))}`,
      color: line.color,
      colorIndex: line.colorIndex,
      layer: line.layer,
    };
  }

  if (line.layer && line.layer.trim().length > 0) {
    return {
      key: `LAYER_${sanitizeGroupToken(line.layer)}`,
      color: line.color,
      layer: line.layer,
    };
  }

  return {
    key: 'UNASSIGNED',
    color: line.color,
  };
}

function createTemporaryProfile(group: DxfColorGroup): Profile {
  return {
    id: group.profileId ?? createProfileId(group.key),
    name: `DXF ${group.key}`,
    kind: 'custom',
    params: {},
    defaultLocalAxisRotationDeg: 0,
    defaultOffsetYmm: 0,
    defaultOffsetZmm: 0,
    massKgPerM: 0,
    section: {},
    color: toDisplayColor(group.trueColor ?? group.color),
  };
}

function buildSourceRef(line: DxfLineEntity): DxfEntitySource {
  return {
    source: 'dxf',
    entityType: 'LINE',
    color: line.color,
    layer: line.layer,
    colorIndex: line.colorIndex,
    trueColor: line.trueColor,
    handle: line.handle,
  };
}

function appendValidationIssues(target: string[], issues: ModelValidationIssue[]): void {
  for (const issue of issues) {
    pushUnique(target, formatValidationIssue(issue));
  }
}

function countValidationIssues(
  issues: ModelValidationIssue[],
  code: ModelValidationIssue['code'],
): number {
  return issues.filter((issue) => issue.code === code).length;
}

function formatValidationIssue(issue: ModelValidationIssue): string {
  return issue.entityId != null
    ? `${issue.message} (${issue.code}: ${issue.entityId})`
    : `${issue.message} (${issue.code})`;
}

function createProfileId(groupKey: string): string {
  return `P_COLOR_${groupKey}`;
}

function sanitizeGroupToken(token: string): string {
  return token.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').toUpperCase() || 'UNASSIGNED';
}

function toDisplayColor(value: DxfColorValue | undefined): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return `#${Math.max(0, Math.trunc(value)).toString(16).padStart(6, '0').slice(-6)}`;
}

function createEmptyPreview(): DxfImportPreview {
  return {
    linesCount: 0,
    ignoredEntitiesCount: 0,
    is3D: false,
    zRange: null,
    nodesCount: 0,
    membersCount: 0,
    mergedNodesCount: 0,
    danglingMembersCount: 0,
    colorGroups: [],
    warnings: [],
    errors: [],
  };
}

function pushUnique(target: string[], message: string): void {
  if (!target.includes(message)) {
    target.push(message);
  }
}

function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown DXF import error.';
}

function stripDxfExtension(fileName: string): string {
  return fileName.replace(/\.dxf$/i, '');
}
