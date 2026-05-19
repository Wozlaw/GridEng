import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import {
  amber,
  blue,
  blueGrey,
  brown,
  cyan,
  deepOrange,
  deepPurple,
  green,
  indigo,
  lightBlue,
  lightGreen,
  lime,
  orange,
  pink,
  purple,
  red,
  teal,
} from '@mui/material/colors';
import type { MouseEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  Alert,
  Box,
  CircularProgress,
  MenuItem,
  Paper,
  Popover,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import {
  buildMaterialProfileContext,
  createMaterialFromResolvedProperties,
  formatMaterialThicknessRangeLabel,
  type MaterialProfileContext,
  type SteelMaterialResolvedProperties,
} from '../../entities/material';
import {
  createProfileFromCatalogDetails,
  formatCatalogProfileType,
  type CrossSectionCatalogItem,
  type CrossSectionDetailsResponse,
  type CrossSectionProfileTypeCatalogItem,
  type CrossSectionStandardCatalogItem,
} from '../../entities/section';
import { crossSectionsApi, isAbortError, materialsApi } from '../../shared/api';
import { useI18n } from '../../shared/i18n';
import { normalizeColorInputValue, resolveDxfGroupDisplayColor } from './dxfColors';
import type {
  DxfColorGroup,
  DxfGroupDisplayColors,
  DxfMaterialAssignments,
  DxfProfileAssignments,
} from './types';

const EMPTY_STANDARDS: readonly CrossSectionStandardCatalogItem[] = [];
const EMPTY_PROFILE_TYPES: readonly CrossSectionProfileTypeCatalogItem[] = [];
const EMPTY_MATERIAL_OPTIONS: readonly SteelMaterialResolvedProperties[] = [];
const EMPTY_PROFILE_OPTIONS: readonly CrossSectionCatalogItem[] = [];
const PALETTE_GRID_SIZE = 16;
const CONTROL_SX = {
  '& .MuiInputBase-root': {
    minHeight: 40,
  },
} as const;
const COLOR_SWATCH_PALETTE = [
  red[500],
  pink[500],
  purple[500],
  deepPurple[500],
  indigo[500],
  blue[600],
  lightBlue[600],
  cyan[600],
  teal[500],
  green[600],
  lightGreen[700],
  lime[800],
  amber[700],
  orange[700],
  deepOrange[600],
  brown[500],
  blueGrey[600],
  red[700],
  purple[700],
  indigo[700],
  cyan[800],
  teal[700],
  green[800],
  orange[800],
] as const;

interface DxfProfileAssignmentPanelProps {
  groups: DxfColorGroup[];
  assignments: DxfProfileAssignments;
  onAssignmentsChange: (assignments: DxfProfileAssignments) => void;
  materialAssignments: DxfMaterialAssignments;
  onMaterialAssignmentsChange: (assignments: DxfMaterialAssignments) => void;
  groupDisplayColors: DxfGroupDisplayColors;
  onGroupDisplayColorsChange: (colors: DxfGroupDisplayColors) => void;
  onAssignedCatalogItemsChange: (itemsByGroup: Partial<Record<string, CrossSectionCatalogItem>>) => void;
  onAssignedMaterialOptionsChange: (itemsByGroup: Partial<Record<string, SteelMaterialResolvedProperties>>) => void;
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

interface ProfileDetailsState {
  details: CrossSectionDetailsResponse | null;
  error: string | null;
  loading: boolean;
}

interface MaterialRequestState {
  error: string | null;
  loading: boolean;
  options: SteelMaterialResolvedProperties[];
}

interface RowCatalogFilters {
  filterKey: string | null;
  standardFilter: string;
  standardOptions: CrossSectionStandardCatalogItem[];
  typeFilter: string;
  typeOptions: CrossSectionProfileTypeCatalogItem[];
}

interface MaterialRowState {
  context: MaterialProfileContext | null;
  error: string | null;
  loading: boolean;
  options: SteelMaterialResolvedProperties[];
  requestKey: string | null;
}

const profileAutocompleteFilter = createFilterOptions<CrossSectionCatalogItem>({
  stringify: (option) => [
    option.designation,
    option.displayName,
    option.standardName,
    option.profileType,
    option.series ?? '',
    option.gostNumber,
  ].join(' '),
  trim: true,
});

export function DxfProfileAssignmentPanel({
  groups,
  assignments,
  onAssignmentsChange,
  materialAssignments,
  onMaterialAssignmentsChange,
  groupDisplayColors,
  onGroupDisplayColorsChange,
  onAssignedCatalogItemsChange,
  onAssignedMaterialOptionsChange,
  hideHeader = false,
}: DxfProfileAssignmentPanelProps) {
  const { t } = useI18n();
  const [explicitTypeFilters, setExplicitTypeFilters] = useState<Record<string, string>>({});
  const [explicitStandardFilters, setExplicitStandardFilters] = useState<Record<string, string>>({});
  const [filterState, setFilterState] = useState<FilterState | null>(null);
  const [catalogStates, setCatalogStates] = useState<Record<string, CatalogRequestState>>({});
  const [profileDetailsStates, setProfileDetailsStates] = useState<Record<string, ProfileDetailsState>>({});
  const [materialStates, setMaterialStates] = useState<Record<string, MaterialRequestState>>({});
  const [paletteState, setPaletteState] = useState<{ anchorEl: HTMLElement; groupKey: string } | null>(null);
  const catalogControllersRef = useRef(new Map<string, AbortController>());
  const profileDetailsControllersRef = useRef(new Map<string, AbortController>());
  const materialControllersRef = useRef(new Map<string, AbortController>());
  const lastAssignedCatalogSignatureRef = useRef('');
  const lastAssignedMaterialSignatureRef = useRef('');
  const lastProfileAssignmentsRef = useRef<Partial<Record<string, string>>>({});

  const standards = useMemo(
    () => [...(filterState?.standards ?? EMPTY_STANDARDS)].sort((left, right) => left.name.localeCompare(right.name)),
    [filterState],
  );
  const profileTypes = useMemo(
    () => filterState?.profileTypes ?? EMPTY_PROFILE_TYPES,
    [filterState],
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
      const standardFilter = normalizeSelection(
        explicitStandardFilters[group.key] ?? assignedCatalogItem?.standardId,
        standards.map((standard) => standard.id),
      );
      const typeOptions = getProfileTypeOptions(profileTypes, standardFilter, t);
      const typeFilter = normalizeSelection(
        explicitTypeFilters[group.key] ?? assignedCatalogItem?.profileType,
        typeOptions.map((profileType) => profileType.id),
      );

      rows.set(group.key, {
        filterKey: standardFilter.length > 0 && typeFilter.length > 0
          ? buildCatalogFilterKey(typeFilter, standardFilter)
          : null,
        standardFilter,
        standardOptions: standards,
        typeFilter,
        typeOptions,
      });
    }

    return rows;
  }, [assignments, catalogItemById, explicitStandardFilters, explicitTypeFilters, groups, profileTypes, standards, t]);
  const requiredCatalogRequests = useMemo(() => {
    const requests = new Map<string, { profileType: string; standardId: string }>();

    for (const row of rowFiltersByGroupKey.values()) {
      if (row.filterKey == null || requests.has(row.filterKey)) {
        continue;
      }

      requests.set(row.filterKey, {
        profileType: row.typeFilter,
        standardId: row.standardFilter,
      });
    }

    return requests;
  }, [rowFiltersByGroupKey]);
  const assignedProfileIds = useMemo(
    () =>
      Array.from(
        new Set(
          Object.values(assignments).filter(
            (profileId): profileId is string => typeof profileId === 'string' && profileId.trim().length > 0,
          ),
        ),
      ),
    [assignments],
  );

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
              items: sortCatalogItems(items),
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
    for (const profileId of assignedProfileIds) {
      if (profileDetailsStates[profileId] != null || profileDetailsControllersRef.current.has(profileId)) {
        continue;
      }

      const controller = new AbortController();
      profileDetailsControllersRef.current.set(profileId, controller);
      setProfileDetailsStates((previous) => ({
        ...previous,
        [profileId]: {
          details: null,
          error: null,
          loading: true,
        },
      }));

      void crossSectionsApi.getProfileDetails(profileId, {
        signal: controller.signal,
        notifyOnError: false,
      })
        .then((details) => {
          setProfileDetailsStates((previous) => ({
            ...previous,
            [profileId]: {
              details,
              error: null,
              loading: false,
            },
          }));
        })
        .catch((error: unknown) => {
          if (isAbortError(error)) {
            return;
          }

          setProfileDetailsStates((previous) => ({
            ...previous,
            [profileId]: {
              details: null,
              error: resolveAsyncErrorMessage(error, t('dxf.assignment.profileDetailsUnavailable')),
              loading: false,
            },
          }));
        })
        .finally(() => {
          profileDetailsControllersRef.current.delete(profileId);
        });
    }
  }, [assignedProfileIds, profileDetailsStates, t]);

  const materialRowsByGroupKey = useMemo(() => {
    const rows = new Map<string, MaterialRowState>();

    for (const group of groups) {
      const assignedProfileId = assignments[group.key];
      if (assignedProfileId == null) {
        rows.set(group.key, {
          context: null,
          error: null,
          loading: false,
          options: [],
          requestKey: null,
        });
        continue;
      }

      const profileDetailsState = profileDetailsStates[assignedProfileId];
      if (profileDetailsState == null || profileDetailsState.loading) {
        rows.set(group.key, {
          context: null,
          error: null,
          loading: true,
          options: [],
          requestKey: null,
        });
        continue;
      }

      if (profileDetailsState.error != null || profileDetailsState.details == null) {
        rows.set(group.key, {
          context: null,
          error: profileDetailsState.error ?? t('dxf.assignment.profileDetailsUnavailable'),
          loading: false,
          options: [],
          requestKey: null,
        });
        continue;
      }

      const context = buildMaterialProfileContext(
        createProfileFromCatalogDetails(profileDetailsState.details),
        profileDetailsState.details,
      );

      if (context.profileMethod == null || context.productType == null || context.thicknessMm == null) {
        rows.set(group.key, {
          context,
          error: t('dxf.assignment.materialFiltersUnavailableShort'),
          loading: false,
          options: [],
          requestKey: null,
        });
        continue;
      }

      const requestKey = buildMaterialRequestKey(context);
      const materialState = materialStates[requestKey];

      if (materialState == null || materialState.loading) {
        rows.set(group.key, {
          context,
          error: null,
          loading: true,
          options: [],
          requestKey,
        });
        continue;
      }

      rows.set(group.key, {
        context,
        error: materialState.error,
        loading: false,
        options: sortMaterialOptions(materialState.options),
        requestKey,
      });
    }

    return rows;
  }, [assignments, groups, materialStates, profileDetailsStates, t]);
  const requiredMaterialRequests = useMemo(() => {
    const requests = new Map<string, MaterialProfileContext>();

    for (const row of materialRowsByGroupKey.values()) {
      if (row.requestKey == null || row.context == null || requests.has(row.requestKey)) {
        continue;
      }

      requests.set(row.requestKey, row.context);
    }

    return requests;
  }, [materialRowsByGroupKey]);

  useEffect(() => {
    for (const [requestKey, context] of requiredMaterialRequests.entries()) {
      if (materialStates[requestKey] != null || materialControllersRef.current.has(requestKey)) {
        continue;
      }

      if (context.profileMethod == null || context.productType == null || context.thicknessMm == null) {
        continue;
      }

      const controller = new AbortController();
      materialControllersRef.current.set(requestKey, controller);
      queueMicrotask(() => {
        setMaterialStates((previous) => ({
          ...previous,
          [requestKey]: {
            error: null,
            loading: true,
            options: [],
          },
        }));
      });

      void materialsApi.listSteelOptionsByProfile(
        {
          dimensionsMm: context.dimensionsMm,
          productType: context.productType,
          profileMethod: context.profileMethod,
          thicknessMm: context.thicknessMm,
        },
        {
          signal: controller.signal,
          notifyOnError: false,
        },
      )
        .then((options) => {
          setMaterialStates((previous) => ({
            ...previous,
            [requestKey]: {
              error: null,
              loading: false,
              options,
            },
          }));
        })
        .catch((error: unknown) => {
          if (isAbortError(error)) {
            return;
          }

          setMaterialStates((previous) => ({
            ...previous,
            [requestKey]: {
              error: resolveAsyncErrorMessage(error, t('properties.messages.materialSelectionFailed')),
              loading: false,
              options: [],
            },
          }));
        })
        .finally(() => {
          materialControllersRef.current.delete(requestKey);
        });
    }
  }, [materialStates, requiredMaterialRequests, t]);

  useEffect(() => {
    const nextProfileAssignments: Partial<Record<string, string>> = {};
    let didChangeMaterialAssignments = false;
    const nextMaterialAssignments = { ...materialAssignments };

    for (const group of groups) {
      const currentProfileId = assignments[group.key];
      const previousProfileId = lastProfileAssignmentsRef.current[group.key];

      if (currentProfileId != null) {
        nextProfileAssignments[group.key] = currentProfileId;
      }

      if (previousProfileId !== currentProfileId && nextMaterialAssignments[group.key] != null) {
        delete nextMaterialAssignments[group.key];
        didChangeMaterialAssignments = true;
      }
    }

    lastProfileAssignmentsRef.current = nextProfileAssignments;

    if (didChangeMaterialAssignments) {
      onMaterialAssignmentsChange(nextMaterialAssignments);
    }
  }, [assignments, groups, materialAssignments, onMaterialAssignmentsChange]);

  useEffect(() => {
    let didChangeAssignments = false;
    const nextAssignments = { ...assignments };

    for (const group of groups) {
      const rowFilters = rowFiltersByGroupKey.get(group.key);
      if (rowFilters?.filterKey == null) {
        continue;
      }

      const assignedProfileId = assignments[group.key];
      if (assignedProfileId == null) {
        continue;
      }

      const filteredProfiles = catalogStates[rowFilters.filterKey]?.items ?? EMPTY_PROFILE_OPTIONS;
      if (filteredProfiles.length === 0) {
        delete nextAssignments[group.key];
        didChangeAssignments = true;
        continue;
      }

      if (!filteredProfiles.some((profile) => profile.id === assignedProfileId)) {
        nextAssignments[group.key] = filteredProfiles[0].id;
        didChangeAssignments = true;
      }
    }

    if (didChangeAssignments) {
      onAssignmentsChange(nextAssignments);
    }
  }, [assignments, catalogStates, groups, onAssignmentsChange, rowFiltersByGroupKey]);

  useEffect(() => {
    let didChangeAssignments = false;
    const nextAssignments = { ...materialAssignments };

    for (const group of groups) {
      const assignedProfileId = assignments[group.key];
      const currentMaterialId = materialAssignments[group.key];
      const materialRow = materialRowsByGroupKey.get(group.key);

      if (assignedProfileId == null) {
        if (currentMaterialId != null) {
          delete nextAssignments[group.key];
          didChangeAssignments = true;
        }
        continue;
      }

      if (materialRow == null || materialRow.loading) {
        continue;
      }

      if (materialRow.error != null || materialRow.options.length === 0) {
        if (currentMaterialId != null) {
          delete nextAssignments[group.key];
          didChangeAssignments = true;
        }
        continue;
      }

      if (currentMaterialId != null && materialRow.options.some((option) => getMaterialOptionId(option) === currentMaterialId)) {
        continue;
      }

      nextAssignments[group.key] = getMaterialOptionId(materialRow.options[0]);
      didChangeAssignments = true;
    }

    if (didChangeAssignments) {
      onMaterialAssignmentsChange(nextAssignments);
    }
  }, [assignments, groups, materialAssignments, materialRowsByGroupKey, onMaterialAssignmentsChange]);

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

  useEffect(() => {
    const nextItemsByGroup: Partial<Record<string, SteelMaterialResolvedProperties>> = {};

    for (const group of groups) {
      const currentMaterialId = materialAssignments[group.key];
      if (currentMaterialId == null) {
        continue;
      }

      const materialRow = materialRowsByGroupKey.get(group.key);
      const assignedMaterialOption = materialRow?.options.find((option) => getMaterialOptionId(option) === currentMaterialId);
      if (assignedMaterialOption != null) {
        nextItemsByGroup[group.key] = assignedMaterialOption;
      }
    }

    const nextSignature = Object.entries(nextItemsByGroup)
      .filter((entry): entry is [string, SteelMaterialResolvedProperties] => entry[1] != null)
      .map(([groupKey, option]) => `${groupKey}:${getMaterialOptionId(option)}`)
      .sort()
      .join('|');

    if (nextSignature === lastAssignedMaterialSignatureRef.current) {
      return;
    }

    lastAssignedMaterialSignatureRef.current = nextSignature;
    onAssignedMaterialOptionsChange(nextItemsByGroup);
  }, [groups, materialAssignments, materialRowsByGroupKey, onAssignedMaterialOptionsChange]);

  useEffect(() => {
    const catalogControllers = catalogControllersRef.current;
    const detailsControllers = profileDetailsControllersRef.current;
    const currentMaterialControllers = materialControllersRef.current;

    return () => {
      for (const controller of catalogControllers.values()) {
        controller.abort();
      }
      catalogControllers.clear();

      for (const controller of detailsControllers.values()) {
        controller.abort();
      }
      detailsControllers.clear();

      for (const controller of currentMaterialControllers.values()) {
        controller.abort();
      }
      currentMaterialControllers.clear();
    };
  }, []);

  if (groups.length === 0) {
    return null;
  }

  const filtersLoading = filterState == null;
  const rowColorsByGroup = Object.fromEntries(
    groups.map((group) => [group.key, groupDisplayColors[group.key] ?? resolveDxfGroupDisplayColor(group)] as const),
  );
  const paletteColors = paletteState == null
    ? []
    : getPaletteColorsForGroup(paletteState.groupKey, rowColorsByGroup);

  return (
    <Stack spacing={1.5}>
      {!hideHeader ? (
        <Stack spacing={0.5}>
          <Typography variant="subtitle2">{t('dxf.dialog.profileAssignmentTitle')}</Typography>
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
        <Table
          size="small"
          sx={{
            minWidth: 960,
            tableLayout: 'fixed',
            '& .MuiTableCell-root': {
              borderBottomColor: 'divider',
              py: 1,
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 72 }}>{t('dxf.assignment.color')}</TableCell>
              <TableCell sx={{ width: 180 }}>{t('dxf.assignment.type')}</TableCell>
              <TableCell sx={{ width: 200 }}>{t('dxf.assignment.standard')}</TableCell>
              <TableCell sx={{ width: 280 }}>{t('common.profile')}</TableCell>
              <TableCell sx={{ width: 280 }}>{t('dxf.assignment.material')}</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {groups.map((group) => {
              const rowFilters = rowFiltersByGroupKey.get(group.key);
              const rowColor = rowColorsByGroup[group.key];
              const assignedProfileId = assignments[group.key];
              const currentMaterialId = materialAssignments[group.key];
              const filteredProfiles = rowFilters?.filterKey == null
                ? EMPTY_PROFILE_OPTIONS
                : (catalogStates[rowFilters.filterKey]?.items ?? EMPTY_PROFILE_OPTIONS);
              const assignedCatalogItem = assignedProfileId == null
                ? null
                : filteredProfiles.find((profile) => profile.id === assignedProfileId) ?? catalogItemById.get(assignedProfileId) ?? null;
              const materialRow = materialRowsByGroupKey.get(group.key);
              const selectedMaterialOption = currentMaterialId == null
                ? null
                : materialRow?.options.find((option) => getMaterialOptionId(option) === currentMaterialId) ?? null;
              const catalogError = rowFilters?.filterKey == null ? null : (catalogStates[rowFilters.filterKey]?.error ?? null);
              const catalogLoading = filtersLoading
                || rowFilters == null
                || rowFilters.filterKey == null
                || catalogStates[rowFilters.filterKey] == null
                || catalogStates[rowFilters.filterKey]?.loading === true;
              const profileError = !catalogLoading && (
                catalogError != null
                || assignedProfileId == null
                || filteredProfiles.length === 0
              );
              const materialError = assignedProfileId != null
                && materialRow != null
                && !materialRow.loading
                && (
                  materialRow.error != null
                  || materialRow.options.length === 0
                  || selectedMaterialOption == null
                );
              const rowTone = materialError
                ? 'error'
                : profileError
                  ? 'warning'
                  : 'default';
              const rowStatusMessage = getRowStatusMessage({
                assignedProfileId,
                materialError: Boolean(materialError),
                materialLoading: Boolean(materialRow?.loading),
                materialRow,
                profileError,
                t,
              });

              return (
                <TableRow
                  key={group.key}
                  sx={(theme) => ({
                    bgcolor: rowTone === 'error'
                      ? alpha(theme.palette.error.main, 0.05)
                      : rowTone === 'warning'
                        ? alpha(theme.palette.warning.main, 0.06)
                        : 'inherit',
                    '& td': {
                      verticalAlign: 'top',
                    },
                  })}
                >
                  <TableCell>
                    <ColorSwatchButton
                      color={rowColor}
                      label={t('dxf.assignment.colorPickerAria', { group: group.key })}
                      onClick={(event) => {
                        setPaletteState({
                          anchorEl: event.currentTarget,
                          groupKey: group.key,
                        });
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      value={rowFilters?.typeFilter ?? ''}
                      onChange={(event) => {
                        const nextType = event.target.value;
                        if (nextType.length === 0) {
                          return;
                        }

                        setExplicitTypeFilters((previous) => ({
                          ...previous,
                          [group.key]: nextType,
                        }));
                      }}
                      sx={CONTROL_SX}
                    >
                      {rowFilters?.typeOptions.map((profileType) => (
                        <MenuItem key={profileType.id} value={profileType.id}>
                          {formatLocalizedProfileType(profileType.id, t)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>

                  <TableCell>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      value={rowFilters?.standardFilter ?? ''}
                      onChange={(event) => {
                        const nextStandard = event.target.value;
                        if (nextStandard.length === 0) {
                          return;
                        }

                        setExplicitStandardFilters((previous) => ({
                          ...previous,
                          [group.key]: nextStandard,
                        }));
                      }}
                      sx={CONTROL_SX}
                    >
                      {rowFilters?.standardOptions.map((standardOption) => (
                        <MenuItem key={standardOption.id} value={standardOption.id}>
                          {standardOption.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>

                  <TableCell>
                    <Autocomplete
                      disablePortal
                      options={filteredProfiles}
                      value={assignedCatalogItem}
                      loading={catalogLoading}
                      onChange={(_event, nextProfile) => {
                        if (nextProfile == null) {
                          onAssignmentsChange(removeAssignment(assignments, group.key));
                          return;
                        }

                        onAssignmentsChange({
                          ...assignments,
                          [group.key]: nextProfile.id,
                        });
                      }}
                      filterOptions={profileAutocompleteFilter}
                      getOptionLabel={(option) => option.displayName}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      noOptionsText={catalogLoading
                        ? t('properties.messages.loadingCatalogProfiles')
                        : t('dxf.assignment.noProfilesForFilters')}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Stack spacing={0.25}>
                            <Typography variant="body2">{option.displayName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {[
                                option.designation,
                                option.standardName,
                                formatLocalizedProfileType(option.profileType, t),
                              ].join(' · ')}
                            </Typography>
                          </Stack>
                        </Box>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          error={profileError}
                          placeholder={t('dxf.assignment.selectProfile')}
                          sx={CONTROL_SX}
                        />
                      )}
                    />
                  </TableCell>

                  <TableCell>
                    <Autocomplete
                      disablePortal
                      options={materialRow?.options ?? EMPTY_MATERIAL_OPTIONS}
                      value={selectedMaterialOption}
                      loading={materialRow?.loading ?? false}
                      disabled={assignedProfileId == null || materialRow == null}
                      onChange={(_event, nextMaterial) => {
                        if (nextMaterial == null) {
                          onMaterialAssignmentsChange(removeMaterialAssignment(materialAssignments, group.key));
                          return;
                        }

                        onMaterialAssignmentsChange({
                          ...materialAssignments,
                          [group.key]: getMaterialOptionId(nextMaterial),
                        });
                      }}
                      getOptionLabel={(option) => option.displayName}
                      isOptionEqualToValue={(option, value) => option.propertyId === value.propertyId && option.key === value.key}
                      noOptionsText={materialRow?.loading
                        ? t('dxf.assignment.materialLoading')
                        : t('dxf.assignment.noMaterials')}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Stack spacing={0.25}>
                            <Typography variant="body2">{option.displayName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {[
                                option.propertyId,
                                formatMaterialThicknessRangeLabel(option.thickness),
                                formatMaterialProductTypesLabel(option.productTypes, t),
                              ].filter((value) => value.length > 0).join(' · ')}
                            </Typography>
                          </Stack>
                        </Box>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          error={Boolean(materialError)}
                          placeholder={assignedProfileId == null
                            ? t('dxf.assignment.selectProfile')
                            : t('dxf.assignment.selectMaterial')}
                          sx={CONTROL_SX}
                        />
                      )}
                    />
                    {rowStatusMessage ? (
                      <Typography
                        variant="caption"
                        color={rowTone === 'error' ? 'error.main' : 'warning.main'}
                        sx={{ display: 'block', mt: 0.5 }}
                      >
                        {rowStatusMessage}
                      </Typography>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Popover
        open={paletteState != null}
        anchorEl={paletteState?.anchorEl ?? null}
        onClose={() => setPaletteState(null)}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 32px)',
            gap: 1,
            p: 1.25,
          }}
        >
          {paletteColors.map((color) => (
            <Box
              key={color}
              component="button"
              type="button"
              aria-label={color}
              onClick={() => {
                if (paletteState == null) {
                  return;
                }

                onGroupDisplayColorsChange({
                  ...groupDisplayColors,
                  [paletteState.groupKey]: color,
                });
                setPaletteState(null);
              }}
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: normalizeColorInputValue(color),
                cursor: 'pointer',
              }}
            />
          ))}
        </Box>
      </Popover>
    </Stack>
  );
}

function buildCatalogFilterKey(typeFilter: string, standardFilter: string): string {
  return `${typeFilter}::${standardFilter}`;
}

function buildMaterialRequestKey(context: MaterialProfileContext): string {
  return [
    context.profileMethod,
    context.productType,
    context.thicknessMm,
    JSON.stringify(context.dimensionsMm),
  ].join('|');
}

function normalizeSelection(value: string | undefined, options: readonly string[]): string {
  if (value != null && options.includes(value)) {
    return value;
  }

  return options[0] ?? '';
}

function getProfileTypeOptions(
  profileTypes: readonly CrossSectionProfileTypeCatalogItem[],
  standardId: string,
  t: ReturnType<typeof useI18n>['t'],
): CrossSectionProfileTypeCatalogItem[] {
  return [...profileTypes]
    .filter((profileType) => standardId.length > 0 && profileType.standardIds.includes(standardId))
    .sort((left, right) => formatLocalizedProfileType(left.id, t).localeCompare(formatLocalizedProfileType(right.id, t)));
}

function sortCatalogItems(items: readonly CrossSectionCatalogItem[]): CrossSectionCatalogItem[] {
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
  });

  return [...items].sort((left, right) =>
    collator.compare(left.designation, right.designation)
    || collator.compare(left.displayName, right.displayName)
    || collator.compare(left.id, right.id),
  );
}

function sortMaterialOptions(options: readonly SteelMaterialResolvedProperties[]): SteelMaterialResolvedProperties[] {
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
  });

  return [...options].sort((left, right) =>
    collator.compare(left.displayName, right.displayName)
    || collator.compare(left.propertyId, right.propertyId),
  );
}

function getMaterialOptionId(option: SteelMaterialResolvedProperties): string {
  return createMaterialFromResolvedProperties(option).id;
}

function removeAssignment(
  assignments: DxfProfileAssignments,
  groupKey: string,
): DxfProfileAssignments {
  const nextAssignments = { ...assignments };
  delete nextAssignments[groupKey];
  return nextAssignments;
}

function removeMaterialAssignment(
  assignments: DxfMaterialAssignments,
  groupKey: string,
): DxfMaterialAssignments {
  const nextAssignments = { ...assignments };
  delete nextAssignments[groupKey];
  return nextAssignments;
}

function resolveAsyncErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

function ColorSwatchButton({
  color,
  label,
  onClick,
}: {
  color: string;
  label: string;
  onClick: (event: MouseEvent<HTMLElement>) => void;
}) {
  return (
    <Box
      component="button"
      type="button"
      aria-label={label}
      onClick={onClick}
      sx={{
        width: 32,
        height: 32,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: normalizeColorInputValue(color),
        boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.08)',
        cursor: 'pointer',
      }}
    />
  );
}

function getPaletteColorsForGroup(
  groupKey: string,
  rowColorsByGroup: Record<string, string>,
): string[] {
  const currentColor = normalizeColorInputValue(rowColorsByGroup[groupKey] ?? COLOR_SWATCH_PALETTE[0]);
  const usedByOthers = new Set(
    Object.entries(rowColorsByGroup)
      .filter(([currentGroupKey]) => currentGroupKey !== groupKey)
      .map(([, color]) => normalizeColorInputValue(color).toLowerCase()),
  );

  const deduped = Array.from(new Set([currentColor, ...COLOR_SWATCH_PALETTE]));
  return deduped
    .filter((color) => color.toLowerCase() === currentColor.toLowerCase() || !usedByOthers.has(color.toLowerCase()))
    .slice(0, PALETTE_GRID_SIZE);
}

function getRowStatusMessage({
  assignedProfileId,
  materialError,
  materialLoading,
  materialRow,
  profileError,
  t,
}: {
  assignedProfileId: string | undefined;
  materialError: boolean;
  materialLoading: boolean;
  materialRow: MaterialRowState | undefined;
  profileError: boolean;
  t: ReturnType<typeof useI18n>['t'];
}): string | null {
  if (profileError || assignedProfileId == null) {
    return t('dxf.assignment.status.profileRequired');
  }

  if (materialLoading) {
    return null;
  }

  if (!materialError || materialRow == null) {
    return null;
  }

  if (materialRow.error != null) {
    return t('dxf.assignment.status.materialUnavailable');
  }

  if (materialRow.options.length === 0) {
    return t('dxf.assignment.status.materialUnavailable');
  }

  return t('dxf.assignment.status.materialRequired');
}

function formatLocalizedProfileType(
  profileType: string,
  t: ReturnType<typeof useI18n>['t'],
): string {
  const normalized = profileType.trim().toLowerCase();

  if (normalized.includes('equal') && normalized.includes('angle')) {
    return t('dxf.assignment.profileType.equalAngle');
  }
  if ((normalized.includes('unequal') || normalized.includes('non_equal')) && normalized.includes('angle')) {
    return t('dxf.assignment.profileType.unequalAngle');
  }
  if (normalized.includes('channel')) {
    return t('dxf.assignment.profileType.channel');
  }
  if (normalized.includes('beam') || normalized.includes('i_shape') || normalized.includes('ishape')) {
    return t('dxf.assignment.profileType.ibeam');
  }
  if (normalized.includes('pipe') || normalized.includes('tube')) {
    return t('dxf.assignment.profileType.pipe');
  }
  if (normalized.includes('rect') || normalized.includes('box') || normalized.includes('rhs') || normalized.includes('square')) {
    return t('dxf.assignment.profileType.rectPipe');
  }
  if (normalized.includes('round') || normalized.includes('circle')) {
    return t('dxf.assignment.profileType.roundBar');
  }
  if (normalized.includes('flat') || normalized.includes('strip') || normalized.includes('plate')) {
    return t('dxf.assignment.profileType.flatBar');
  }
  if (normalized.includes('tee') || normalized === 't') {
    return t('dxf.assignment.profileType.tee');
  }

  return formatCatalogProfileType(profileType);
}

function formatMaterialProductTypesLabel(
  productTypes: string[],
  t: ReturnType<typeof useI18n>['t'],
): string {
  return productTypes
    .map((productType) => t(`properties.values.materialProductType.${productType}` as never))
    .join(', ');
}
