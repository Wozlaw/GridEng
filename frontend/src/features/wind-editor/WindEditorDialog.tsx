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
import type { AppLanguage } from '../../shared/i18n';
import { useI18n } from '../../shared/i18n';
import { notifyError, notifySuccess } from '../../shared/ui';
import { formatNumber } from '../../shared/utils';
import { NumberField } from './components/NumberField';
import {
  formatPressurePaInput,
  hasNonZeroWindZ,
  parseWindDraft,
  type WindDraftValidationError,
  type WindDraftValues,
} from './helpers';
import { useWindEditorStore } from './store';

const WIND_VECTOR_STEP = 1;
const WIND_PRESSURE_STEP_PA = 10;

export function WindEditorDialog() {
  const { language } = useI18n();
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
        {localize(language, 'Ветер', 'Wind')}
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5 }}>
        <Stack spacing={2.25}>
          {model.loadCases.length === 0 ? (
            <Alert severity="warning" variant="outlined">
              {localize(language, 'В модели нет загружений для задания ветра.', 'The model has no load cases for wind input.')}
            </Alert>
          ) : (
            <>
              <TextField
                select
                fullWidth
                value={activeLoadCase?.id ?? ''}
                onChange={(event) => {
                  setActiveLoadCaseId(event.target.value);
                }}
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
                  language={language}
                  loadCaseId={activeLoadCase.id}
                  loadCaseName={activeLoadCase.name}
                  initialDraft={{
                    x: String(activeLoadCase.wind.direction.x),
                    y: String(activeLoadCase.wind.direction.y),
                    nominalPressurePa: formatPressurePaInput(activeLoadCase.wind.nominalPressurePa),
                    comment: activeLoadCase.wind.comment ?? '',
                  }}
                  initialWindZ={activeLoadCase.wind.direction.z}
                  onSaved={close}
                />
              ) : null}
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Stack direction="row" spacing={1}>
          <ActionIconButton
            title={localize(language, 'Отмена', 'Cancel')}
            label={localize(language, 'Отмена', 'Cancel')}
            onClick={close}
          >
            <CloseIcon />
          </ActionIconButton>

          <ActionIconButton
            title={localize(language, 'Сохранить', 'Save')}
            label={localize(language, 'Сохранить', 'Save')}
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
  language,
  loadCaseId,
  loadCaseName,
  initialDraft,
  initialWindZ,
  onSaved,
}: {
  language: AppLanguage;
  loadCaseId: string;
  loadCaseName: string;
  initialDraft: WindDraftValues;
  initialWindZ: number;
  onSaved: () => void;
}) {
  const updateLoadCaseWind = useModelStore((state) => state.updateLoadCaseWind);
  const [draft, setDraft] = useState<WindDraftValues>(initialDraft);
  const [submitErrorText, setSubmitErrorText] = useState<string | null>(null);
  const [pressureFieldError, setPressureFieldError] = useState<string | null>(
    getPressureFieldError(language, initialDraft.nominalPressurePa),
  );

  function handlePressureChange(value: string) {
    setDraft((state) => ({ ...state, nominalPressurePa: value }));
    setPressureFieldError(getPressureFieldError(language, value));
    setSubmitErrorText(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedDraft = parseWindDraft(draft);
    if (!parsedDraft.ok) {
      const errorMessage = getSubmitErrorMessage(language, parsedDraft.error);
      setSubmitErrorText(errorMessage);

      if (parsedDraft.error === 'invalid_pressure' || parsedDraft.error === 'negative_pressure') {
        setPressureFieldError(errorMessage);
      }

      notifyError({
        title: localize(language, 'Не удалось сохранить ветер.', 'Failed to save wind settings.'),
        details: [errorMessage],
      });
      return;
    }

    const result = updateLoadCaseWind(loadCaseId, parsedDraft.value);

    if (!result.ok) {
      setSubmitErrorText(result.error);
      notifyError({
        title: localize(language, 'Не удалось сохранить ветер.', 'Failed to save wind settings.'),
        details: [result.error],
      });
      return;
    }

    notifySuccess({
      title: localize(language, 'Параметры ветра обновлены.', 'Wind parameters updated.'),
      details: [
        `${localize(language, 'Загружение', 'Load case')}: ${loadCaseName}`,
        `${localize(language, 'Давление', 'Pressure')}: ${formatNumber(parsedDraft.value.nominalPressurePa, 3)} Па`,
      ],
    });
    onSaved();
  }

  return (
    <Stack component="form" id="wind-editor-form" spacing={2.25} onSubmit={handleSubmit}>
      {hasNonZeroWindZ(initialWindZ) ? (
        <Alert severity="warning" variant="outlined">
          {localize(
            language,
            `В текущей модели у ветра есть компонент Z = ${formatNumber(initialWindZ, 3)}. При сохранении он будет нормализован к 0.`,
            `The current model has a wind Z component of ${formatNumber(initialWindZ, 3)}. It will be normalized to 0 on save.`,
          )}
        </Alert>
      ) : null}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <NumberField
          fullWidth
          label="X"
          value={draft.x}
          step={WIND_VECTOR_STEP}
          onValueChange={(value) => {
            setDraft((state) => ({ ...state, x: value }));
            setSubmitErrorText(null);
          }}
        />
        <NumberField
          fullWidth
          label="Y"
          value={draft.y}
          step={WIND_VECTOR_STEP}
          onValueChange={(value) => {
            setDraft((state) => ({ ...state, y: value }));
            setSubmitErrorText(null);
          }}
        />
      </Stack>

      <NumberField
        fullWidth
        label={`${localize(language, 'Номинальное давление', 'Nominal pressure')} (Па)`}
        value={draft.nominalPressurePa}
        min={0}
        step={WIND_PRESSURE_STEP_PA}
        error={pressureFieldError != null}
        helperText={pressureFieldError}
        onValueChange={handlePressureChange}
      />

      <TextField
        fullWidth
        multiline
        minRows={3}
        label={localize(language, 'Комментарий', 'Comment')}
        value={draft.comment}
        onChange={(event) => {
          setDraft((state) => ({ ...state, comment: event.target.value }));
          setSubmitErrorText(null);
        }}
      />

      {submitErrorText != null ? (
        <Alert severity="error" variant="outlined">
          {submitErrorText}
        </Alert>
      ) : null}
    </Stack>
  );
}

function localize(language: AppLanguage, ru: string, en: string): string {
  return language === 'ru' ? ru : en;
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
        <IconButton aria-label={label} onClick={onClick} disabled={disabled}>
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

function getPressureFieldError(language: AppLanguage, value: string): string | null {
  if (value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return localize(language, 'Давление должно быть числом.', 'Pressure must be a number.');
  }

  if (parsed < 0) {
    return localize(language, 'Давление не может быть отрицательным.', 'Pressure cannot be negative.');
  }

  return null;
}

function getSubmitErrorMessage(language: AppLanguage, error: WindDraftValidationError): string {
  switch (error) {
    case 'invalid_direction':
      return localize(
        language,
        'Поля X и Y должны содержать корректные конечные числа.',
        'X and Y must contain valid finite numbers.',
      );
    case 'invalid_pressure':
      return localize(
        language,
        'Поле давления должно содержать корректное конечное число в Па.',
        'Pressure must contain a valid finite number in Pa.',
      );
    case 'negative_pressure':
      return localize(
        language,
        'Давление не может быть отрицательным.',
        'Pressure cannot be negative.',
      );
    default:
      return localize(language, 'Неизвестная ошибка формы ветра.', 'Unknown wind form error.');
  }
}
