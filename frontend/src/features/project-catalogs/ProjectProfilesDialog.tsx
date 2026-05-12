import { useMemo } from 'react';

import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import { useModelStore } from '../../app/store';
import type { AppLanguage } from '../../shared/i18n';
import { useI18n } from '../../shared/i18n';
import { formatNumber, formatOptionalText } from '../../shared/utils';
import { getProfileUsageStats } from './stats';
import { useProjectCatalogsStore } from './store';

export function ProjectProfilesDialog() {
  const { language } = useI18n();
  const model = useModelStore((state) => state.model);
  const open = useProjectCatalogsStore((state) => state.profilesDialogOpen);
  const activeProfileId = useProjectCatalogsStore((state) => state.activeProfileId);
  const close = useProjectCatalogsStore((state) => state.closeProfilesDialog);
  const setActiveProfileId = useProjectCatalogsStore((state) => state.setActiveProfileId);

  const activeProfile = model.profiles.find((profile) => profile.id === activeProfileId) ?? model.profiles[0];
  const usageStats = useMemo(
    () => (activeProfile == null ? null : getProfileUsageStats(model, activeProfile.id)),
    [activeProfile, model],
  );

  return (
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      maxWidth="lg"
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
            minHeight: { xs: '72vh', md: '76vh' },
          },
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        {localize(language, 'Профили проекта', 'Project profiles')}
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '300px minmax(0, 1fr)' },
          minHeight: 0,
        }}
      >
        <Paper
          square
          variant="outlined"
          sx={{
            borderTop: 'none',
            borderBottom: 'none',
            borderLeft: 'none',
            minHeight: 0,
            overflowY: 'auto',
          }}
        >
          <List disablePadding>
            {model.profiles.map((profile) => (
              <ListItemButton
                key={profile.id}
                selected={profile.id === activeProfile?.id}
                onClick={() => {
                  setActiveProfileId(profile.id);
                }}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  alignItems: 'flex-start',
                }}
              >
                <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: profile.color ?? 'text.secondary',
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {profile.name}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {profile.kind} · {profile.id}
                  </Typography>
                </Stack>
              </ListItemButton>
            ))}
          </List>
        </Paper>

        <Box sx={{ minHeight: 0, overflowY: 'auto', p: 2 }}>
          {activeProfile == null || usageStats == null
            ? (
              <Typography variant="body2" color="text.secondary">
                {localize(language, 'Профили отсутствуют.', 'No profiles available.')}
              </Typography>
            )
            : (
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }} useFlexGap>
                  <Typography variant="h6">{activeProfile.name}</Typography>
                  <Chip size="small" label={activeProfile.kind} variant="outlined" />
                  <Chip size="small" label={activeProfile.id} variant="outlined" />
                </Stack>

                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Stack spacing={1}>
                    <PropertyRow label={localize(language, 'Комментарий', 'Comment')} value={formatOptionalText(activeProfile.comment)} />
                    <PropertyRow label={localize(language, 'Цвет', 'Color')} value={activeProfile.color ?? '-'} />
                    <PropertyRow label={localize(language, 'Площадь', 'Area')} value={`${formatNumber(activeProfile.section.areaMm2)} mm2`} />
                    <PropertyRow label="Jx" value={`${formatNumber(activeProfile.section.JxMm4)} mm4`} />
                    <PropertyRow label="Iy" value={`${formatNumber(activeProfile.section.IyMm4)} mm4`} />
                    <PropertyRow label="Iz" value={`${formatNumber(activeProfile.section.IzMm4)} mm4`} />
                    <PropertyRow label="Wx" value={`${formatNumber(activeProfile.section.WxMm3)} mm3`} />
                    <PropertyRow label="Wy" value={`${formatNumber(activeProfile.section.WyMm3)} mm3`} />
                    <PropertyRow label="Wz" value={`${formatNumber(activeProfile.section.WzMm3)} mm3`} />
                    <PropertyRow label={localize(language, 'Масса', 'Mass')} value={`${formatNumber(activeProfile.massKgPerM, 3)} kg/m`} />
                    <PropertyRow label={localize(language, 'Поворот по умолчанию', 'Default rotation')} value={`${formatNumber(activeProfile.defaultLocalAxisRotationDeg, 3)} deg`} />
                    <PropertyRow label={localize(language, 'Смещение Y', 'Default offset Y')} value={`${formatNumber(activeProfile.defaultOffsetYmm, 3)} mm`} />
                    <PropertyRow label={localize(language, 'Смещение Z', 'Default offset Z')} value={`${formatNumber(activeProfile.defaultOffsetZmm, 3)} mm`} />
                  </Stack>
                </Paper>

                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Stack spacing={1}>
                    <Typography variant="overline" color="text.secondary">
                      {localize(language, 'Параметры сечения', 'Section parameters')}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
                      {Object.entries(activeProfile.params).map(([key, value]) => (
                        <Chip
                          key={key}
                          size="small"
                          label={`${key} = ${formatNumber(value, 3)}`}
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </Stack>
                </Paper>

                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Stack spacing={1}>
                    <Typography variant="overline" color="text.secondary">
                      {localize(language, 'Использование в модели', 'Model usage')}
                    </Typography>
                    <PropertyRow label={localize(language, 'Количество элементов', 'Members count')} value={`${usageStats.membersCount}`} />
                    <PropertyRow label={localize(language, 'Суммарная длина', 'Total length')} value={`${formatNumber(usageStats.totalLengthMm, 3)} mm / ${formatNumber(usageStats.totalLengthMm / 1000, 3)} m`} />
                    <PropertyRow label={localize(language, 'Суммарная масса', 'Total mass')} value={`${formatNumber(usageStats.totalMassKg, 3)} kg`} />
                  </Stack>
                </Paper>
              </Stack>
            )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'right' }}>
          {value}
        </Typography>
      </Stack>
      <Divider />
    </>
  );
}

function localize(language: AppLanguage, ru: string, en: string): string {
  return language === 'ru' ? ru : en;
}
