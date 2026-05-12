import type { ReactNode } from 'react';

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
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
import { useI18n } from '../../shared/i18n';
import { formatNumber, formatOptionalText, formatVector } from '../../shared/utils';

export function PropertySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">{title}</Typography>
      <Divider />
      <Stack spacing={1}>{children}</Stack>
    </Stack>
  );
}

export function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 132px) minmax(0, 1fr)',
        gap: 1,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
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
  profiles,
  currentProfileId,
  onClose,
  onSelect,
}: {
  open: boolean;
  profiles: Profile[];
  currentProfileId: string;
  onClose: () => void;
  onSelect: (profileId: string) => void;
}) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('properties.dialog.profileSelectTitle')}</DialogTitle>
      <DialogContent dividers>
        <List disablePadding>
          {profiles.map((profile) => (
            <ListItemButton
              key={profile.id}
              selected={profile.id === currentProfileId}
              onClick={() => onSelect(profile.id)}
            >
              <ListItemText primary={profile.name} secondary={profile.kind} />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
}

export function MaterialSelectionDialog({
  open,
  materials,
  currentMaterialId,
  onClose,
  onSelect,
}: {
  open: boolean;
  materials: Material[];
  currentMaterialId: string;
  onClose: () => void;
  onSelect: (materialId: string) => void;
}) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('properties.dialog.materialSelectTitle')}</DialogTitle>
      <DialogContent dividers>
        <List disablePadding>
          {materials.map((material) => (
            <ListItemButton
              key={material.id}
              selected={material.id === currentMaterialId}
              onClick={() => onSelect(material.id)}
            >
              <ListItemText
                primary={material.name}
                secondary={`${formatNumber(material.elasticModulusMPa, 0)} MPa`}
              />
            </ListItemButton>
          ))}
        </List>
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

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('properties.dialog.profileCardTitle')}</DialogTitle>
      <DialogContent dividers>
        {profile ? (
          <Stack spacing={1.25}>
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

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('properties.dialog.materialCardTitle')}</DialogTitle>
      <DialogContent dividers>
        {material ? (
          <Stack spacing={1.25}>
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
