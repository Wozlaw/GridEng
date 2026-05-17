import { useEffect, useMemo, useRef, useState } from 'react';

import {
  Alert,
  Box,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import {
  formatCatalogProfileType,
  type CrossSectionCatalogItem,
  type CrossSectionProfileTypeCatalogItem,
  type CrossSectionStandardCatalogItem,
} from '../../entities/section';
import { crossSectionsApi, isAbortError } from '../../shared/api';
import { useI18n } from '../../shared/i18n';
import type {
  DxfColorGroup,
  DxfGroupDisplayColors,
  DxfProfileAssignments,
} from './types';

const ALL_PROFILE_TYPES = '__all__';
const ALL_STANDARDS = '__all__';
const FALLBACK_COLOR = '#9aa1a9';
const EMPTY_STANDARDS: readonly CrossSectionStandardCatalogItem[] = [];
const EMPTY_PROFILE_TYPES: readonly CrossSectionProfileTypeCatalogItem[] = [];

interface DxfProfileAssignmentPanelProps {
  groups: DxfColorGroup[];
  assignments: DxfProfileAssignments;
  onAssignmentsChange: (assignments: DxfProfileAssignments) => void;
  groupDisplayColors: DxfGroupDisplayColors;
  onGroupDisplayColorsChange: (colors: DxfGroupDisplayColors) => void;
  onAssignedCatalogItemsChange: (itemsByGroup: Partial<Record<string, CrossSectionCatalogItem>>) => void;
  hideHeader?: boolean;
}

interface CatalogRequestState {
  error: string | null;
  items: CrossSectionCatalogItem[];
  loading: boolean;
}

interface FilterState {
  error: string | null;
  profileTypes: CrossSectionProfileTypeCatalogItem[];
  standards: CrossSectionStandardCatalogItem[];
}

interface RowCatalogFilters {
  filterKey: string;
  standardFilter: string;
  standardOptions: CrossSectionStandardCatalogItem[];
  typeFilter: string;
}

export function DxfProfileAssignmentPanel({
  groups,
  assignments,
  onAssignmentsChange,
  groupDisplayColors,
  onGroupDisplayColorsChange,
  onAssignedCatalogItemsChange,
  hideHeader = false,
}: DxfProfileAssignmentPanelProps) {
  const { t } = useI18n();
  const [explicitTypeFilters, setExplicitTypeFilters] = useState<Record<string, string>>({});
  const [explicitStandardFilters, setExplicitStandardFilters] = useState<Record<string, string>>({});
  const [filterState, setFilterState] = useState<FilterState | null>(null);
  const [catalogStates, setCatalogStates] = useState<Record<string, CatalogRequestState>>({});
  const catalogControllersRef = useRef(new Map<string, AbortController>());
  const lastAssignedCatalogSignatureRef = useRef('');

  const standards = useMemo(
    () => filterState?.standards ?? EMPTY_STANDARDS,
    [filterState],
  );
  const profileTypes = useMemo(
    () => filterState?.profileTypes ?? EMPTY_PROFILE_TYPES,
    [filterState],
  );
  const profileTypeById = useMemo(
    () => new Map(profileTypes.map((profileType) => [profileType.id, profileType] as const)),
    [profileTypes],
  );
  const sortedProfileTypes = useMemo(
    () =>
      [...profileTypes].sort((left, right) =>
        formatCatalogProfileType(left.id).localeCompare(formatCatalogProfileType(right.id)),
      ),
    [profileTypes],
  );
  const catalogItemById = useMemo(() => {
    const map = new Map<string, CrossSectionCatalogItem>();

    for (const catalogState of Object.values(catalogStates)) {
      for (const item of catalogState.items) {
        map.set(item.id, item);
      }
    }

    return map;
  }, [catalogStates]);
  const rowFiltersByGroupKey = useMemo(() => {
    const rows = new Map<string, RowCatalogFilters>();

    for (const group of groups) {
      const assignedProfileId = assignments[group.key];
      const assignedCatalogItem = assignedProfileId == null ? undefined : catalogItemById.get(assignedProfileId);
      const typeFilter = explicitTypeFilters[group.key]
        ?? assignedCatalogItem?.profileType
        ?? ALL_PROFILE_TYPES;
      const standardOptions = getStandardOptions(standards, profileTypeById, typeFilter);
      const standardFilter = explicitStandardFilters[group.key]
        ?? normalizeStandardFilter(assignedCatalogItem?.standardId, standardOptions);

      rows.set(group.key, {
        filterKey: buildCatalogFilterKey(typeFilter, standardFilter),
        standardFilter,
        standardOptions,
        typeFilter,
      });
    }

    return rows;
  }, [assignments, catalogItemById, explicitStandardFilters, explicitTypeFilters, groups, profileTypeById, standards]);
  const requiredCatalogRequests = useMemo(() => {
    const requests = new Map<string, { profileType?: string; standardId?: string }>();

    for (const row of rowFiltersByGroupKey.values()) {
      if (requests.has(row.filterKey)) {
        continue;
      }

      requests.set(row.filterKey, {
        profileType: row.typeFilter === ALL_PROFILE_TYPES ? undefined : row.typeFilter,
        standardId: row.standardFilter === ALL_STANDARDS ? undefined : row.standardFilter,
      });
    }

    return requests;
  }, [rowFiltersByGroupKey]);

  useEffect(() => {
    if (groups.length === 0 || filterState != null) {
      return;
    }

    const controller = new AbortController();
    let isCurrent = true;

    void Promise.all([
      crossSectionsApi.listStandards({ signal: controller.signal }),
      crossSectionsApi.listProfileTypes({ signal: controller.signal }),
    ])
      .then(([nextStandards, nextProfileTypes]) => {
        if (!isCurrent) {
          return;
        }

        setFilterState({
          error: null,
          profileTypes: nextProfileTypes,
          standards: nextStandards,
        });
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || !isCurrent) {
          return;
        }

        setFilterState({
          error: resolveAsyncErrorMessage(error, t('properties.messages.profileCatalogSelectionFailed')),
          profileTypes: [],
          standards: [],
        });
      });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [filterState, groups.length, t]);

  useEffect(() => {
    for (const [filterKey, request] of requiredCatalogRequests.entries()) {
      if (catalogStates[filterKey] != null || catalogControllersRef.current.has(filterKey)) {
        continue;
      }

      const controller = new AbortController();
      catalogControllersRef.current.set(filterKey, controller);
      setCatalogStates((previous) => ({
        ...previous,
        [filterKey]: {
          error: null,
          items: [],
          loading: true,
        },
      }));

      void crossSectionsApi.listCatalog(
        {
          profileType: request.profileType,
          standardId: request.standardId,
        },
        {
          signal: controller.signal,
          notifyOnError: false,
        },
      )
        .then((items) => {
          setCatalogStates((previous) => ({
            ...previous,
            [filterKey]: {
              error: null,
              items,
              loading: false,
            },
          }));
        })
        .catch((error: unknown) => {
          if (isAbortError(error)) {
            return;
          }

          setCatalogStates((previous) => ({
            ...previous,
            [filterKey]: {
              error: resolveAsyncErrorMessage(error, t('properties.messages.profileCatalogSelectionFailed')),
              items: [],
              loading: false,
            },
          }));
        })
        .finally(() => {
          catalogControllersRef.current.delete(filterKey);
        });
    }
  }, [catalogStates, requiredCatalogRequests, t]);

  useEffect(() => {
    const controllers = catalogControllersRef.current;

    return () => {
      for (const controller of controllers.values()) {
        controller.abort();
      }
      controllers.clear();
    };
  }, []);

  useEffect(() => {
    const nextItemsByGroup: Partial<Record<string, CrossSectionCatalogItem>> = {};

    for (const group of groups) {
      const assignedProfileId = assignments[group.key];
      if (assignedProfileId == null) {
        continue;
      }

      const assignedCatalogItem = catalogItemById.get(assignedProfileId);
      if (assignedCatalogItem != null) {
        nextItemsByGroup[group.key] = assignedCatalogItem;
      }
    }

    const nextSignature = Object.entries(nextItemsByGroup)
      .filter((entry): entry is [string, CrossSectionCatalogItem] => entry[1] != null)
      .map(([groupKey, item]) => `${groupKey}:${item.id}`)
      .sort()
      .join('|');

    if (nextSignature === lastAssignedCatalogSignatureRef.current) {
      return;
    }

    lastAssignedCatalogSignatureRef.current = nextSignature;
    onAssignedCatalogItemsChange(nextItemsByGroup);
  }, [assignments, catalogItemById, groups, onAssignedCatalogItemsChange]);

  if (groups.length === 0) {
    return null;
  }

  const filtersLoading = filterState == null;

  return (
    <Stack spacing={1.5}>
      {!hideHeader ? (
        <Stack spacing={0.5}>
          <Typography variant="subtitle2">{t('dxf.dialog.profileAssignmentTitle')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('dxf.dialog.profileAssignmentHint')}
          </Typography>
        </Stack>
      ) : null}

      {filterState?.error ? (
        <Alert severity="warning" variant="outlined">
          {filterState.error}
        </Alert>
      ) : null}

      {filtersLoading ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">
            {t('properties.messages.loadingCatalogProfiles')}
          </Typography>
        </Stack>
      ) : null}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small" sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 88 }}>{t('dxf.assignment.color')}</TableCell>
              <TableCell sx={{ minWidth: 180 }}>{t('dxf.assignment.type')}</TableCell>
              <TableCell sx={{ minWidth: 180 }}>{t('dxf.assignment.standard')}</TableCell>
              <TableCell sx={{ minWidth: 240 }}>{t('common.profile')}</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {groups.map((group) => {
              const rowFilters = rowFiltersByGroupKey.get(group.key);
              const assignedProfileId = assignments[group.key];
              const assignedCatalogItem = assignedProfileId == null ? undefined : catalogItemById.get(assignedProfileId);
              const catalogState = rowFilters == null ? undefined : catalogStates[rowFilters.filterKey];
              const filteredProfiles = catalogState?.items ?? [];
              const isAssigned = assignedProfileId != null;
              const rowColor = groupDisplayColors[group.key] ?? resolveGroupDisplayColor(group);
              const catalogError = catalogState?.error ?? null;
              const catalogLoading = filtersLoading || rowFilters == null || catalogState == null || catalogState.loading;
              const helperText = catalogError
                ?? (catalogLoading
                  ? t('properties.messages.loadingCatalogProfiles')
                  : filteredProfiles.length === 0
                    ? t('dxf.assignment.noProfilesForFilters')
                    : isAssigned
                      ? ' '
                      : t('dxf.assignment.profileRequired'));

              return (
                <TableRow
                  key={group.key}
                  sx={(theme) => ({
                    bgcolor: isAssigned ? 'inherit' : alpha(theme.palette.warning.main, 0.06),
                    '& td': {
                      verticalAlign: 'top',
                    },
                  })}
                >
                  <TableCell>
                    <ColorSwatchField
                      color={rowColor}
                      label={t('dxf.assignment.colorPickerAria', { group: group.key })}
                      title={t('dxf.assignment.colorPickerAria', { group: group.key })}
                      onChange={(nextColor) => {
                        onGroupDisplayColorsChange({
                          ...groupDisplayColors,
                          [group.key]: nextColor,
                        });
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      value={rowFilters?.typeFilter ?? ALL_PROFILE_TYPES}
                      onChange={(event) => {
                        const nextType = event.target.value;
                        const nextStandardOptions = getStandardOptions(standards, profileTypeById, nextType);
                        const nextStandardFilter = normalizeStandardFilter(
                          assignedCatalogItem?.standardId,
                          nextStandardOptions,
                        );

                        setExplicitTypeFilters((previous) => ({
                          ...previous,
                          [group.key]: nextType,
                        }));
                        setExplicitStandardFilters((previous) => ({
                          ...previous,
                          [group.key]: nextStandardFilter,
                        }));

                        if (
                          assignedCatalogItem != null
                          && !matchesCatalogItemFilters(assignedCatalogItem, nextType, nextStandardFilter)
                        ) {
                          onAssignmentsChange(removeAssignment(assignments, group.key));
                        }
                      }}
                    >
                      <MenuItem value={ALL_PROFILE_TYPES}>{t('dxf.assignment.type.all')}</MenuItem>
                      {sortedProfileTypes.map((profileType) => (
                        <MenuItem key={profileType.id} value={profileType.id}>
                          {formatCatalogProfileType(profileType.id)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>

                  <TableCell>
                    {rowFilters != null && rowFilters.standardOptions.length > 1 ? (
                      <TextField
                        select
                        size="small"
                        fullWidth
                        value={rowFilters.standardFilter}
                        onChange={(event) => {
                          const nextStandard = event.target.value;

                          setExplicitStandardFilters((previous) => ({
                            ...previous,
                            [group.key]: nextStandard,
                          }));

                          if (
                            assignedCatalogItem != null
                            && !matchesCatalogItemFilters(assignedCatalogItem, rowFilters.typeFilter, nextStandard)
                          ) {
                            onAssignmentsChange(removeAssignment(assignments, group.key));
                          }
                        }}
                      >
                        <MenuItem value={ALL_STANDARDS}>{t('dxf.assignment.standard.all')}</MenuItem>
                        {rowFilters.standardOptions.map((standardOption) => (
                          <MenuItem key={standardOption.id} value={standardOption.id}>
                            {standardOption.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <TextField
                        size="small"
                        fullWidth
                        value={rowFilters?.standardOptions[0]?.name ?? t('dxf.assignment.standard.none')}
                        slotProps={{ htmlInput: { readOnly: true } }}
                      />
                    )}
                  </TableCell>

                  <TableCell>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      disabled={catalogLoading || catalogError != null}
                      error={!catalogLoading && (catalogError != null || !isAssigned || filteredProfiles.length === 0)}
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
                      helperText={helperText}
                    >
                      <MenuItem value="">{t('dxf.assignment.selectProfile')}</MenuItem>
                      {filteredProfiles.map((profile) => (
                        <MenuItem key={profile.id} value={profile.id}>
                          {profile.displayName}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

function buildCatalogFilterKey(typeFilter: string, standardFilter: string): string {
  return `${typeFilter}::${standardFilter}`;
}

function getStandardOptions(
  standards: readonly CrossSectionStandardCatalogItem[],
  profileTypeById: ReadonlyMap<string, CrossSectionProfileTypeCatalogItem>,
  typeFilter: string,
): CrossSectionStandardCatalogItem[] {
  if (typeFilter === ALL_PROFILE_TYPES) {
    return [...standards].sort((left, right) => left.name.localeCompare(right.name));
  }

  const profileType = profileTypeById.get(typeFilter);
  if (profileType == null) {
    return [];
  }

  const standardNameById = new Map(standards.map((standard) => [standard.id, standard.name] as const));
  return profileType.standardIds
    .map((id, index) => {
      const existingStandard = standards.find((standard) => standard.id === id);
      if (existingStandard != null) {
        return existingStandard;
      }

      return {
        id,
        name: profileType.standardNames[index] ?? standardNameById.get(id) ?? id,
        title: profileType.standardNames[index] ?? standardNameById.get(id) ?? id,
        datasetId: 'profiles.unknown',
        profileCount: 0,
        profileTypes: [profileType.id],
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function normalizeStandardFilter(
  value: string | undefined,
  options: readonly CrossSectionStandardCatalogItem[],
): string {
  if (options.length <= 1) {
    return options[0]?.id ?? ALL_STANDARDS;
  }

  if (value != null && options.some((option) => option.id === value)) {
    return value;
  }

  return ALL_STANDARDS;
}

function matchesCatalogItemFilters(
  profile: CrossSectionCatalogItem,
  typeFilter: string,
  standardFilter: string,
): boolean {
  const typeMatches = typeFilter === ALL_PROFILE_TYPES || profile.profileType === typeFilter;
  const standardMatches = standardFilter === ALL_STANDARDS || profile.standardId === standardFilter;

  return typeMatches && standardMatches;
}

function removeAssignment(
  assignments: DxfProfileAssignments,
  groupKey: string,
): DxfProfileAssignments {
  const nextAssignments = { ...assignments };
  delete nextAssignments[groupKey];
  return nextAssignments;
}

function ColorSwatchField({
  color,
  label,
  title,
  onChange,
}: {
  color: string;
  label: string;
  title: string;
  onChange: (color: string) => void;
}) {
  const inputValue = normalizeColorInputValue(color);

  return (
    <Tooltip title={title}>
      <Box
        component="label"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: color,
            boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.08)',
          }}
        />
        <input
          aria-label={label}
          type="color"
          value={inputValue}
          onChange={(event) => onChange(event.target.value)}
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: 'none',
          }}
        />
      </Box>
    </Tooltip>
  );
}

function normalizeColorInputValue(color: string): string {
  return /^#[0-9a-f]{6}$/i.test(color) ? color : FALLBACK_COLOR;
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

  return FALLBACK_COLOR;
}

function resolveAsyncErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}
