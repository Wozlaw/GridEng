import { GridEngModelSchema } from './schema';
import type { GridEngModel, Id, Member, Node } from './types';

export interface ModelValidationIssue {
  code:
    | 'schema_error'
    | 'duplicate_id'
    | 'missing_reference'
    | 'zero_length_member'
    | 'hanging_member'
    | 'empty_model';
  message: string;
  entityType?: 'node' | 'member' | 'profile' | 'material' | 'restraint' | 'loadCase';
  entityId?: Id;
}

export interface ModelValidationResult {
  ok: boolean;
  issues: ModelValidationIssue[];
}

export function parseGridEngModel(raw: unknown): GridEngModel {
  return GridEngModelSchema.parse(raw) as GridEngModel;
}

export function validateGridEngModel(raw: unknown): ModelValidationResult {
  const parsed = GridEngModelSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => ({
        code: 'schema_error',
        message: `${issue.path.join('.')}: ${issue.message}`,
      })),
    };
  }

  return validateModelTopology(parsed.data as GridEngModel);
}

export function validateModelTopology(model: GridEngModel): ModelValidationResult {
  const issues: ModelValidationIssue[] = [];

  if (model.nodes.length === 0 || model.members.length === 0) {
    issues.push({
      code: 'empty_model',
      message: 'Model should contain at least one node and one member.',
    });
  }

  collectDuplicateIds(model.nodes, 'node', issues);
  collectDuplicateIds(model.members, 'member', issues);
  collectDuplicateIds(model.profiles, 'profile', issues);
  collectDuplicateIds(model.materials, 'material', issues);
  collectDuplicateIds(model.restraints, 'restraint', issues);
  collectDuplicateIds(model.loadCases, 'loadCase', issues);

  const nodeIds = new Set(model.nodes.map((node) => node.id));
  const profileIds = new Set(model.profiles.map((profile) => profile.id));
  const materialIds = new Set(model.materials.map((material) => material.id));
  const nodeById = new Map(model.nodes.map((node) => [node.id, node] as const));

  for (const member of model.members) {
    if (!nodeIds.has(member.startNodeId)) {
      issues.push(missingReference('member', member.id, `Start node ${member.startNodeId} is missing.`));
    }
    if (!nodeIds.has(member.endNodeId)) {
      issues.push(missingReference('member', member.id, `End node ${member.endNodeId} is missing.`));
    }
    if (!profileIds.has(member.profileId)) {
      issues.push(missingReference('member', member.id, `Profile ${member.profileId} is missing.`));
    }
    if (!materialIds.has(member.materialId)) {
      issues.push(missingReference('member', member.id, `Material ${member.materialId} is missing.`));
    }

    const start = nodeById.get(member.startNodeId);
    const end = nodeById.get(member.endNodeId);
    if (start && end && distanceMm(start, end) <= Number.EPSILON) {
      issues.push({
        code: 'zero_length_member',
        message: `Member ${member.id} has zero length.`,
        entityType: 'member',
        entityId: member.id,
      });
    }
  }

  for (const member of findHangingMembers(model.members)) {
    issues.push({
      code: 'hanging_member',
      message: `Member ${member.id} is hanging: one or both end nodes are connected only to this member.`,
      entityType: 'member',
      entityId: member.id,
    });
  }

  return { ok: issues.length === 0, issues };
}

function collectDuplicateIds(
  entities: Array<{ id: Id }>,
  entityType: NonNullable<ModelValidationIssue['entityType']>,
  issues: ModelValidationIssue[],
): void {
  const seen = new Set<Id>();
  for (const entity of entities) {
    if (seen.has(entity.id)) {
      issues.push({
        code: 'duplicate_id',
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
    message,
    entityType,
    entityId,
  };
}

function distanceMm(start: Node, end: Node): number {
  const dx = end.position.x - start.position.x;
  const dy = end.position.y - start.position.y;
  const dz = end.position.z - start.position.z;
  return Math.hypot(dx, dy, dz);
}

export function findHangingMembers(members: Member[]): Member[] {
  const degreeByNodeId = new Map<Id, number>();
  for (const member of members) {
    degreeByNodeId.set(member.startNodeId, (degreeByNodeId.get(member.startNodeId) ?? 0) + 1);
    degreeByNodeId.set(member.endNodeId, (degreeByNodeId.get(member.endNodeId) ?? 0) + 1);
  }

  return members.filter((member) => {
    const startDegree = degreeByNodeId.get(member.startNodeId) ?? 0;
    const endDegree = degreeByNodeId.get(member.endNodeId) ?? 0;
    return startDegree <= 1 || endDegree <= 1;
  });
}
