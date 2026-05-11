import { findProfileById } from '../../entities/section';
import type { GridEngModel, Profile } from '../../entities/model';

import { KEEP_DXF_CUSTOM_PROFILE_ID, type DxfProfileAssignments } from './types';

export function applyDxfProfileAssignments(
  model: GridEngModel,
  assignments: DxfProfileAssignments,
): GridEngModel {
  const nextMembers = model.members.map((member) => {
    const selectedProfileId = member.groupId == null ? undefined : assignments[member.groupId];
    if (selectedProfileId == null || selectedProfileId === KEEP_DXF_CUSTOM_PROFILE_ID) {
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

function cloneProfile(profile: Readonly<Profile>): Profile {
  return {
    ...profile,
    params: { ...profile.params },
    section: { ...profile.section },
  };
}
