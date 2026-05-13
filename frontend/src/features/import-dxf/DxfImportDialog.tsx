import type { ChangeEvent, ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';

import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';

import { useModelStore } from '../../app/store';
import { useI18n } from '../../shared/i18n';
import { notifySuccess, notifyWarning } from '../../shared/ui';
import { applyDxfProfileAssignmentsToResult } from './assignDxfProfiles';
import { DxfImportLogDialog } from './DxfImportLogDialog';
import { DxfProfileAssignmentPanel } from './DxfProfileAssignmentPanel';
import { DxfPreviewScene } from './DxfPreviewScene';
import { countDxfPreviewDiagnosticsByCode } from './diagnostics';
import { convertDxfToGridEngModel } from './dxfToGridEngModel';
import { DxfImportPreviewPanel } from './DxfImportPreview';
import type {
  DxfImportPreview,
  DxfPreviewColorMode,
  DxfPreviewDiagnostic,
  DxfProfileAssignments,
  DxfToGridEngModelResult,
} from './types';

interface DxfImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function DxfImportDialog({ open, onClose }: DxfImportDialogProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dxfImportSettings = useModelStore((state) => state.dxfImportSettings);
  const setModel = useModelStore((state) => state.setModel);

  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [dxfText, setDxfText] = useState<string | null>(null);
  const [fileReadError, setFileReadError] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [previewColorMode, setPreviewColorMode] = useState<DxfPreviewColorMode>('diagnostics');
  const [profileAssignments, setProfileAssignments] = useState<DxfProfileAssignments>({});

  const rawPreviewResult = useMemo(() => getPreviewResult({
    open,
    selectedFileName,
    dxfText,
    fileReadError,
    settings: dxfImportSettings,
  }), [dxfImportSettings, dxfText, fileReadError, open, selectedFileName]);

  const previewResult = useMemo(() => {
    if (rawPreviewResult == null) {
      return null;
    }

    return applyDxfProfileAssignmentsToResult(rawPreviewResult, profileAssignments);
  }, [profileAssignments, rawPreviewResult]);

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

  function handleImport() {
    if (!previewResult?.model || previewResult.preview.errors.length > 0 || !selectedFileName) {
      return;
    }

    setModel(previewResult.model);

    if (previewResult.preview.warnings.length > 0) {
      notifyWarning({
        title: t('dxf.notifications.warningTitle', { fileName: selectedFileName }),
        details: [t('dxf.notifications.warningDetail', { count: previewResult.preview.warnings.length })],
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
    setIsLogDialogOpen(false);
    setPreviewColorMode('diagnostics');
    setProfileAssignments({});
    onClose();
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  const unassignedProfileCount = previewResult == null
    ? 0
    : countDxfPreviewDiagnosticsByCode(previewResult.preview, 'group_profile_unassigned');
  const canImport = previewResult?.model != null
    && previewResult.preview.errors.length === 0
    && unassignedProfileCount === 0;
  const canOpenLogs = previewResult != null;

  return (
    <>
      <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="md">
        <DialogTitle>{t('dxf.dialog.title')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".dxf"
              style={{ display: 'none' }}
              onChange={(event) => {
                void handleFileChange(event);
              }}
            />

            <DxfImportPreviewPanel
              fileName={selectedFileName}
              preview={previewResult?.preview ?? null}
              isBusy={isReadingFile}
            />

            <DxfPreviewScene
              preview={previewResult?.preview ?? null}
              colorMode={previewColorMode}
              onColorModeChange={setPreviewColorMode}
              isBusy={isReadingFile}
            />

            <DxfProfileAssignmentPanel
              key={selectedFileName ?? 'dxf-profile-assignment'}
              groups={previewResult?.preview.colorGroups ?? []}
              assignments={profileAssignments}
              onAssignmentsChange={setProfileAssignments}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Stack direction="row" spacing={1}>
            <ActionIconButton
              title={selectedFileName ? t('dxf.dialog.replaceFile') : t('dxf.dialog.chooseFile')}
              label={selectedFileName ? t('dxf.dialog.replaceFile') : t('dxf.dialog.chooseFile')}
              onClick={openFilePicker}
              disabled={isReadingFile}
            >
              <UploadFileIcon />
            </ActionIconButton>

            <ActionIconButton
              title={t('dxf.dialog.openLogs')}
              label={t('dxf.dialog.openLogs')}
              onClick={() => setIsLogDialogOpen(true)}
              disabled={!canOpenLogs}
            >
              <ArticleOutlinedIcon />
            </ActionIconButton>

            <ActionIconButton
              title={t('dxf.dialog.cancel')}
              label={t('dxf.dialog.cancel')}
              onClick={closeDialog}
            >
              <CloseIcon />
            </ActionIconButton>

            <ActionIconButton
              title={t('dxf.dialog.import')}
              label={t('dxf.dialog.import')}
              onClick={handleImport}
              disabled={!canImport}
            >
              <CheckIcon />
            </ActionIconButton>
          </Stack>
        </DialogActions>
      </Dialog>

      <DxfImportLogDialog
        open={isLogDialogOpen}
        fileName={selectedFileName}
        previewResult={previewResult}
        settings={dxfImportSettings}
        onClose={() => setIsLogDialogOpen(false)}
      />
    </>
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
        <IconButton aria-label={label} onClick={onClick} disabled={disabled}>
          {children}
        </IconButton>
      </span>
    </Tooltip>
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
      preview: createFileReadErrorPreview(fileReadError),
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

function createFileReadErrorPreview(message: string): DxfImportPreview {
  return {
    linesCount: 0,
    ignoredEntitiesCount: 0,
    is3D: false,
    zRange: null,
    nodesCount: 0,
    membersCount: 0,
    mergedNodesCount: 0,
    danglingMembersCount: 0,
    colorGroups: [],
    diagnostics: {
      summary: [createSummaryErrorDiagnostic(message)],
      lines: [],
      members: [],
      nodes: [],
      groups: [],
    },
    warnings: [],
    errors: [message],
  };
}

function createSummaryErrorDiagnostic(message: string): DxfPreviewDiagnostic {
  return {
    status: 'error',
    code: 'file_read_error',
    message,
  };
}
