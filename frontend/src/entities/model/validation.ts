import { ZodError } from 'zod';

import { isZeroVector } from './geometry';
import { migrateGridEngModelToCurrent } from './migrations';
import type { GridEngModel, Id, Load, Member, Node } from './types';

const ZERO_LENGTH_MEMBER_TOLERANCE_MM = 1e-6;

export type ModelValidationSeverity = 'error' | 'warning';

export interface ModelValidationIssue {
  code:
    | 'schema_error'
    | 'duplicate_id'
    | 'missing_reference'
    | 'zero_length_member'
    | 'hanging_member'
    | 'isolated_node'
    | 'empty_model'
    | 'invalid_direction'
    | 'unsupported_coordinate_system'
    | 'invalid_distribution_range'
    | 'unsupported_load_placeholder'
    | 'zero_magnitude_load';
  severity: ModelValidationSeverity;
  message: string;
  entityType?: 'node' | 'member' | 'profile' | 'material' | 'restraint' | 'loadCase' | 'load';
  entityId?: Id;
}

export interface ModelValidationResult {
  ok: boolean;
  errors: ModelValidationIssue[];
  warnings: ModelValidationIssue[];
  issues: ModelValidationIssue[];
}

export type ModelValidationReport = ModelValidationResult;

export function parseGridEngModel(raw: unknown): GridEngModel {
  return migrateGridEngModelToCurrent(raw);
}

export function safeParseGridEngModel(raw: unknown) {
  try {
    return {
      success: true as const,
      data: parseGridEngModel(raw),
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false as const,
        error,
      };
    }

    throw error;
  }
}

export function validateGridEngModel(raw: unknown): ModelValidationResult {
  const parsed = safeParseGridEngModel(raw);
  if (!parsed.success) {
    return buildValidationResult({
      errors: parsed.error.issues.map((issue) => ({
        code: 'schema_error',
        severity: 'error',
        message: issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message,
      })),
      warnings: [],
    });
  }

  return validateParsedModel(parsed.data as GridEngModel);
}

export function validateGridEngModelIntegrity(model: GridEngModel): ModelValidationResult {
  return validateParsedModel(model);
}

export const validateModelTopology = validateGridEngModelIntegrity;

export function findHangingMembers(members: Member[]): Member[] {
  const degreeByNodeId = createNodeDegreeMap(members);

  return members.filter((member) => {
    const startDegree = degreeByNodeId.get(member.startNodeId) ?? 0;
    const endDegree = degreeByNodeId.get(member.endNodeId) ?? 0;
    return startDegree <= 1 || endDegree <= 1;
  });
}

function validateParsedModel(model: GridEngModel): ModelValidationResult {
  const errors: ModelValidationIssue[] = [];
  const warnings: ModelValidationIssue[] = [];

  if (model.nodes.length === 0 || model.members.length === 0) {
    errors.push({
      code: 'empty_model',
      severity: 'error',
      message: 'Model should contain at least one node and one member.',
    });
  }

  collectDuplicateIds(model.nodes, 'node', errors);
  collectDuplicateIds(model.members, 'member', errors);
  collectDuplicateIds(model.profiles, 'profile', errors);
  collectDuplicateIds(model.materials, 'material', errors);
  collectDuplicateIds(model.restraints, 'restraint', errors);
  collectDuplicateIds(model.loadCases, 'loadCase', errors);
  collectDuplicateIds(
    model.loadCases.flatMap((loadCase) => loadCase.loads),
    'load',
    errors,
  );

  const nodeIds = new Set(model.nodes.map((node) => node.id));
  const memberIds = new Set(model.members.map((member) => member.id));
  const profileIds = new Set(model.profiles.map((profile) => profile.id));
  const materialIds = new Set(model.materials.map((material) => material.id));
  const nodeById = new Map(model.nodes.map((node) => [node.id, node] as const));
  const degreeByNodeId = createNodeDegreeMap(model.members);

  for (const restraint of model.restraints) {
    if (!nodeIds.has(restraint.nodeId)) {
      errors.push(missingReference('restraint', restraint.id, `Node ${restraint.nodeId} is missing.`));
    }
  }

  for (const member of model.members) {
    if (!nodeIds.has(member.startNodeId)) {
      errors.push(missingReference('member', member.id, `Start node ${member.startNodeId} is missing.`));
    }
    if (!nodeIds.has(member.endNodeId)) {
      errors.push(missingReference('member', member.id, `End node ${member.endNodeId} is missing.`));
    }
    if (!profileIds.has(member.profileId)) {
      errors.push(missingReference('member', member.id, `Profile ${member.profileId} is missing.`));
    }
    if (!materialIds.has(member.materialId)) {
      errors.push(missingReference('member', member.id, `Material ${member.materialId} is missing.`));
    }

    const start = nodeById.get(member.startNodeId);
    const end = nodeById.get(member.endNodeId);
    if (start && end && distanceMm(start, end) <= ZERO_LENGTH_MEMBER_TOLERANCE_MM) {
      errors.push({
        code: 'zero_length_member',
        severity: 'error',
        message: `Member ${member.id} has zero length.`,
        entityType: 'member',
        entityId: member.id,
      });
    }
  }

  for (const loadCase of model.loadCases) {
    for (const load of loadCase.loads) {
      validateLoad(load, nodeIds, memberIds, errors, warnings);
    }
  }

  for (const member of findHangingMembers(model.members)) {
    warnings.push({
      code: 'hanging_member',
      severity: 'warning',
      message: `Member ${member.id} is hanging: one or both end nodes are connected only to this member.`,
      entityType: 'member',
      entityId: member.id,
    });
  }

  for (const node of model.nodes) {
    if ((degreeByNodeId.get(node.id) ?? 0) === 0) {
      warnings.push({
        code: 'isolated_node',
        severity: 'warning',
        message: `Node ${node.id} is isolated and not connected to any member.`,
        entityType: 'node',
        entityId: node.id,
      });
    }
  }

  return buildValidationResult({ errors, warnings });
}

function validateLoad(
  load: Load,
  nodeIds: Set<Id>,
  memberIds: Set<Id>,
  errors: ModelValidationIssue[],
  warnings: ModelValidationIssue[],
): void {
  if (load.coordinateSystem !== 'global') {
    errors.push({
      code: 'unsupported_coordinate_system',
      severity: 'error',
      message: `Load ${load.id} uses unsupported coordinate system '${load.coordinateSystem}'.`,
      entityType: 'load',
      entityId: load.id,
    });
  }

  if (load.type === 'nodal_concentrated') {
    if (!nodeIds.has(load.target.nodeId)) {
      errors.push(missingReference('load', load.id, `Node ${load.target.nodeId} is missing.`));
    }

    if (load.magnitude !== 0 && isZeroVector(load.direction)) {
      errors.push(invalidDirection(load.id));
    }

    if (load.magnitude === 0) {
      warnings.push({
        code: 'zero_magnitude_load',
        severity: 'warning',
        message: `Load ${load.id} has zero magnitude and should be reviewed.`,
        entityType: 'load',
        entityId: load.id,
      });
    }

    return;
  }

  if (!memberIds.has(load.target.memberId)) {
    errors.push(missingReference('load', load.id, `Member ${load.target.memberId} is missing.`));
  }

  if (load.distribution.type === 'linear') {
    const xStartRel = load.distribution.xStartRel ?? 0;
    const xEndRel = load.distribution.xEndRel ?? 1;

    if ((load.distribution.qStart !== 0 || load.distribution.qEnd !== 0) && isZeroVector(load.direction)) {
      errors.push(invalidDirection(load.id));
    }

    if (xStartRel < 0 || xStartRel > 1 || xEndRel < 0 || xEndRel > 1 || xStartRel >= xEndRel) {
      errors.push({
        code: 'invalid_distribution_range',
        severity: 'error',
        message: `Load ${load.id} has invalid linear distribution range ${xStartRel}..${xEndRel}.`,
        entityType: 'load',
        entityId: load.id,
      });
    }

    if (load.distribution.qStart === 0 && load.distribution.qEnd === 0) {
      warnings.push({
        code: 'zero_magnitude_load',
        severity: 'warning',
        message: `Load ${load.id} has zero distributed magnitude and should be reviewed.`,
        entityType: 'load',
        entityId: load.id,
      });
    }

    return;
  }

  if (isZeroVector(load.direction)) {
    errors.push(invalidDirection(load.id));
  }

  warnings.push({
    code: 'unsupported_load_placeholder',
    severity: 'warning',
    message: `Load ${load.id} uses reserved function distribution and is treated as unsupported placeholder.`,
    entityType: 'load',
    entityId: load.id,
  });
}

function invalidDirection(loadId: Id): ModelValidationIssue {
  return {
    code: 'invalid_direction',
    severity: 'error',
    message: `Load ${loadId} has an invalid zero direction vector.`,
    entityType: 'load',
    entityId: loadId,
  };
}

function buildValidationResult({
  errors,
  warnings,
}: {
  errors: ModelValidationIssue[];
  warnings: ModelValidationIssue[];
}): ModelValidationResult {
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    issues: [...errors, ...warnings],
  };
}

function collectDuplicateIds(
  entities: Array<{ id: Id }>,
  entityType: NonNullable<ModelValidationIssue['entityType']>,
  errors: ModelValidationIssue[],
): void {
  const seen = new Set<Id>();

  for (const entity of entities) {
    if (seen.has(entity.id)) {
      errors.push({
        code: 'duplicate_id',
        severity: 'error',
        message: `Duplicate ${entityType} id: ${entity.id}.`,
        entityType,
        entityId: entity.id,
      });
    }

    seen.add(entity.id);
  }
}

function missingReference(
  entityType: NonNullable<ModelValidationIssue['entityType']>,
  entityId: Id,
  message: string,
): ModelValidationIssue {
  return {
    code: 'missing_reference',
    severity: 'error',
    message,
    entityType,
    entityId,
  };
}

function createNodeDegreeMap(members: Member[]): Map<Id, number> {
  const degreeByNodeId = new Map<Id, number>();

  for (const member of members) {
    degreeByNodeId.set(member.startNodeId, (degreeByNodeId.get(member.startNodeId) ?? 0) + 1);
    degreeByNodeId.set(member.endNodeId, (degreeByNodeId.get(member.endNodeId) ?? 0) + 1);
  }

  return degreeByNodeId;
}

function distanceMm(start: Node, end: Node): number {
  const dx = end.position.x - start.position.x;
  const dy = end.position.y - start.position.y;
  const dz = end.position.z - start.position.z;

  return Math.hypot(dx, dy, dz);
}
