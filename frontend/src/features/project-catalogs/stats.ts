import type { GridEngModel, Id, Material, Member, Profile } from '../../entities/model';

export interface UsageStats {
  membersCount: number;
  totalLengthMm: number;
  totalMassKg: number;
}

export function getProfileUsageStats(model: GridEngModel, profileId: Id): UsageStats {
  const nodesById = new Map(model.nodes.map((node) => [node.id, node] as const));
  const members = model.members.filter((member) => member.profileId === profileId);

  return accumulateUsageStats(members, model.profiles, nodesById);
}

export function getMaterialUsageStats(model: GridEngModel, materialId: Id): UsageStats {
  const nodesById = new Map(model.nodes.map((node) => [node.id, node] as const));
  const members = model.members.filter((member) => member.materialId === materialId);

  return accumulateUsageStats(members, model.profiles, nodesById);
}

function accumulateUsageStats(
  members: Member[],
  profiles: Profile[],
  nodesById: Map<Id, GridEngModel['nodes'][number]>,
): UsageStats {
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile] as const));

  return members.reduce<UsageStats>((summary, member) => {
    const lengthMm = getMemberLengthMm(member, nodesById);
    const profile = profilesById.get(member.profileId);
    const lengthM = lengthMm / 1000;
    const memberMassKg = (profile?.massKgPerM ?? 0) * lengthM;

    return {
      membersCount: summary.membersCount + 1,
      totalLengthMm: summary.totalLengthMm + lengthMm,
      totalMassKg: summary.totalMassKg + memberMassKg,
    };
  }, {
    membersCount: 0,
    totalLengthMm: 0,
    totalMassKg: 0,
  });
}

function getMemberLengthMm(
  member: Member,
  nodesById: Map<Id, GridEngModel['nodes'][number]>,
): number {
  const startNode = nodesById.get(member.startNodeId);
  const endNode = nodesById.get(member.endNodeId);

  if (startNode == null || endNode == null) {
    return 0;
  }

  const dx = endNode.position.x - startNode.position.x;
  const dy = endNode.position.y - startNode.position.y;
  const dz = endNode.position.z - startNode.position.z;

  return Math.hypot(dx, dy, dz);
}

export function getDisplayColor(profile: Profile | Material): string | undefined {
  return 'color' in profile ? profile.color : undefined;
}
