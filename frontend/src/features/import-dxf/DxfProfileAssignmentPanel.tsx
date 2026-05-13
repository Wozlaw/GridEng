import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import {
  Alert,
  Box,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { getProfileCatalog } from '../../entities/section';
import type { Id, Profile } from '../../entities/model';
import { useI18n } from '../../shared/i18n';
import type { DxfColorGroup, DxfProfileAssignments } from './types';

const ALL_PROFILE_TYPES = '__all__';
const PROFILE_TYPE_PRIORITY = ['angle', 'flat', 'square'];

interface DxfProfileAssignmentPanelProps {
  groups: DxfColorGroup[];
  assignments: DxfProfileAssignments;
  onAssignmentsChange: (assignments: DxfProfileAssignments) => void;
}

interface ProfileTypeOption {
  id: string;
  label: string;
}

interface NormalizedProfileType {
  id: string;
  label: string;
}

interface KnownProfileTypeLabels {
  angle: string;
  flat: string;
  square: string;
  pipe: string;
  channel: string;
  ibeam: string;
  round: string;
  custom: string;
}

export function DxfProfileAssignmentPanel({
  groups,
  assignments,
  onAssignmentsChange,
}: DxfProfileAssignmentPanelProps) {
  const { t } = useI18n();
  const catalogProfiles = useMemo(() => getProfileCatalog(), []);
  const knownProfileTypeLabels = useMemo<KnownProfileTypeLabels>(() => ({
    angle: t('dxf.assignment.kind.angle'),
    flat: t('dxf.assignment.kind.flat'),
    square: t('dxf.assignment.kind.square'),
    pipe: t('dxf.assignment.kind.pipe'),
    channel: t('dxf.assignment.kind.channel'),
    ibeam: t('dxf.assignment.kind.ibeam'),
    round: t('dxf.assignment.kind.round'),
    custom: t('dxf.assignment.kind.custom'),
  }), [t]);
  const profileTypeById = useMemo(() => {
    const map = new Map<Id, NormalizedProfileType>();

    for (const profile of catalogProfiles) {
      map.set(profile.id, normalizeProfileType(profile, knownProfileTypeLabels));
    }

    return map;
  }, [catalogProfiles, knownProfileTypeLabels]);
  const profileTypeOptions = useMemo(() => {
    const types = new Map<string, ProfileTypeOption>();

    for (const profile of catalogProfiles) {
      const normalized = normalizeProfileType(profile, knownProfileTypeLabels);
      if (!types.has(normalized.id)) {
        types.set(normalized.id, normalized);
      }
    }

    return Array.from(types.values()).sort((left, right) => {
      const leftPriority = PROFILE_TYPE_PRIORITY.indexOf(left.id);
      const rightPriority = PROFILE_TYPE_PRIORITY.indexOf(right.id);

      if (leftPriority !== -1 || rightPriority !== -1) {
        if (leftPriority === -1) {
          return 1;
        }

        if (rightPriority === -1) {
          return -1;
        }

        return leftPriority - rightPriority;
      }

      return left.label.localeCompare(right.label);
    });
  }, [catalogProfiles, knownProfileTypeLabels]);

  const [explicitTypeFilters, setExplicitTypeFilters] = useState<Record<string, string>>({});

  if (groups.length === 0) {
    return null;
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Stack spacing={0.5}>
          <Typography variant="subtitle2">{t('dxf.dialog.profileAssignmentTitle')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('dxf.dialog.profileAssignmentHint')}
          </Typography>
        </Stack>

        {catalogProfiles.length === 0 ? (
          <Alert severity="warning" variant="outlined">
            {t('dxf.assignment.noCatalogProfiles')}
          </Alert>
        ) : null}

        <Stack spacing={1}>
          {groups.map((group) => {
            const assignedProfileId = assignments[group.key];
            const assignedProfile = assignedProfileId == null
              ? undefined
              : catalogProfiles.find((profile) => profile.id === assignedProfileId);
            const typeFilter = explicitTypeFilters[group.key]
              ?? (assignedProfileId == null
                ? ALL_PROFILE_TYPES
                : profileTypeById.get(assignedProfileId)?.id ?? ALL_PROFILE_TYPES);
            const filteredProfiles = catalogProfiles.filter((profile) =>
              typeFilter === ALL_PROFILE_TYPES || profileTypeById.get(profile.id)?.id === typeFilter,
            );
            const isAssigned = assignedProfile != null;
            const groupColor = resolveGroupDisplayColor(group);

            return (
              <Box
                key={group.key}
                sx={{
                  border: '1px solid',
                  borderColor: isAssigned ? 'divider' : 'warning.main',
                  borderRadius: 1.5,
                  p: 1.5,
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gap: 1.5,
                    gridTemplateColumns: {
                      xs: '1fr',
                      lg: 'minmax(0, 180px) 92px minmax(0, 180px) minmax(0, 1fr)',
                    },
                    alignItems: 'start',
                  }}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <ColorSwatch color={groupColor} />
                      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {group.key}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {group.layer == null
                            ? t('common.layer') + ': -'
                            : t('dxf.preview.layerLabel', { value: group.layer })}
                        </Typography>
                      </Stack>
                    </Stack>

                    <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap' }} useFlexGap>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={t('dxf.preview.membersLabel', { count: group.membersCount })}
                      />
                      <Chip
                        size="small"
                        variant="outlined"
                        color={isAssigned ? 'success' : 'warning'}
                        label={isAssigned
                          ? assignedProfile?.name ?? assignedProfileId
                          : t('dxf.assignment.notAssigned')}
                      />
                    </Stack>
                  </Stack>

                  <FieldBlock label={t('common.members')}>
                    <Typography variant="body2">{group.membersCount}</Typography>
                  </FieldBlock>

                  <FieldBlock label={t('dxf.assignment.type')}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      value={typeFilter}
                      onChange={(event) => {
                        const nextType = event.target.value;
                        setExplicitTypeFilters((previous) => ({
                          ...previous,
                          [group.key]: nextType,
                        }));

                        if (assignedProfileId == null) {
                          return;
                        }

                        const assignedType = profileTypeById.get(assignedProfileId)?.id;
                        if (nextType !== ALL_PROFILE_TYPES && assignedType !== nextType) {
                          onAssignmentsChange(removeAssignment(assignments, group.key));
                        }
                      }}
                    >
                      <MenuItem value={ALL_PROFILE_TYPES}>{t('dxf.assignment.type.all')}</MenuItem>
                      {profileTypeOptions.map((typeOption) => (
                        <MenuItem key={typeOption.id} value={typeOption.id}>
                          {typeOption.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </FieldBlock>

                  <FieldBlock label={t('common.profile')}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      value={assignedProfileId ?? ''}
                      onChange={(event) => {
                        const nextProfileId = event.target.value.trim();
                        onAssignmentsChange(
                          nextProfileId.length === 0
                            ? removeAssignment(assignments, group.key)
                            : {
                              ...assignments,
                              [group.key]: nextProfileId,
                            },
                        );
                      }}
                      helperText={filteredProfiles.length > 0
                        ? undefined
                        : t('dxf.assignment.noProfilesForType')}
                    >
                      <MenuItem value="">{t('dxf.assignment.selectProfile')}</MenuItem>
                      {filteredProfiles.map((profile) => (
                        <MenuItem key={profile.id} value={profile.id}>
                          {profile.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </FieldBlock>
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Stack>
    </Paper>
  );
}

function normalizeProfileType(
  profile: Readonly<Profile>,
  labels: KnownProfileTypeLabels,
): NormalizedProfileType {
  switch (profile.kind) {
    case 'L_equal':
    case 'L_unequal':
      return { id: 'angle', label: labels.angle };
    case 'flat_bar':
      return { id: 'flat', label: labels.flat };
    case 'rect_pipe':
      return { id: 'square', label: labels.square };
    case 'pipe':
      return { id: 'pipe', label: labels.pipe };
    case 'U':
      return { id: 'channel', label: labels.channel };
    case 'I':
      return { id: 'ibeam', label: labels.ibeam };
    case 'round_bar':
      return { id: 'round', label: labels.round };
    case 'custom':
      return { id: 'custom', label: labels.custom };
    default:
      return {
        id: profile.kind,
        label: prettifyProfileKind(profile.kind),
      };
  }
}

function prettifyProfileKind(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (token) => token.toUpperCase());
}

function resolveGroupDisplayColor(group: DxfColorGroup): string {
  if (typeof group.trueColor === 'string' && group.trueColor.trim().length > 0) {
    return group.trueColor;
  }

  if (typeof group.color === 'string' && group.color.trim().length > 0) {
    return group.color;
  }

  if (typeof group.trueColor === 'number' && Number.isFinite(group.trueColor)) {
    return `#${Math.max(0, Math.trunc(group.trueColor)).toString(16).padStart(6, '0').slice(-6)}`;
  }

  if (typeof group.color === 'number' && Number.isFinite(group.color)) {
    return `#${Math.max(0, Math.trunc(group.color)).toString(16).padStart(6, '0').slice(-6)}`;
  }

  return '#9aa1a9';
}

function removeAssignment(
  assignments: DxfProfileAssignments,
  groupKey: string,
): DxfProfileAssignments {
  const nextAssignments = { ...assignments };
  delete nextAssignments[groupKey];
  return nextAssignments;
}

function ColorSwatch({ color }: { color: string }) {
  return (
    <Box
      sx={{
        width: 28,
        height: 28,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: color,
        flexShrink: 0,
      }}
    />
  );
}

function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      {children}
    </Stack>
  );
}
