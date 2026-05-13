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
  DxfGroupPreviewDiagnostics,
  DxfMemberPreviewDiagnostics,
  DxfPreviewDiagnostic,
  DxfPreviewDiagnosticCode,
  DxfPreviewDiagnosticStatus,
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
        diagnostics: {
          ...createEmptyPreview().diagnostics,
          summary: [
            createDiagnostic('error', 'unexpected_import_error', formatUnknownError(error)),
          ],
        },
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
    const message = `Ignored ${ignoredEntitiesCount} non-LINE DXF entities.`;
    warnings.push(message);
    preview.diagnostics.summary.push(createDiagnostic('warning', 'ignored_entities_present', message));
  }

  if (lines.length === 0) {
    const message = 'DXF file does not contain any LINE entities.';
    errors.push(message);
    preview.diagnostics.summary.push(createDiagnostic('error', 'no_line_entities', message));
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
  preview.diagnostics.lines = normalized.lines.map((line, lineIndex) => ({
    lineIndex,
    start: { ...line.start },
    end: { ...line.end },
    handle: line.handle,
    layer: line.layer,
    status: 'ok',
    displayColor: toDisplayColor(line.trueColor ?? line.color),
    diagnostics: [],
  }));

  if (!normalized.diagnostics.is3D) {
    const message = options.force2DToXY
        ? 'DXF geometry was recognized as 2D and projected to the XY plane with Z=0.'
        : 'DXF geometry was recognized as 2D.';
    warnings.push(message);
    preview.diagnostics.summary.push(
      createDiagnostic(
        'warning',
        options.force2DToXY ? 'recognized_as_2d_projected' : 'recognized_as_2d',
        message,
      ),
    );
  }

  const merged = mergeDxfNodes(normalized.lines, options.toleranceMm);
  preview.nodesCount = merged.nodes.length;
  preview.mergedNodesCount = merged.mergedNodesCount;
  preview.diagnostics.nodes = merged.nodes.map((node) => ({
    nodeId: node.id,
    status: 'ok',
    diagnostics: [],
  }));

  const colorGroups = new Map<string, DxfColorGroup>();
  const groupDiagnostics = new Map<string, DxfGroupPreviewDiagnostics>();
  const colorProfileMap: Record<string, string> = {};
  const layerMap: Record<string, string> = {};
  const members: Member[] = [];
  const memberDiagnostics: DxfMemberPreviewDiagnostics[] = [];

  for (const [lineIndex, line] of normalized.lines.entries()) {
    const lineDiagnostic = preview.diagnostics.lines[lineIndex];
    const endpointIds = merged.endpointNodeIds[lineIndex];
    if (endpointIds == null) {
      const message = `LINE at index ${lineIndex} could not be mapped to merged DXF nodes.`;
      errors.push(message);
      pushDiagnostic(lineDiagnostic, createDiagnostic('error', 'line_node_mapping_failed', message));
      continue;
    }

    if (endpointIds.startNodeId === endpointIds.endNodeId) {
      const message = `LINE at index ${lineIndex} collapses to zero length after node merge.`;
      errors.push(message);
      pushDiagnostic(lineDiagnostic, createDiagnostic('error', 'line_zero_length_after_merge', message));
      continue;
    }

    const group = getOrCreateColorGroup(colorGroups, line);
    lineDiagnostic.groupKey = group.key;
    colorProfileMap[group.key] = group.profileId ?? createProfileId(group.key);
    group.profileId = colorProfileMap[group.key];

    if (line.layer) {
      layerMap[line.layer] = group.key;
    }

    const memberId = `M${members.length + 1}`;
    group.membersCount += 1;
    group.memberIds.push(memberId);
    members.push({
      id: memberId,
      startNodeId: endpointIds.startNodeId,
      endNodeId: endpointIds.endNodeId,
      profileId: group.profileId,
      materialId: 'MAT_STEEL',
      groupId: group.key,
      source: buildSourceRef(line),
    });

    memberDiagnostics.push({
      memberId,
      lineIndex,
      startNodeId: endpointIds.startNodeId,
      endNodeId: endpointIds.endNodeId,
      handle: line.handle,
      layer: line.layer,
      groupKey: group.key,
      status: 'ok',
      diagnostics: [],
    });
    lineDiagnostic.memberId = memberId;

    groupDiagnostics.set(
      group.key,
      syncGroupDiagnostics(groupDiagnostics.get(group.key), group),
    );
  }

  preview.membersCount = members.length;
  preview.colorGroups = Array.from(colorGroups.values());
  preview.diagnostics.members = memberDiagnostics;
  preview.diagnostics.groups = Array.from(groupDiagnostics.values()).map((groupDiagnostic) => {
    const nextGroupDiagnostic = { ...groupDiagnostic, memberIds: [...groupDiagnostic.memberIds] };

    pushDiagnostic(
      nextGroupDiagnostic,
      createDiagnostic(
        'warning',
        'group_profile_unassigned',
        `Group ${groupDiagnostic.groupKey} still uses temporary DXF profile ${groupDiagnostic.profileId ?? '-'}.`,
      ),
    );

    return nextGroupDiagnostic;
  });

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
  applyStructuredValidationDiagnostics(preview, validationReport.warnings);
  syncLineDiagnosticsFromMembersAndGroups(preview);

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
    schemaVersion: '0.2',
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
    memberIds: [],
    profileId: createProfileId(seed.key),
    temporaryProfileName: createTemporaryProfileName(seed.key),
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
    name: group.temporaryProfileName ?? createTemporaryProfileName(group.key),
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

function createTemporaryProfileName(groupKey: string): string {
  return `DXF ${groupKey}`;
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
    diagnostics: {
      summary: [],
      lines: [],
      members: [],
      nodes: [],
      groups: [],
    },
    warnings: [],
    errors: [],
  };
}

function createDiagnostic(
  status: DxfPreviewDiagnosticStatus,
  code: DxfPreviewDiagnosticCode,
  message: string,
): DxfPreviewDiagnostic {
  return {
    status,
    code,
    message,
  };
}

function pushDiagnostic<
  TEntry extends {
    status: DxfPreviewDiagnosticStatus;
    diagnostics: DxfPreviewDiagnostic[];
  },
>(entry: TEntry, diagnostic: DxfPreviewDiagnostic): void {
  entry.diagnostics.push(diagnostic);
  entry.status = getHigherStatus(entry.status, diagnostic.status);
}

function getHigherStatus(
  current: DxfPreviewDiagnosticStatus,
  next: DxfPreviewDiagnosticStatus,
): DxfPreviewDiagnosticStatus {
  const rank: Record<DxfPreviewDiagnosticStatus, number> = {
    ok: 0,
    warning: 1,
    error: 2,
  };

  return rank[next] > rank[current] ? next : current;
}

function syncGroupDiagnostics(
  current: DxfGroupPreviewDiagnostics | undefined,
  group: DxfColorGroup,
): DxfGroupPreviewDiagnostics {
  if (current != null) {
    return {
      ...current,
      profileId: group.profileId,
      temporaryProfileName: group.temporaryProfileName,
      layer: group.layer,
      memberIds: [...group.memberIds],
    };
  }

  return {
    groupKey: group.key,
    profileId: group.profileId,
    temporaryProfileName: group.temporaryProfileName,
    layer: group.layer,
    memberIds: [...group.memberIds],
    status: 'ok',
    diagnostics: [],
  };
}

function applyStructuredValidationDiagnostics(
  preview: DxfImportPreview,
  issues: ModelValidationIssue[],
): void {
  for (const issue of issues) {
    if (issue.code === 'hanging_member' && issue.entityId != null) {
      const memberDiagnostic = preview.diagnostics.members.find(
        (entry) => entry.memberId === issue.entityId,
      );

      if (memberDiagnostic != null) {
        pushDiagnostic(
          memberDiagnostic,
          createDiagnostic('warning', 'member_hanging', issue.message),
        );
      }

      continue;
    }

    if (issue.code === 'isolated_node' && issue.entityId != null) {
      const nodeDiagnostic = preview.diagnostics.nodes.find((entry) => entry.nodeId === issue.entityId);

      if (nodeDiagnostic != null) {
        pushDiagnostic(
          nodeDiagnostic,
          createDiagnostic('warning', 'node_isolated', issue.message),
        );
      }
    }
  }
}

function syncLineDiagnosticsFromMembersAndGroups(preview: DxfImportPreview): void {
  const memberDiagnosticsById = new Map(
    preview.diagnostics.members.map((entry) => [entry.memberId, entry] as const),
  );
  const groupDiagnosticsByKey = new Map(
    preview.diagnostics.groups.map((entry) => [entry.groupKey, entry] as const),
  );

  for (const lineDiagnostic of preview.diagnostics.lines) {
    const memberDiagnostic = lineDiagnostic.memberId != null
      ? memberDiagnosticsById.get(lineDiagnostic.memberId)
      : undefined;
    const groupDiagnostic = lineDiagnostic.groupKey != null
      ? groupDiagnosticsByKey.get(lineDiagnostic.groupKey)
      : undefined;

    if (memberDiagnostic != null) {
      lineDiagnostic.status = getHigherStatus(lineDiagnostic.status, memberDiagnostic.status);
    }

    if (groupDiagnostic != null) {
      lineDiagnostic.status = getHigherStatus(lineDiagnostic.status, groupDiagnostic.status);
    }
  }
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
