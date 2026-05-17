import { findProfileById } from '../../entities/section';
import type { GridEngModel, Id, Profile } from '../../entities/model';

import type {
  DxfColorGroup,
  DxfGroupPreviewDiagnostics,
  DxfImportPreview,
  DxfLinePreviewDiagnostics,
  DxfPreviewDiagnostic,
  DxfPreviewDiagnosticStatus,
  DxfProfileAssignments,
  DxfToGridEngModelResult,
} from './types';

export function applyDxfProfileAssignments(
  model: GridEngModel,
  assignments: DxfProfileAssignments,
  resolvedProfilesById: ReadonlyMap<Id, Profile> = new Map(),
): GridEngModel {
  const nextMembers = model.members.map((member) => {
    const selectedProfileId = member.groupId == null ? undefined : assignments[member.groupId];
    if (selectedProfileId == null) {
      return { ...member };
    }

    return {
      ...member,
      profileId: selectedProfileId,
    };
  });

  const existingProfilesById = new Map(model.profiles.map((profile) => [profile.id, profile] as const));
  const usedProfileIds = new Set(nextMembers.map((member) => member.profileId));
  const nextProfiles: Profile[] = [];

  for (const profileId of usedProfileIds) {
    const resolvedProfile = resolvedProfilesById.get(profileId);
    if (resolvedProfile != null) {
      nextProfiles.push(cloneProfile(resolvedProfile));
      continue;
    }

    const existingProfile = existingProfilesById.get(profileId);
    if (existingProfile != null) {
      nextProfiles.push(cloneProfile(existingProfile));
      continue;
    }

    const catalogProfile = findProfileById(profileId);
    if (catalogProfile != null) {
      nextProfiles.push(catalogProfile);
      continue;
    }

    throw new Error(`Assigned profile '${profileId}' was not found in the imported model or local profile catalog.`);
  }

  const nextColorProfileMap = buildColorProfileMap(nextMembers);

  return {
    ...model,
    members: nextMembers,
    profiles: nextProfiles,
    importMeta: model.importMeta?.source === 'dxf'
      ? {
        ...model.importMeta,
        dxf: model.importMeta.dxf == null
          ? undefined
          : {
            ...model.importMeta.dxf,
            colorProfileMap: nextColorProfileMap,
          },
      }
      : model.importMeta,
  };
}

export function applyDxfProfileAssignmentsToPreview(
  preview: DxfImportPreview,
  assignments: DxfProfileAssignments,
): DxfImportPreview {
  const groupDiagnostics = preview.diagnostics.groups.map((entry) =>
    applyAssignmentsToGroupDiagnostics(entry, assignments),
  );
  const groupStatusByKey = new Map(groupDiagnostics.map((entry) => [entry.groupKey, entry.status] as const));
  const memberStatusById = new Map(preview.diagnostics.members.map((entry) => [entry.memberId, entry.status] as const));

  return {
    ...preview,
    colorGroups: preview.colorGroups.map((group) => applyAssignmentsToColorGroup(group, assignments)),
    diagnostics: {
      summary: preview.diagnostics.summary.map(cloneDiagnostic),
      lines: preview.diagnostics.lines.map((entry) =>
        applyAssignmentsToLineDiagnostics(entry, groupStatusByKey, memberStatusById),
      ),
      members: preview.diagnostics.members.map((entry) => ({
        ...entry,
        diagnostics: entry.diagnostics.map(cloneDiagnostic),
      })),
      nodes: preview.diagnostics.nodes.map((entry) => ({
        ...entry,
        diagnostics: entry.diagnostics.map(cloneDiagnostic),
      })),
      groups: groupDiagnostics,
    },
    warnings: [...preview.warnings],
    errors: [...preview.errors],
  };
}

export function applyDxfProfileAssignmentsToResult(
  result: DxfToGridEngModelResult,
  assignments: DxfProfileAssignments,
  resolvedProfilesById: ReadonlyMap<Id, Profile> = new Map(),
): DxfToGridEngModelResult {
  const preview = applyDxfProfileAssignmentsToPreview(result.preview, assignments);

  return {
    model: result.model == null ? null : applyDxfProfileAssignments(result.model, assignments, resolvedProfilesById),
    preview,
  };
}

export function buildInitialDxfProfileAssignments(preview: DxfImportPreview): DxfProfileAssignments {
  const assignments: DxfProfileAssignments = {};

  for (const group of preview.colorGroups) {
    if (group.profileId == null) {
      continue;
    }

    if (findProfileById(group.profileId) != null) {
      assignments[group.key] = group.profileId;
    }
  }

  return assignments;
}

function buildColorProfileMap(members: GridEngModel['members']): Record<string, string> {
  const map: Record<string, string> = {};

  for (const member of members) {
    if (member.groupId == null) {
      continue;
    }

    map[member.groupId] = member.profileId;
  }

  return map;
}

function applyAssignmentsToColorGroup(
  group: DxfColorGroup,
  assignments: DxfProfileAssignments,
): DxfColorGroup {
  return {
    ...group,
    memberIds: [...group.memberIds],
    profileId: assignments[group.key] ?? group.profileId,
  };
}

function applyAssignmentsToGroupDiagnostics(
  entry: DxfGroupPreviewDiagnostics,
  assignments: DxfProfileAssignments,
): DxfGroupPreviewDiagnostics {
  const assignedProfileId = assignments[entry.groupKey];
  const diagnostics = entry.diagnostics
    .filter((diagnostic) => assignedProfileId == null || diagnostic.code !== 'group_profile_unassigned')
    .map(cloneDiagnostic);

  return {
    ...entry,
    profileId: assignedProfileId ?? entry.profileId,
    memberIds: [...entry.memberIds],
    diagnostics,
    status: getDiagnosticCollectionStatus(diagnostics),
  };
}

function applyAssignmentsToLineDiagnostics(
  entry: DxfLinePreviewDiagnostics,
  groupStatusByKey: ReadonlyMap<string, DxfPreviewDiagnosticStatus>,
  memberStatusById: ReadonlyMap<Id, DxfPreviewDiagnosticStatus>,
): DxfLinePreviewDiagnostics {
  let status = getDiagnosticCollectionStatus(entry.diagnostics);

  if (entry.memberId != null) {
    status = getHigherStatus(status, memberStatusById.get(entry.memberId));
  }

  if (entry.groupKey != null) {
    status = getHigherStatus(status, groupStatusByKey.get(entry.groupKey));
  }

  return {
    ...entry,
    diagnostics: entry.diagnostics.map(cloneDiagnostic),
    status,
  };
}

function getDiagnosticCollectionStatus(
  diagnostics: readonly DxfPreviewDiagnostic[],
): DxfPreviewDiagnosticStatus {
  let status: DxfPreviewDiagnosticStatus = 'ok';

  for (const diagnostic of diagnostics) {
    status = getHigherStatus(status, diagnostic.status);
  }

  return status;
}

function getHigherStatus(
  current: DxfPreviewDiagnosticStatus,
  next: DxfPreviewDiagnosticStatus | undefined,
): DxfPreviewDiagnosticStatus {
  if (next == null) {
    return current;
  }

  const rank: Record<DxfPreviewDiagnosticStatus, number> = {
    ok: 0,
    warning: 1,
    error: 2,
  };

  return rank[next] > rank[current] ? next : current;
}

function cloneProfile(profile: Readonly<Profile>): Profile {
  return {
    ...profile,
    params: { ...profile.params },
    section: { ...profile.section },
  };
}

function cloneDiagnostic(diagnostic: Readonly<DxfPreviewDiagnostic>): DxfPreviewDiagnostic {
  return {
    ...diagnostic,
  };
}
