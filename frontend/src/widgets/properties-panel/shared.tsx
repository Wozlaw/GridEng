import { type ReactNode, useDeferredValue, useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import {
  getLoadUnits,
  resolveConcentratedLoadVector,
  resolveDistributedLoadVectors,
  type Load,
  type Material,
  type Profile,
  type UnitSystem,
} from '../../entities/model';
import {
  createMaterialFromResolvedProperties,
  formatMaterialSourceRefs,
  formatMaterialThicknessRangeLabel,
  parseCatalogMaterialId,
  type MaterialProfileContext,
  type SteelMaterialResolvedProperties,
} from '../../entities/material';
import {
  formatCatalogProfileType,
  type CrossSectionCatalogItem,
  type CrossSectionDetailsResponse,
  type CrossSectionProfileTypeCatalogItem,
  type CrossSectionStandardCatalogItem,
} from '../../entities/section';
import { crossSectionsApi, isAbortError, materialsApi } from '../../shared/api';
import { useI18n } from '../../shared/i18n';
import { formatNumber, formatOptionalText, formatVector } from '../../shared/utils';

const PROPERTY_GRID_TEMPLATE = 'minmax(0, 176px) minmax(0, 1fr)';
const PROPERTY_ROW_HEIGHT = 40;

export function PropertySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 1.5,
          minHeight: 32,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 700, letterSpacing: '0.04em' }}
        >
          {title}
        </Typography>
      </Box>
      <Stack spacing={0}>{children}</Stack>
    </Paper>
  );
}

export function TechnicalDetailsSection({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <PropertySection title={title}>
      {rows.map((row) => (
        <PropertyRow key={`${row.label}-${row.value}`} label={row.label} value={row.value} />
      ))}
    </PropertySection>
  );
}

export function PropertyRow({ label, value }: { label: string; value: string }) {
  const isLongValue = value.length > 80;

  return (
    <PropertyEditorRow label={label} multiline={isLongValue}>
      <Tooltip title={isLongValue ? value : ''} disableHoverListener={!isLongValue} placement="top-start">
        <Typography
          variant="body2"
          sx={{
            minWidth: 0,
            lineHeight: 1.25,
            wordBreak: isLongValue ? 'break-word' : 'normal',
            whiteSpace: isLongValue ? 'normal' : 'nowrap',
            overflow: isLongValue ? 'visible' : 'hidden',
            textOverflow: isLongValue ? 'clip' : 'ellipsis',
          }}
        >
          {value}
        </Typography>
      </Tooltip>
    </PropertyEditorRow>
  );
}

export function PropertyEditorRow({
  label,
  children,
  multiline = false,
}: {
  label: string;
  children: ReactNode;
  multiline?: boolean;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'minmax(0, 132px) minmax(0, 1fr)',
          md: PROPERTY_GRID_TEMPLATE,
        },
        alignItems: multiline ? 'stretch' : 'center',
        minHeight: multiline ? 'auto' : PROPERTY_ROW_HEIGHT,
        borderTop: '1px solid',
        borderColor: 'divider',
        '& > :first-of-type': {
          px: 1.5,
          py: multiline ? 1 : 0.5,
          minWidth: 0,
          minHeight: multiline ? PROPERTY_ROW_HEIGHT : PROPERTY_ROW_HEIGHT,
          display: 'flex',
          alignItems: multiline ? 'flex-start' : 'center',
          bgcolor: 'action.hover',
        },
        '& > :last-child': {
          px: 1.5,
          py: multiline ? 1 : 0.5,
          minWidth: 0,
          minHeight: multiline ? PROPERTY_ROW_HEIGHT : PROPERTY_ROW_HEIGHT,
          display: 'flex',
          alignItems: multiline ? 'stretch' : 'center',
          '& .MuiFormControl-root, & .MuiTextField-root': {
            width: '100%',
          },
          '& .MuiInputBase-root, & .MuiButton-root, & .MuiToggleButton-root': {
            minHeight: PROPERTY_ROW_HEIGHT,
          },
          '& .MuiToggleButtonGroup-root': {
            flexWrap: 'wrap',
          },
        },
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
        {label}
      </Typography>
      <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

export function PropertyActionRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <PropertyEditorRow label={label}>
      <Stack direction="row" spacing={1} sx={{ width: '100%', alignItems: 'center', flexWrap: 'wrap' }} useFlexGap>
        {children}
      </Stack>
    </PropertyEditorRow>
  );
}

export function AssignmentRow({
  title,
  primary,
  secondary,
  accentColor,
  chooseLabel,
  openLabel,
  onChoose,
  onOpen,
  openDisabled = false,
  chooseDisabled = false,
}: {
  title: string;
  primary: string;
  secondary?: string;
  accentColor: string;
  chooseLabel: string;
  openLabel: string;
  onChoose: () => void;
  onOpen: () => void;
  openDisabled?: boolean;
  chooseDisabled?: boolean;
}) {
  return (
    <PropertyEditorRow label={title} multiline>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1}
        sx={{ width: '100%', minWidth: 0, alignItems: { md: 'center' }, justifyContent: 'space-between' }}
      >
        <Stack direction="row" spacing={1} sx={{ minWidth: 0, alignItems: 'center', flex: '1 1 auto' }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              flexShrink: 0,
              bgcolor: accentColor,
              border: '1px solid',
              borderColor: 'divider',
            }}
          />
          <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
            <Tooltip title={primary} disableHoverListener={primary.length <= 40} placement="top-start">
              <Typography variant="body2" noWrap sx={{ minWidth: 0, fontWeight: 500 }}>
                {primary}
              </Typography>
            </Tooltip>
            {secondary && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', minWidth: 0 }}>
                {secondary}
              </Typography>
            )}
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }} useFlexGap>
          <Button size="small" variant="outlined" onClick={onChoose} disabled={chooseDisabled}>
            {chooseLabel}
          </Button>
          <Button size="small" variant="text" onClick={onOpen} disabled={openDisabled}>
            {openLabel}
          </Button>
        </Stack>
      </Stack>
    </PropertyEditorRow>
  );
}

export function ValidationIssueGroup({
  title,
  issues,
}: {
  title: string;
  issues: Array<{ message: string }>;
}) {
  return (
    <Stack spacing={0.75}>
      <Typography variant="subtitle2">{title}</Typography>
      {issues.map((issue, index) => (
        <Typography key={`${title}-${index}-${issue.message}`} variant="body2">
          {issue.message}
        </Typography>
      ))}
    </Stack>
  );
}

export function CoordinateFields({
  values,
  onChange,
}: {
  values: Record<'x' | 'y' | 'z', string>;
  onChange: (axis: 'x' | 'y' | 'z', value: string) => void;
}) {
  const { t } = useI18n();

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 1,
      }}
    >
      {(['x', 'y', 'z'] as const).map((axis) => (
        <TextField
          key={axis}
          label={t(`properties.axis.${axis}` as never)}
          size="small"
          type="number"
          value={values[axis]}
          onChange={(event) => onChange(axis, event.target.value)}
          sx={{
            '& .MuiInputBase-root': {
              minHeight: PROPERTY_ROW_HEIGHT,
            },
          }}
        />
      ))}
    </Box>
  );
}

export function AssignmentCard({
  title,
  primary,
  secondary,
  accentColor,
  chooseLabel,
  openLabel,
  onChoose,
  onOpen,
  openDisabled = false,
  chooseDisabled = false,
}: {
  title: string;
  primary: string;
  secondary?: string;
  accentColor: string;
  chooseLabel: string;
  openLabel: string;
  onChoose: () => void;
  onOpen: () => void;
  openDisabled?: boolean;
  chooseDisabled?: boolean;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1.25 }}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              flexShrink: 0,
              bgcolor: accentColor,
              border: '1px solid',
              borderColor: 'divider',
            }}
          />
          <Typography variant="subtitle2">{title}</Typography>
        </Stack>
        <Typography variant="body2">{primary}</Typography>
        {secondary && (
          <Typography variant="caption" color="text.secondary">
            {secondary}
          </Typography>
        )}
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={onChoose} disabled={chooseDisabled}>
            {chooseLabel}
          </Button>
          <Button size="small" variant="text" onClick={onOpen} disabled={openDisabled}>
            {openLabel}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

export function ProfileSelectionDialog({
  open,
  projectProfiles,
  currentProfileId,
  pendingProfileId,
  onClose,
  onSelect,
}: {
  open: boolean;
  projectProfiles: Profile[];
  currentProfileId: string;
  pendingProfileId?: string | null;
  onClose: () => void;
  onSelect: (profileId: string) => void;
}) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfileType, setSelectedProfileType] = useState('');
  const [selectedStandardId, setSelectedStandardId] = useState('');
  const [filterState, setFilterState] = useState<{
    error: string | null;
    profileTypes: CrossSectionProfileTypeCatalogItem[];
    standards: CrossSectionStandardCatalogItem[];
  } | null>(null);
  const [catalogState, setCatalogState] = useState<{
    error: string | null;
    filterKey: string;
    items: CrossSectionCatalogItem[];
  } | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());
  const catalogFilterKey = `${selectedStandardId}::${selectedProfileType}::${deferredSearchQuery}`;
  const standards = filterState?.standards ?? [];
  const profileTypes = filterState?.profileTypes ?? [];
  const catalogProfiles = catalogState?.filterKey === catalogFilterKey ? catalogState.items : [];
  const catalogError = filterState?.error ?? (
    catalogState?.filterKey === catalogFilterKey ? catalogState.error : null
  );
  const filtersLoading = open && filterState == null;
  const catalogLoading = open && catalogState?.filterKey !== catalogFilterKey;

  const projectProfileIds = useMemo(
    () => new Set(projectProfiles.map((profile) => profile.id)),
    [projectProfiles],
  );
  const filteredProjectProfiles = useMemo(() => {
    if (deferredSearchQuery.length === 0) {
      return projectProfiles;
    }

    const normalizedQuery = deferredSearchQuery.toLowerCase();
    return projectProfiles.filter((profile) =>
      [profile.name, profile.kind, profile.id].some((value) => value.toLowerCase().includes(normalizedQuery))
    );
  }, [deferredSearchQuery, projectProfiles]);

  useEffect(() => {
    if (!open || filterState != null) {
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
  }, [filterState, open, t]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();
    let isCurrent = true;

    void crossSectionsApi.listCatalog(
      {
        query: deferredSearchQuery.length > 0 ? deferredSearchQuery : undefined,
        profileType: selectedProfileType || undefined,
        standardId: selectedStandardId || undefined,
      },
      { signal: controller.signal },
    )
      .then((items) => {
        if (!isCurrent) {
          return;
        }

        setCatalogState({
          error: null,
          filterKey: catalogFilterKey,
          items,
        });
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || !isCurrent) {
          return;
        }

        setCatalogState({
          error: resolveAsyncErrorMessage(error, t('properties.messages.profileCatalogSelectionFailed')),
          filterKey: catalogFilterKey,
          items: [],
        });
      });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [catalogFilterKey, deferredSearchQuery, open, selectedProfileType, selectedStandardId, t]);

  function handleClose() {
    setSearchQuery('');
    setSelectedProfileType('');
    setSelectedStandardId('');
    setFilterState(null);
    setCatalogState(null);
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>{t('properties.dialog.profileSelectTitle')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            label={t('properties.fields.profileSearch')}
            size="small"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />

          <Box
            sx={{
              display: 'grid',
              gap: 1,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            }}
          >
            <TextField
              select
              label={t('properties.rows.profileType')}
              size="small"
              value={selectedProfileType}
              onChange={(event) => setSelectedProfileType(event.target.value)}
            >
              <MenuItem value="">{t('dxf.assignment.type.all')}</MenuItem>
              {profileTypes.map((profileType) => (
                <MenuItem key={profileType.id} value={profileType.id}>
                  {formatCatalogProfileType(profileType.id)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label={t('properties.rows.standard')}
              size="small"
              value={selectedStandardId}
              onChange={(event) => setSelectedStandardId(event.target.value)}
            >
              <MenuItem value="">{t('dxf.assignment.standard.all')}</MenuItem>
              {standards.map((standard) => (
                <MenuItem key={standard.id} value={standard.id}>
                  {standard.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {(filtersLoading || catalogLoading) && (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">
                {t('properties.messages.loadingCatalogProfiles')}
              </Typography>
            </Stack>
          )}

          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.04em' }}>
              {t('properties.catalog.projectProfiles')}
            </Typography>
            <Paper variant="outlined" sx={{ maxHeight: 180, overflowY: 'auto' }}>
              {filteredProjectProfiles.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
                  {t('properties.messages.noProjectProfiles')}
                </Typography>
              ) : (
                <List disablePadding>
                  {filteredProjectProfiles.map((profile) => (
                    <ListItemButton
                      key={profile.id}
                      disabled={pendingProfileId != null}
                      selected={profile.id === currentProfileId}
                      onClick={() => onSelect(profile.id)}
                    >
                      <ListItemText
                        primary={profile.name}
                        secondary={`${profile.kind} · ${profile.id}`}
                      />
                    </ListItemButton>
                  ))}
                </List>
              )}
            </Paper>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.04em' }}>
              {t('properties.catalog.catalogProfiles')}
            </Typography>
            <Paper variant="outlined" sx={{ maxHeight: 300, overflowY: 'auto' }}>
              {catalogError ? (
                <Alert severity="warning" sx={{ m: 1.5 }}>
                  {catalogError}
                </Alert>
              ) : catalogProfiles.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
                  {t('properties.messages.noCatalogProfilesFound')}
                </Typography>
              ) : (
                <List disablePadding>
                  {catalogProfiles.map((item) => {
                    const alreadyInProject = projectProfileIds.has(item.id);
                    const isPending = pendingProfileId === item.id;

                    return (
                      <ListItemButton
                        key={item.id}
                        disabled={pendingProfileId != null}
                        selected={item.id === currentProfileId}
                        onClick={() => onSelect(item.id)}
                        sx={{ alignItems: 'flex-start' }}
                      >
                        <ListItemText
                          primary={(
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }} useFlexGap>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {item.displayName}
                              </Typography>
                              {alreadyInProject && (
                                <Chip
                                  size="small"
                                  label={t('properties.badges.inProject')}
                                  variant="outlined"
                                />
                              )}
                              {isPending && <CircularProgress size={14} />}
                            </Stack>
                          )}
                          secondary={(
                            <Stack spacing={0.35} sx={{ mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" component="span">
                                {formatCatalogProfileType(item.profileType)}
                                {' · '}
                                {item.standardName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" component="span">
                                {item.designation}
                                {item.series ? ` · ${item.series}` : ''}
                              </Typography>
                            </Stack>
                          )}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              )}
            </Paper>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('common.cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
}

export function MaterialSelectionDialog({
  open,
  materialProfileContext,
  materialOptions,
  materialOptionsError,
  materialOptionsLoading = false,
  currentMaterialId,
  invalidCurrentMaterial = false,
  pendingMaterialId,
  onClose,
  onSelect,
}: {
  open: boolean;
  materialProfileContext: MaterialProfileContext | null;
  materialOptions: SteelMaterialResolvedProperties[];
  materialOptionsError?: string | null;
  materialOptionsLoading?: boolean;
  currentMaterialId: string;
  invalidCurrentMaterial?: boolean;
  pendingMaterialId?: string | null;
  onClose: () => void;
  onSelect: (material: SteelMaterialResolvedProperties) => void;
}) {
  const { t } = useI18n();
  const hasReadyContext =
    materialProfileContext?.profileMethod != null
    && materialProfileContext.productType != null
    && materialProfileContext.thicknessMm != null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('properties.dialog.materialSelectTitle')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          {materialProfileContext != null && (
            <Stack spacing={0.75}>
              <PropertyRow
                label={t('properties.rows.materialThickness')}
                value={materialProfileContext.thicknessMm == null
                  ? '-'
                  : `${formatNumber(materialProfileContext.thicknessMm, 3)} mm`}
              />
              <PropertyRow
                label={t('properties.rows.productType')}
                value={materialProfileContext.productType == null
                  ? '-'
                  : t(`properties.values.materialProductType.${materialProfileContext.productType}` as never)}
              />
            </Stack>
          )}

          {invalidCurrentMaterial && (
            <Alert severity="warning">
              {t('properties.messages.materialCompatibilityInvalid')}
            </Alert>
          )}

          {!hasReadyContext ? (
            <Alert severity="info">
              {t('properties.messages.materialFiltersUnavailable')}
            </Alert>
          ) : (
            <>
              {materialOptionsLoading && (
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <CircularProgress size={16} />
                  <Typography variant="caption" color="text.secondary">
                    {t('properties.messages.loadingCompatibleMaterials')}
                  </Typography>
                </Stack>
              )}

              {materialOptionsError ? (
                <Alert severity="warning">{materialOptionsError}</Alert>
              ) : materialOptions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t('properties.messages.noCompatibleMaterialsFound')}
                </Typography>
              ) : (
                <Paper variant="outlined" sx={{ maxHeight: 360, overflowY: 'auto' }}>
                  <List disablePadding>
                    {materialOptions.map((option) => {
                      const nextMaterial = createMaterialFromResolvedProperties(option);
                      const isPending = pendingMaterialId === nextMaterial.id;
                      const sourceLabel = formatMaterialSourceRefs(option)[0] ?? null;

                      return (
                        <ListItemButton
                          key={nextMaterial.id}
                          disabled={pendingMaterialId != null}
                          selected={nextMaterial.id === currentMaterialId}
                          onClick={() => onSelect(option)}
                          sx={{ alignItems: 'flex-start' }}
                        >
                          <ListItemText
                            primary={(
                              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }} useFlexGap>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {option.displayName}
                                </Typography>
                                {isPending && <CircularProgress size={14} />}
                              </Stack>
                            )}
                            secondary={(
                              <Stack spacing={0.35} sx={{ mt: 0.5 }}>
                                <Typography variant="caption" color="text.secondary" component="span">
                                  {`Rt ${formatNumber(option.Rt, 0)} MPa · Rb ${formatNumber(option.Rb, 0)} MPa`}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" component="span">
                                  {formatMaterialProductTypesLabel(option.productTypes, t)}
                                  {' · '}
                                  {formatMaterialThicknessRangeLabel(option.thickness)}
                                </Typography>
                                {sourceLabel && (
                                  <Typography variant="caption" color="text.secondary" component="span">
                                    {sourceLabel}
                                  </Typography>
                                )}
                              </Stack>
                            )}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Paper>
              )}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
}

export function ProfileCardDialog({
  open,
  profile,
  onClose,
}: {
  open: boolean;
  profile: Profile | undefined;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [catalogDetailsState, setCatalogDetailsState] = useState<{
    details: CrossSectionDetailsResponse | null;
    profileId: string;
  } | null>(null);
  const profileId = profile?.id ?? null;
  const catalogDetails = profileId != null && catalogDetailsState?.profileId === profileId
    ? catalogDetailsState.details
    : null;
  const catalogDetailsLoading = open && profileId != null && catalogDetailsState?.profileId !== profileId;

  useEffect(() => {
    if (!open || profileId == null) {
      return;
    }

    const controller = new AbortController();
    let isCurrent = true;

    void crossSectionsApi.getProfileDetails(profileId, {
      signal: controller.signal,
      notifyOnError: false,
    })
      .then((details) => {
        if (isCurrent) {
          setCatalogDetailsState({
            details,
            profileId,
          });
        }
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || !isCurrent) {
          return;
        }

        setCatalogDetailsState({
          details: null,
          profileId,
        });
      });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [open, profileId]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('properties.dialog.profileCardTitle')}</DialogTitle>
      <DialogContent dividers>
        {profile ? (
          <Stack spacing={1.25}>
            {catalogDetailsLoading && (
              <Typography variant="caption" color="text.secondary">
                {t('properties.messages.loadingCatalogProfiles')}
              </Typography>
            )}
            {catalogDetails && (
              <>
                <PropertyRow
                  label={t('properties.rows.profileType')}
                  value={formatCatalogProfileType(catalogDetails.catalogItem.profileType)}
                />
                <PropertyRow
                  label={t('properties.rows.standard')}
                  value={catalogDetails.catalogItem.standardName}
                />
                <PropertyRow
                  label={t('properties.rows.gost')}
                  value={catalogDetails.catalogItem.gostNumber}
                />
                <PropertyRow
                  label={t('properties.rows.designation')}
                  value={catalogDetails.catalogItem.designation}
                />
                {catalogDetails.catalogItem.series && (
                  <PropertyRow
                    label={t('properties.rows.series')}
                    value={catalogDetails.catalogItem.series}
                  />
                )}
                <PropertyRow
                  label={t('properties.rows.sourceId')}
                  value={catalogDetails.catalogItem.id}
                />
              </>
            )}
            <PropertyRow label={t('properties.rows.name')} value={profile.name} />
            <PropertyRow label={t('properties.rows.kind')} value={profile.kind} />
            <PropertyRow label={t('properties.rows.comment')} value={formatOptionalText(profile.comment)} />
            <PropertyRow label={t('properties.rows.mass')} value={`${formatNumber(profile.massKgPerM, 3)} kg/m`} />
            <PropertyRow label={t('properties.rows.area')} value={`${formatNumber(profile.section.areaMm2)} mm2`} />
            <PropertyRow label={t('properties.rows.iy')} value={`${formatNumber(profile.section.IyMm4)} mm4`} />
            <PropertyRow label={t('properties.rows.iz')} value={`${formatNumber(profile.section.IzMm4)} mm4`} />
            <PropertyRow label={t('properties.rows.jx')} value={`${formatNumber(profile.section.JxMm4)} mm4`} />
            <PropertyRow label={t('properties.rows.wy')} value={`${formatNumber(profile.section.WyMm3)} mm3`} />
            <PropertyRow label={t('properties.rows.wz')} value={`${formatNumber(profile.section.WzMm3)} mm3`} />
            <PropertyRow label={t('properties.rows.wx')} value={`${formatNumber(profile.section.WxMm3)} mm3`} />
          </Stack>
        ) : (
          <Alert severity="info">{t('properties.messages.noProfileAssigned')}</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
}

export function MaterialCardDialog({
  open,
  material,
  onClose,
}: {
  open: boolean;
  material: Material | undefined;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const materialIdentity = material == null ? null : parseCatalogMaterialId(material.id);
  const materialId = material?.id ?? null;
  const materialIdentityKey = materialIdentity == null ? null : `${materialIdentity.key}|${materialIdentity.propertyId}`;
  const [catalogMaterialState, setCatalogMaterialState] = useState<{
    materialId: string;
    option: SteelMaterialResolvedProperties | null;
  } | null>(null);
  const catalogMaterialOption = materialId != null && catalogMaterialState?.materialId === materialId
    ? catalogMaterialState.option
    : null;
  const catalogMaterialLoading = open && materialId != null && materialIdentity != null && catalogMaterialState?.materialId !== materialId;

  useEffect(() => {
    if (!open || materialId == null || materialIdentityKey == null || materialIdentity == null) {
      return;
    }

    const controller = new AbortController();
    let isCurrent = true;

    void materialsApi.getSteelDetails(materialIdentity.key, {
      signal: controller.signal,
      notifyOnError: false,
    })
      .then((details) => {
        if (!isCurrent) {
          return;
        }

        setCatalogMaterialState({
          materialId,
          option: details.propertiesByThickness.find((candidate) => candidate.propertyId === materialIdentity.propertyId) ?? null,
        });
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || !isCurrent) {
          return;
        }

        setCatalogMaterialState({
          materialId,
          option: null,
        });
      });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [materialId, materialIdentity, materialIdentityKey, open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('properties.dialog.materialCardTitle')}</DialogTitle>
      <DialogContent dividers>
        {material ? (
          <Stack spacing={1.25}>
            {catalogMaterialLoading && (
              <Typography variant="caption" color="text.secondary">
                {t('properties.messages.loadingCatalogMaterials')}
              </Typography>
            )}
            {catalogMaterialOption && (
              <>
                <PropertyRow
                  label={t('properties.rows.productType')}
                  value={formatMaterialProductTypesLabel(catalogMaterialOption.productTypes, t)}
                />
                <PropertyRow
                  label={t('properties.rows.materialThickness')}
                  value={formatMaterialThicknessRangeLabel(catalogMaterialOption.thickness)}
                />
                {catalogMaterialOption.strengthClass != null && (
                  <PropertyRow
                    label={t('properties.rows.strengthClass')}
                    value={`${catalogMaterialOption.strengthClass}`}
                  />
                )}
                <PropertyRow
                  label={t('properties.rows.propertyId')}
                  value={catalogMaterialOption.propertyId}
                />
                {formatMaterialSourceRefs(catalogMaterialOption).length > 0 && (
                  <PropertyRow
                    label={t('properties.rows.source')}
                    value={formatMaterialSourceRefs(catalogMaterialOption).join(' | ')}
                  />
                )}
              </>
            )}
            <PropertyRow label={t('properties.rows.name')} value={material.name} />
            <PropertyRow label={t('properties.rows.comment')} value={formatOptionalText(material.comment)} />
            <PropertyRow label={t('properties.rows.elasticModulus')} value={`${formatNumber(material.elasticModulusMPa)} MPa`} />
            <PropertyRow label={t('properties.rows.shearModulus')} value={`${formatNumber(material.shearModulusMPa)} MPa`} />
            <PropertyRow label={t('properties.rows.poisson')} value={formatNumber(material.poissonRatio, 3)} />
            <PropertyRow label={t('properties.rows.density')} value={`${formatNumber(material.densityKgPerM3)} kg/m3`} />
            <PropertyRow label={t('properties.rows.yield')} value={`${formatNumber(material.yieldStrengthMPa)} MPa`} />
          </Stack>
        ) : (
          <Alert severity="info">{t('properties.messages.noMaterialAssigned')}</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
}

export function LoadDetails({ load, units }: { load: Load; units: UnitSystem }) {
  const { t } = useI18n();

  if (load.type === 'nodal_concentrated') {
    const resolved = resolveConcentratedLoadVector(load);
    const vector = load.kind === 'force' ? resolved.force : resolved.moment;

    return (
      <>
        <PropertyRow label={t('properties.rows.type')} value={t('properties.values.nodalConcentrated')} />
        <PropertyRow label={t('properties.rows.kind')} value={load.kind === 'force' ? t('properties.loadKind.force') : t('properties.loadKind.moment')} />
        <PropertyRow label={t('properties.rows.magnitude')} value={`${formatNumber(load.magnitude, 3)} ${getLoadUnits(load, units)}`} />
        <PropertyRow label={t('properties.rows.direction')} value={formatVector(load.direction, 3)} />
        <PropertyRow label={t('properties.rows.resolvedVector')} value={formatVector(vector, 3)} />
        <PropertyRow label={t('properties.rows.coordinateSystem')} value={t('properties.coordinateSystem.global')} />
        <PropertyRow label={t('properties.rows.comment')} value={formatOptionalText(load.comment)} />
      </>
    );
  }

  if (load.distribution.type === 'linear') {
    const resolved = resolveDistributedLoadVectors(load);
    const xStartRel = load.distribution.xStartRel ?? 0;
    const xEndRel = load.distribution.xEndRel ?? 1;

    return (
      <>
        <PropertyRow label={t('properties.rows.type')} value={t('properties.values.memberDistributed')} />
        <PropertyRow label={t('properties.rows.kind')} value={load.kind === 'force' ? t('properties.loadKind.force') : t('properties.loadKind.moment')} />
        <PropertyRow label={t('properties.rows.direction')} value={formatVector(load.direction, 3)} />
        <PropertyRow
          label={t('properties.rows.qStart')}
          value={`${formatNumber(load.distribution.qStart, 3)} ${getLoadUnits(load, units)}`}
        />
        <PropertyRow
          label={t('properties.rows.qEnd')}
          value={`${formatNumber(load.distribution.qEnd, 3)} ${getLoadUnits(load, units)}`}
        />
        <PropertyRow label={t('properties.rows.range')} value={`${formatNumber(xStartRel, 3)} .. ${formatNumber(xEndRel, 3)} rel`} />
        <PropertyRow label={t('properties.rows.startVector')} value={formatVector(resolved.start, 3)} />
        <PropertyRow label={t('properties.rows.endVector')} value={formatVector(resolved.end, 3)} />
        <PropertyRow label={t('properties.rows.coordinateSystem')} value={t('properties.coordinateSystem.global')} />
        <PropertyRow label={t('properties.rows.comment')} value={formatOptionalText(load.comment)} />
      </>
    );
  }

  return (
    <>
      <PropertyRow label={t('properties.rows.type')} value={t('properties.values.memberDistributed')} />
      <PropertyRow label={t('properties.rows.kind')} value={load.kind === 'force' ? t('properties.loadKind.force') : t('properties.loadKind.moment')} />
      <PropertyRow label={t('properties.rows.direction')} value={formatVector(load.direction, 3)} />
      <PropertyRow label={t('properties.rows.distribution')} value={t('properties.values.functionPlaceholder')} />
      <PropertyRow label={t('properties.rows.expression')} value={load.distribution.expression} />
      <PropertyRow label={t('properties.rows.coordinateSystem')} value={t('properties.coordinateSystem.global')} />
      <PropertyRow label={t('properties.rows.comment')} value={formatOptionalText(load.comment)} />
    </>
  );
}

function resolveAsyncErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const message = error.message.trim();
    if (message.length > 0) {
      return message;
    }
  }

  return fallback;
}

function formatMaterialProductTypesLabel(productTypes: string[], t: ReturnType<typeof useI18n>['t']): string {
  return productTypes
    .map((productType) => t(`properties.values.materialProductType.${productType}` as never))
    .join(', ');
}
