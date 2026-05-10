import type { ChangeEvent, SyntheticEvent } from 'react';
import { useState } from 'react';

import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';

import { useModelStore } from '../../app/store';
import { convertDxfToGridEngModel } from './dxfToGridEngModel';
import { DxfImportPreviewPanel } from './DxfImportPreview';
import type { DxfToGridEngModelResult } from './types';

interface DxfImportDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ImportFeedback {
  severity: 'success' | 'warning' | 'error';
  title: string;
  details: string[];
}

const MAX_FEEDBACK_DETAILS = 3;

export function DxfImportDialog({ open, onClose }: DxfImportDialogProps) {
  const dxfImportSettings = useModelStore((state) => state.dxfImportSettings);
  const updateDxfImportSettings = useModelStore((state) => state.updateDxfImportSettings);
  const setModel = useModelStore((state) => state.setModel);

  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [dxfText, setDxfText] = useState<string | null>(null);
  const [fileReadError, setFileReadError] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [feedback, setFeedback] = useState<ImportFeedback | null>(null);

  const previewResult = getPreviewResult({
    open,
    selectedFileName,
    dxfText,
    fileReadError,
    settings: dxfImportSettings,
  });

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setIsReadingFile(true);
    setSelectedFileName(file.name);
    setFileReadError(null);

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

    setModel(previewResult.model);
    setFeedback({
      severity: previewResult.preview.warnings.length > 0 ? 'warning' : 'success',
      title: previewResult.preview.warnings.length > 0
        ? `Imported with warnings: ${selectedFileName}`
        : `Imported: ${selectedFileName}`,
      details: previewResult.preview.warnings.length > 0
        ? previewResult.preview.warnings
        : ['DXF model was imported into the current GridEng session.'],
    });
    closeDialog();
  }

  function closeDialog() {
    setSelectedFileName(null);
    setDxfText(null);
    setFileReadError(null);
    setIsReadingFile(false);
    onClose();
  }

  function handleFeedbackClose(_event?: Event | SyntheticEvent, reason?: string) {
    if (reason === 'clickaway') {
      return;
    }

    setFeedback(null);
  }

  const canImport = previewResult?.model != null && previewResult.preview.errors.length === 0;
  const visibleDetails = feedback?.details.slice(0, MAX_FEEDBACK_DETAILS) ?? [];
  const hiddenDetailsCount = feedback ? Math.max(0, feedback.details.length - MAX_FEEDBACK_DETAILS) : 0;

  return (
    <>
      <Dialog open={open} onClose={() => closeDialog()} fullWidth maxWidth="lg">
        <DialogTitle>Import DXF</DialogTitle>
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
                  DXF import v0.1 supports `LINE` only. Other entity types are ignored.
                </Typography>
              </Box>

              <Button component="label" variant="outlined" disabled={isReadingFile}>
                {isReadingFile ? 'Reading DXF...' : selectedFileName ? 'Replace DXF file' : 'Choose DXF file'}
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
                label="Tolerance, mm"
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
                label="Center on XY"
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
                label="Force 2D to XY"
              />
            </Stack>

            <DxfImportPreviewPanel
              fileName={selectedFileName}
              preview={previewResult?.preview ?? null}
              isBusy={isReadingFile}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleImport} disabled={!canImport}>
            Import
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={feedback != null}
        autoHideDuration={feedback?.severity === 'warning' ? 8000 : 6000}
        onClose={handleFeedbackClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={feedback?.severity ?? 'success'}
          variant="filled"
          onClose={handleFeedbackClose}
          sx={{ width: '100%', maxWidth: 560 }}
        >
          {feedback && (
            <>
              <AlertTitle>{feedback.title}</AlertTitle>
              <Stack spacing={0.5}>
                {visibleDetails.map((detail) => (
                  <Typography key={detail} variant="body2">
                    {detail}
                  </Typography>
                ))}
                {hiddenDetailsCount > 0 && (
                  <Typography variant="body2">
                    ... and {hiddenDetailsCount} more.
                  </Typography>
                )}
              </Stack>
            </>
          )}
        </Alert>
      </Snackbar>
    </>
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
