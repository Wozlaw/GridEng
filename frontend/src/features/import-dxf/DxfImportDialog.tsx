import type { ChangeEvent } from 'react';
import { useState } from 'react';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import { useModelStore } from '../../app/store';
import { useI18n } from '../../shared/i18n';
import { notifyError, notifySuccess, notifyWarning } from '../../shared/ui';
import { getProfileCatalog } from '../../entities/section';
import { applyDxfProfileAssignments } from './assignDxfProfiles';
import { convertDxfToGridEngModel } from './dxfToGridEngModel';
import { DxfImportPreviewPanel } from './DxfImportPreview';
import {
  KEEP_DXF_CUSTOM_PROFILE_ID,
  type DxfAssignedProfileId,
  type DxfColorGroup,
  type DxfProfileAssignments,
  type DxfToGridEngModelResult,
} from './types';

interface DxfImportDialogProps {
  open: boolean;
  onClose: () => void;
}

const PROFILE_CATALOG = getProfileCatalog();

export function DxfImportDialog({ open, onClose }: DxfImportDialogProps) {
  const { t } = useI18n();
  const dxfImportSettings = useModelStore((state) => state.dxfImportSettings);
  const updateDxfImportSettings = useModelStore((state) => state.updateDxfImportSettings);
  const setModel = useModelStore((state) => state.setModel);

  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [dxfText, setDxfText] = useState<string | null>(null);
  const [fileReadError, setFileReadError] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [profileAssignments, setProfileAssignments] = useState<DxfProfileAssignments>({});

  const previewResult = getPreviewResult({
    open,
    selectedFileName,
    dxfText,
    fileReadError,
    settings: dxfImportSettings,
  });
  const previewGroups = previewResult?.preview.colorGroups ?? [];

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setIsReadingFile(true);
    setSelectedFileName(file.name);
    setFileReadError(null);
    setProfileAssignments({});

    try {
      const text = await file.text();
      setDxfText(text);
      setFileReadError(null);
    } catch (error) {
      setDxfText(null);
      setFileReadError(error instanceof Error ? error.message : 'Failed to read DXF file.');
    } finally {
      setIsReadingFile(false);
    }
  }

  function handleToleranceChange(value: string) {
    const nextTolerance = Number(value);
    if (!Number.isFinite(nextTolerance) || nextTolerance <= 0) {
      return;
    }

    updateDxfImportSettings({ toleranceMm: nextTolerance });
  }

  function handleImport() {
    if (!previewResult?.model || previewResult.preview.errors.length > 0 || !selectedFileName) {
      return;
    }

    let nextModel;
    try {
      nextModel = applyDxfProfileAssignments(previewResult.model, profileAssignments);
    } catch (error) {
      notifyError({
        title: t('dxf.notifications.errorTitle', { fileName: selectedFileName }),
        details: [
          t('dxf.notifications.profileAssignmentFailed'),
          error instanceof Error ? error.message : t('dxf.notifications.unknownError'),
        ],
      });
      return;
    }

    setModel(nextModel);

    if (previewResult.preview.warnings.length > 0) {
      notifyWarning({
        title: t('dxf.notifications.warningTitle', { fileName: selectedFileName }),
        details: previewResult.preview.warnings,
      });
    } else {
      notifySuccess({
        title: t('dxf.notifications.successTitle', { fileName: selectedFileName }),
        details: [t('dxf.notifications.successDetail')],
      });
    }

    closeDialog();
  }

  function closeDialog() {
    setSelectedFileName(null);
    setDxfText(null);
    setFileReadError(null);
    setIsReadingFile(false);
    setProfileAssignments({});
    onClose();
  }

  const canImport = previewResult?.model != null && previewResult.preview.errors.length === 0;

  return (
    <Dialog open={open} onClose={() => closeDialog()} fullWidth maxWidth="lg">
      <DialogTitle>{t('dxf.dialog.title')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            sx={{
              alignItems: { xs: 'stretch', md: 'center' },
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary">
                {t('dxf.dialog.supportNote')}
              </Typography>
            </Box>

            <Button component="label" variant="outlined" disabled={isReadingFile}>
              {isReadingFile
                ? t('dxf.dialog.reading')
                : selectedFileName
                  ? t('dxf.dialog.replaceFile')
                  : t('dxf.dialog.chooseFile')}
              <input
                hidden
                type="file"
                accept=".dxf"
                onChange={(event) => {
                  void handleFileChange(event);
                }}
              />
            </Button>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label={t('dxf.dialog.tolerance')}
              type="number"
              value={dxfImportSettings.toleranceMm}
              onChange={(event) => handleToleranceChange(event.target.value)}
              slotProps={{ htmlInput: { min: 0.001, step: 0.1 } }}
              sx={{ minWidth: { xs: '100%', md: 180 } }}
            />

            <FormControlLabel
              control={(
                <Switch
                  checked={dxfImportSettings.centerOnXY}
                  onChange={(_event, checked) => {
                    updateDxfImportSettings({ centerOnXY: checked });
                  }}
                />
              )}
              label={t('dxf.dialog.centerOnXY')}
            />

            <FormControlLabel
              control={(
                <Switch
                  checked={dxfImportSettings.force2DToXY}
                  onChange={(_event, checked) => {
                    updateDxfImportSettings({ force2DToXY: checked });
                  }}
                />
              )}
              label={t('dxf.dialog.force2DToXY')}
            />
          </Stack>

          <DxfImportPreviewPanel
            fileName={selectedFileName}
            preview={previewResult?.preview ?? null}
            isBusy={isReadingFile}
          />

          <DxfProfileAssignmentTable
            colorGroups={previewGroups}
            assignments={profileAssignments}
            onAssignmentChange={(groupKey, profileId) => {
              setProfileAssignments((current) => ({
                ...current,
                [groupKey]: profileId,
              }));
            }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={closeDialog}>{t('dxf.dialog.cancel')}</Button>
        <Button variant="contained" onClick={handleImport} disabled={!canImport}>
          {t('dxf.dialog.import')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface DxfProfileAssignmentTableProps {
  colorGroups: DxfColorGroup[];
  assignments: DxfProfileAssignments;
  onAssignmentChange: (groupKey: string, profileId: DxfAssignedProfileId) => void;
}

function DxfProfileAssignmentTable({
  colorGroups,
  assignments,
  onAssignmentChange,
}: DxfProfileAssignmentTableProps) {
  const { t } = useI18n();

  if (colorGroups.length === 0) {
    return null;
  }

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="subtitle2">{t('dxf.dialog.profileAssignmentTitle')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t('dxf.dialog.profileAssignmentHint')}
        </Typography>
      </Box>

      <TableContainer sx={{ maxHeight: 320 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('dxf.dialog.table.group')}</TableCell>
              <TableCell align="right">{t('dxf.dialog.table.members')}</TableCell>
              <TableCell>{t('dxf.dialog.table.temporaryProfile')}</TableCell>
              <TableCell sx={{ minWidth: 240 }}>{t('dxf.dialog.table.assignedProfile')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {colorGroups.map((group) => (
              <TableRow key={group.key} hover>
                <TableCell>
                  <Stack spacing={0.25}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {group.key}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('dxf.preview.layerLabel', { value: group.layer?.trim() || '-' })}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell align="right">{group.membersCount}</TableCell>
                <TableCell>
                  <Stack spacing={0.25}>
                    <Typography variant="body2">
                      {group.temporaryProfileName ?? group.profileId ?? `DXF ${group.key}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {group.profileId ?? '-'}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Select
                    fullWidth
                    size="small"
                    value={assignments[group.key] ?? KEEP_DXF_CUSTOM_PROFILE_ID}
                    onChange={(event) => {
                      onAssignmentChange(group.key, event.target.value as DxfAssignedProfileId);
                    }}
                  >
                    <MenuItem value={KEEP_DXF_CUSTOM_PROFILE_ID}>
                      {t('dxf.dialog.keepCustom', {
                        name: group.temporaryProfileName ?? group.profileId ?? `DXF ${group.key}`,
                      })}
                    </MenuItem>
                    {PROFILE_CATALOG.map((profile) => (
                      <MenuItem key={profile.id} value={profile.id}>
                        {profile.name} ({profile.kind})
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function getPreviewResult({
  open,
  selectedFileName,
  dxfText,
  fileReadError,
  settings,
}: {
  open: boolean;
  selectedFileName: string | null;
  dxfText: string | null;
  fileReadError: string | null;
  settings: {
    toleranceMm: number;
    centerOnXY: boolean;
    force2DToXY: boolean;
  };
}): DxfToGridEngModelResult | null {
  if (!open || !selectedFileName) {
    return null;
  }

  if (fileReadError) {
    return {
      model: null,
      preview: {
        linesCount: 0,
        ignoredEntitiesCount: 0,
        is3D: false,
        zRange: null,
        nodesCount: 0,
        membersCount: 0,
        mergedNodesCount: 0,
        danglingMembersCount: 0,
        colorGroups: [],
        warnings: [],
        errors: [fileReadError],
      },
    };
  }

  if (dxfText == null) {
    return null;
  }

  return convertDxfToGridEngModel(dxfText, {
    fileName: selectedFileName,
    toleranceMm: settings.toleranceMm,
    centerOnXY: settings.centerOnXY,
    force2DToXY: settings.force2DToXY,
  });
}
