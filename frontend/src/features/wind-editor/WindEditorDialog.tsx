import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { useModelStore } from '../../app/store';
import type { AppLanguage } from '../../shared/i18n';
import { useI18n } from '../../shared/i18n';
import { notifyError, notifySuccess } from '../../shared/ui';
import { formatNumber } from '../../shared/utils';
import { useWindEditorStore } from './store';

interface WindDraft {
  x: string;
  y: string;
  z: string;
  nominalPressureKPa: string;
  comment: string;
}

export function WindEditorDialog() {
  const { language } = useI18n();
  const model = useModelStore((state) => state.model);
  const open = useWindEditorStore((state) => state.isOpen);
  const activeLoadCaseId = useWindEditorStore((state) => state.activeLoadCaseId);
  const setActiveLoadCaseId = useWindEditorStore((state) => state.setActiveLoadCaseId);
  const close = useWindEditorStore((state) => state.close);

  const activeLoadCase = model.loadCases.find((loadCase) => loadCase.id === activeLoadCaseId) ?? model.loadCases[0];

  return (
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
          },
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        {localize(language, 'Ручной ветер', 'Manual wind')}
      </DialogTitle>

      <DialogContent sx={{ display: 'grid', gap: 2, pt: 2.5 }}>
        {model.loadCases.length === 0
          ? (
            <Alert severity="warning">
              {localize(language, 'В модели нет загружений для задания ветра.', 'The model has no load cases for wind input.')}
            </Alert>
          )
          : (
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <TextField
                select
                fullWidth
                label={localize(language, 'Загружение', 'Load case')}
                value={activeLoadCase?.id ?? ''}
                onChange={(event) => {
                  setActiveLoadCaseId(event.target.value);
                }}
              >
                {model.loadCases.map((loadCase) => (
                  <MenuItem key={loadCase.id} value={loadCase.id}>
                    {loadCase.name} ({loadCase.id})
                  </MenuItem>
                ))}
              </TextField>

              {activeLoadCase != null && (
                <WindEditorForm
                  key={activeLoadCase.id}
                  language={language}
                  loadCaseId={activeLoadCase.id}
                  loadCaseName={activeLoadCase.name}
                  initialDraft={{
                    x: String(activeLoadCase.wind.direction.x),
                    y: String(activeLoadCase.wind.direction.y),
                    z: String(activeLoadCase.wind.direction.z),
                    nominalPressureKPa: String(activeLoadCase.wind.nominalPressureKPa),
                    comment: activeLoadCase.wind.comment ?? '',
                  }}
                  onSaved={() => {
                    close();
                  }}
                />
              )}
            </Stack>
          )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={close}>
          {localize(language, 'Отмена', 'Cancel')}
        </Button>
        <Button
          variant="contained"
          form="wind-editor-form"
          type="submit"
          disabled={activeLoadCase == null}
        >
          {localize(language, 'Сохранить', 'Save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function localize(language: AppLanguage, ru: string, en: string): string {
  return language === 'ru' ? ru : en;
}

function WindEditorForm({
  language,
  loadCaseId,
  loadCaseName,
  initialDraft,
  onSaved,
}: {
  language: AppLanguage;
  loadCaseId: string;
  loadCaseName: string;
  initialDraft: WindDraft;
  onSaved: () => void;
}) {
  const updateLoadCaseWind = useModelStore((state) => state.updateLoadCaseWind);
  const [draft, setDraft] = useState<WindDraft>(initialDraft);
  const [errorText, setErrorText] = useState<string | null>(null);

  const windDisabled = useMemo(() => {
    const x = Number(draft.x);
    const y = Number(draft.y);
    const z = Number(draft.z);

    return Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)
      && x === 0
      && y === 0
      && z === 0;
  }, [draft]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const x = Number(draft.x);
    const y = Number(draft.y);
    const z = Number(draft.z);
    const nominalPressureKPa = Number(draft.nominalPressureKPa);

    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || !Number.isFinite(nominalPressureKPa)) {
      const message = localize(
        language,
        'Поля направления и давления должны содержать корректные числа.',
        'Direction and pressure fields should contain valid finite numbers.',
      );
      setErrorText(message);
      notifyError({
        title: localize(language, 'Не удалось сохранить ветер.', 'Failed to save wind settings.'),
        details: [message],
      });
      return;
    }

    const result = updateLoadCaseWind(loadCaseId, {
      direction: { x, y, z },
      nominalPressureKPa,
      comment: draft.comment.trim() || undefined,
    });

    if (!result.ok) {
      setErrorText(result.error);
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
        `${localize(language, 'Давление', 'Pressure')}: ${formatNumber(nominalPressureKPa, 3)} kPa`,
      ],
    });
    onSaved();
  }

  return (
    <Stack component="form" id="wind-editor-form" spacing={2} onSubmit={handleSubmit}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          label="X"
          value={draft.x}
          onChange={(event) => {
            setDraft((state) => ({ ...state, x: event.target.value }));
          }}
        />
        <TextField
          label="Y"
          value={draft.y}
          onChange={(event) => {
            setDraft((state) => ({ ...state, y: event.target.value }));
          }}
        />
        <TextField
          label="Z"
          value={draft.z}
          onChange={(event) => {
            setDraft((state) => ({ ...state, z: event.target.value }));
          }}
        />
      </Stack>

      <TextField
        fullWidth
        label={`${localize(language, 'Номинальное давление', 'Nominal pressure')} (kPa)`}
        value={draft.nominalPressureKPa}
        onChange={(event) => {
          setDraft((state) => ({ ...state, nominalPressureKPa: event.target.value }));
        }}
      />

      <TextField
        fullWidth
        multiline
        minRows={3}
        label={localize(language, 'Комментарий', 'Comment')}
        value={draft.comment}
        onChange={(event) => {
          setDraft((state) => ({ ...state, comment: event.target.value }));
        }}
      />

      <Alert severity={windDisabled ? 'info' : 'success'}>
        {windDisabled
          ? localize(
            language,
            'Нулевой вектор направления означает, что ветер отключен для этого загружения.',
            'A zero direction vector means wind is disabled for this load case.',
          )
          : localize(
            language,
            'Направление будет нормализовано при сохранении. Нормативный расчет ветра в этой итерации не реализуется.',
            'Direction will be normalized on save. The normative wind calculator is not implemented in this iteration.',
          )}
      </Alert>

      {errorText != null && (
        <Alert severity="error">{errorText}</Alert>
      )}

      <Typography variant="body2" color="text.secondary">
        {localize(language, 'Текущее загружение', 'Current load case')}: {loadCaseName}
      </Typography>
    </Stack>
  );
}
