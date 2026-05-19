import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';

import { useModelStore } from '../../app/store';
import type { WindCalculationMode, WindTerrainType } from '../../entities/model';
import { useI18n } from '../../shared/i18n';
import { notifyError, notifySuccess } from '../../shared/ui';
import { formatNumber } from '../../shared/utils';
import { NumberField } from './components/NumberField';
import {
  formatGammaFInput,
  formatPressurePaInput,
  getDefaultGammaFForMode,
  getInitialCalculationMode,
  getInitialSimpleGammaF,
  getInitialTerrainType,
  hasNonZeroWindZ,
  parseWindDraft,
  type WindDraftValidationError,
  type WindDraftValues,
} from './helpers';
import { useWindEditorStore } from './store';

const CONTROL_HEIGHT_PX = 40;
const WIND_VECTOR_STEP = 1;
const WIND_PRESSURE_STEP_PA = 10;
const WIND_GAMMA_F_STEP = 0.1;

const CONTROL_FIELD_SX = {
  '& .MuiInputBase-root': {
    minHeight: CONTROL_HEIGHT_PX,
    height: CONTROL_HEIGHT_PX,
  },
  '& .MuiInputBase-input': {
    boxSizing: 'border-box',
  },
  '& .MuiSelect-select': {
    minHeight: 'unset !important',
    display: 'flex',
    alignItems: 'center',
  },
} as const;

const ACTION_ICON_BUTTON_SX = {
  width: CONTROL_HEIGHT_PX,
  height: CONTROL_HEIGHT_PX,
} as const;

export function WindEditorDialog() {
  const { t } = useI18n();
  const model = useModelStore((state) => state.model);
  const activeLoadCaseId = useModelStore((state) => state.activeLoadCaseId);
  const setActiveLoadCaseId = useModelStore((state) => state.setActiveLoadCaseId);
  const open = useWindEditorStore((state) => state.isOpen);
  const close = useWindEditorStore((state) => state.close);

  const activeLoadCase = model.loadCases.find((loadCase) => loadCase.id === activeLoadCaseId) ?? model.loadCases[0];

  return (
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            width: { xs: 'calc(100% - 32px)', sm: 420 },
            maxWidth: '100%',
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
          },
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        {t('wind.dialog.title')}
      </DialogTitle>

      <DialogContent sx={{ pt: 2, pb: 0 }}>
        <Stack spacing={2}>
          {model.loadCases.length === 0 ? (
            <Alert severity="warning" variant="outlined">
              {t('wind.dialog.noLoadCases')}
            </Alert>
          ) : (
            <>
              <TextField
                select
                fullWidth
                label={t('wind.dialog.loadCase')}
                value={activeLoadCase?.id ?? ''}
                onChange={(event) => {
                  setActiveLoadCaseId(event.target.value);
                }}
                sx={CONTROL_FIELD_SX}
              >
                {model.loadCases.map((loadCase) => (
                  <MenuItem key={loadCase.id} value={loadCase.id}>
                    {loadCase.name}
                  </MenuItem>
                ))}
              </TextField>

              {activeLoadCase != null ? (
                <WindEditorForm
                  key={activeLoadCase.id}
                  loadCaseId={activeLoadCase.id}
                  loadCaseName={activeLoadCase.name}
                  initialDraft={{
                    x: String(activeLoadCase.wind.direction.x),
                    y: String(activeLoadCase.wind.direction.y),
                    nominalPressurePa: formatPressurePaInput(activeLoadCase.wind.nominalPressurePa),
                    terrainType: getInitialTerrainType(activeLoadCase.wind.terrainType),
                    gammaF: formatGammaFInput(activeLoadCase.wind.gammaF),
                    calculationMode: getInitialCalculationMode(activeLoadCase.wind.calculationMode),
                    comment: activeLoadCase.wind.comment ?? '',
                  }}
                  initialSimpleGammaF={formatGammaFInput(
                    getInitialSimpleGammaF(activeLoadCase.wind.gammaF, activeLoadCase.wind.calculationMode),
                  )}
                  initialWindZ={activeLoadCase.wind.direction.z}
                  onSaved={close}
                />
              ) : null}
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 2 }}>
        <Stack direction="row" spacing={1}>
          <ActionIconButton
            title={t('wind.dialog.cancel')}
            label={t('wind.dialog.cancel')}
            onClick={close}
          >
            <CloseIcon />
          </ActionIconButton>

          <ActionIconButton
            title={t('wind.dialog.save')}
            label={t('wind.dialog.save')}
            onClick={() => {
              (document.getElementById('wind-editor-form') as HTMLFormElement | null)?.requestSubmit();
            }}
            disabled={activeLoadCase == null}
          >
            <CheckIcon />
          </ActionIconButton>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

function WindEditorForm({
  loadCaseId,
  loadCaseName,
  initialDraft,
  initialSimpleGammaF,
  initialWindZ,
  onSaved,
}: {
  loadCaseId: string;
  loadCaseName: string;
  initialDraft: WindDraftValues;
  initialSimpleGammaF: string;
  initialWindZ: number;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const updateLoadCaseWind = useModelStore((state) => state.updateLoadCaseWind);
  const [draft, setDraft] = useState<WindDraftValues>(initialDraft);
  const [simpleGammaF, setSimpleGammaF] = useState<string>(initialSimpleGammaF);
  const [submitErrorText, setSubmitErrorText] = useState<string | null>(null);
  const [pressureFieldError, setPressureFieldError] = useState<string | null>(
    getPressureFieldError(t, initialDraft.nominalPressurePa),
  );
  const [gammaFFieldError, setGammaFFieldError] = useState<string | null>(
    getGammaFFieldError(t, initialDraft.gammaF),
  );

  function resetSubmitError() {
    setSubmitErrorText(null);
  }

  function handleCalculationModeChange(nextMode: WindCalculationMode) {
    const nextSimpleGammaF = draft.calculationMode === 'simple' ? draft.gammaF : simpleGammaF;

    if (draft.calculationMode === 'simple') {
      setSimpleGammaF(draft.gammaF);
    }

    setDraft((state) => ({
      ...state,
      calculationMode: nextMode,
      gammaF: nextMode === 'simple'
        ? nextSimpleGammaF
        : formatGammaFInput(getDefaultGammaFForMode(nextMode)),
    }));
    setGammaFFieldError(nextMode === 'simple' ? getGammaFFieldError(t, nextSimpleGammaF) : null);
    resetSubmitError();
  }

  function handlePressureChange(value: string) {
    setDraft((state) => ({ ...state, nominalPressurePa: value }));
    setPressureFieldError(getPressureFieldError(t, value));
    resetSubmitError();
  }

  function handleGammaFChange(value: string) {
    setDraft((state) => ({ ...state, gammaF: value }));
    setSimpleGammaF(value);
    setGammaFFieldError(getGammaFFieldError(t, value));
    resetSubmitError();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedDraft = parseWindDraft(draft);
    if (!parsedDraft.ok) {
      const errorMessage = getSubmitErrorMessage(t, parsedDraft.error);
      setSubmitErrorText(errorMessage);

      if (parsedDraft.error === 'invalid_pressure' || parsedDraft.error === 'negative_pressure') {
        setPressureFieldError(errorMessage);
      }

      if (parsedDraft.error === 'invalid_gamma_f' || parsedDraft.error === 'nonpositive_gamma_f') {
        setGammaFFieldError(errorMessage);
      }

      notifyError({
        title: t('wind.dialog.saveFailed'),
        details: [errorMessage],
      });
      return;
    }

    const result = updateLoadCaseWind(loadCaseId, parsedDraft.value);

    if (!result.ok) {
      setSubmitErrorText(result.error);
      notifyError({
        title: t('wind.dialog.saveFailed'),
        details: [result.error],
      });
      return;
    }

    notifySuccess({
      title: t('wind.dialog.saveSuccess'),
      details: [
        `${t('wind.dialog.loadCase')}: ${loadCaseName}`,
        `${t('wind.dialog.nominalPressure')}: ${formatNumber(parsedDraft.value.nominalPressurePa, 3)} ${t('wind.dialog.pressureUnit')}`,
      ],
    });
    onSaved();
  }

  return (
    <Stack component="form" id="wind-editor-form" spacing={2} onSubmit={handleSubmit}>
      {hasNonZeroWindZ(initialWindZ) ? (
        <Alert severity="warning" variant="outlined">
          {t('wind.dialog.zResetWarning', { value: formatNumber(initialWindZ, 3) })}
        </Alert>
      ) : null}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <NumberField
          fullWidth
          label={t('wind.dialog.directionX')}
          value={draft.x}
          step={WIND_VECTOR_STEP}
          onValueChange={(value) => {
            setDraft((state) => ({ ...state, x: value }));
            resetSubmitError();
          }}
          sx={CONTROL_FIELD_SX}
        />
        <NumberField
          fullWidth
          label={t('wind.dialog.directionY')}
          value={draft.y}
          step={WIND_VECTOR_STEP}
          onValueChange={(value) => {
            setDraft((state) => ({ ...state, y: value }));
            resetSubmitError();
          }}
          sx={CONTROL_FIELD_SX}
        />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          select
          fullWidth
          label={t('wind.dialog.calculationMode')}
          value={draft.calculationMode}
          onChange={(event) => {
            handleCalculationModeChange(event.target.value as WindCalculationMode);
          }}
          sx={CONTROL_FIELD_SX}
        >
          <MenuItem value="simple">{t('wind.dialog.calculationMode.simple')}</MenuItem>
          <MenuItem value="sp20">{t('wind.dialog.calculationMode.sp20')}</MenuItem>
          <MenuItem value="pue">{t('wind.dialog.calculationMode.pue')}</MenuItem>
        </TextField>

        <TextField
          select
          fullWidth
          label={t('wind.dialog.terrainType')}
          value={draft.terrainType}
          onChange={(event) => {
            setDraft((state) => ({ ...state, terrainType: event.target.value as WindTerrainType }));
            resetSubmitError();
          }}
          sx={CONTROL_FIELD_SX}
        >
          <MenuItem value="A">{t('wind.dialog.terrainType.A')}</MenuItem>
          <MenuItem value="B">{t('wind.dialog.terrainType.B')}</MenuItem>
          <MenuItem value="C">{t('wind.dialog.terrainType.C')}</MenuItem>
        </TextField>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <NumberField
          fullWidth
          label={`${t('wind.dialog.nominalPressure')} (${t('wind.dialog.pressureUnit')})`}
          value={draft.nominalPressurePa}
          min={0}
          step={WIND_PRESSURE_STEP_PA}
          error={pressureFieldError != null}
          helperText={pressureFieldError}
          onValueChange={handlePressureChange}
          sx={CONTROL_FIELD_SX}
        />

        <NumberField
          fullWidth
          label={t('wind.dialog.gammaF')}
          value={draft.gammaF}
          min={0}
          step={WIND_GAMMA_F_STEP}
          error={gammaFFieldError != null}
          helperText={gammaFFieldError}
          disabled={draft.calculationMode !== 'simple'}
          onValueChange={handleGammaFChange}
          sx={CONTROL_FIELD_SX}
        />
      </Stack>

      <TextField
        fullWidth
        label={t('common.comment')}
        value={draft.comment}
        onChange={(event) => {
          setDraft((state) => ({ ...state, comment: event.target.value }));
          resetSubmitError();
        }}
        sx={CONTROL_FIELD_SX}
      />

      {submitErrorText != null ? (
        <Alert severity="error" variant="outlined">
          {submitErrorText}
        </Alert>
      ) : null}
    </Stack>
  );
}

interface ActionIconButtonProps {
  title: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}

function ActionIconButton({
  title,
  label,
  onClick,
  disabled = false,
  children,
}: ActionIconButtonProps) {
  return (
    <Tooltip title={title}>
      <span>
        <IconButton aria-label={label} onClick={onClick} disabled={disabled} sx={ACTION_ICON_BUTTON_SX}>
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

function getPressureFieldError(
  t: ReturnType<typeof useI18n>['t'],
  value: string,
): string | null {
  if (value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return t('wind.dialog.errors.invalidPressure');
  }

  if (parsed < 0) {
    return t('wind.dialog.errors.negativePressure');
  }

  return null;
}

function getGammaFFieldError(
  t: ReturnType<typeof useI18n>['t'],
  value: string,
): string | null {
  if (value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return t('wind.dialog.errors.invalidGammaF');
  }

  if (parsed <= 0) {
    return t('wind.dialog.errors.nonpositiveGammaF');
  }

  return null;
}

function getSubmitErrorMessage(
  t: ReturnType<typeof useI18n>['t'],
  error: WindDraftValidationError,
): string {
  switch (error) {
    case 'invalid_direction':
      return t('wind.dialog.errors.invalidDirection');
    case 'invalid_pressure':
      return t('wind.dialog.errors.invalidPressure');
    case 'negative_pressure':
      return t('wind.dialog.errors.negativePressure');
    case 'invalid_gamma_f':
      return t('wind.dialog.errors.invalidGammaF');
    case 'nonpositive_gamma_f':
      return t('wind.dialog.errors.nonpositiveGammaF');
    case 'invalid_terrain_type':
      return t('wind.dialog.errors.invalidTerrainType');
    case 'invalid_calculation_mode':
      return t('wind.dialog.errors.invalidCalculationMode');
    default:
      return t('wind.dialog.errors.unknown');
  }
}
