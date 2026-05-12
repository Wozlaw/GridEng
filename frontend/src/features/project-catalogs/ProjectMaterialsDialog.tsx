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
import { getMaterialUsageStats } from './stats';
import { useProjectCatalogsStore } from './store';

export function ProjectMaterialsDialog() {
  const { language } = useI18n();
  const model = useModelStore((state) => state.model);
  const open = useProjectCatalogsStore((state) => state.materialsDialogOpen);
  const activeMaterialId = useProjectCatalogsStore((state) => state.activeMaterialId);
  const close = useProjectCatalogsStore((state) => state.closeMaterialsDialog);
  const setActiveMaterialId = useProjectCatalogsStore((state) => state.setActiveMaterialId);

  const activeMaterial = model.materials.find((material) => material.id === activeMaterialId) ?? model.materials[0];
  const usageStats = useMemo(
    () => (activeMaterial == null ? null : getMaterialUsageStats(model, activeMaterial.id)),
    [activeMaterial, model],
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
        {localize(language, 'Материалы проекта', 'Project materials')}
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
            {model.materials.map((material) => (
              <ListItemButton
                key={material.id}
                selected={material.id === activeMaterial?.id}
                onClick={() => {
                  setActiveMaterialId(material.id);
                }}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  alignItems: 'flex-start',
                }}
              >
                <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {material.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {material.id}
                  </Typography>
                </Stack>
              </ListItemButton>
            ))}
          </List>
        </Paper>

        <Box sx={{ minHeight: 0, overflowY: 'auto', p: 2 }}>
          {activeMaterial == null || usageStats == null
            ? (
              <Typography variant="body2" color="text.secondary">
                {localize(language, 'Материалы отсутствуют.', 'No materials available.')}
              </Typography>
            )
            : (
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }} useFlexGap>
                  <Typography variant="h6">{activeMaterial.name}</Typography>
                  <Chip size="small" label={activeMaterial.id} variant="outlined" />
                </Stack>

                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Stack spacing={1}>
                    <PropertyRow label={localize(language, 'Комментарий', 'Comment')} value={formatOptionalText(activeMaterial.comment)} />
                    <PropertyRow label="E" value={`${formatNumber(activeMaterial.elasticModulusMPa)} MPa`} />
                    <PropertyRow label="G" value={`${formatNumber(activeMaterial.shearModulusMPa)} MPa`} />
                    <PropertyRow label={localize(language, 'Коэф. Пуассона', 'Poisson ratio')} value={formatNumber(activeMaterial.poissonRatio, 3)} />
                    <PropertyRow label={localize(language, 'Плотность', 'Density')} value={`${formatNumber(activeMaterial.densityKgPerM3)} kg/m3`} />
                    <PropertyRow label={localize(language, 'Предел текучести', 'Yield strength')} value={`${formatNumber(activeMaterial.yieldStrengthMPa)} MPa`} />
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
