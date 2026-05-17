import type { ChangeEvent, ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';

import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { useModelStore } from '../../app/store';
import { createProfileFromCatalogDetails, type CrossSectionCatalogItem } from '../../entities/section';
import { crossSectionsApi } from '../../shared/api';
import { useI18n } from '../../shared/i18n';
import { notifyError, notifySuccess, notifyWarning } from '../../shared/ui';
import { applyDxfProfileAssignments, applyDxfProfileAssignmentsToPreview } from './assignDxfProfiles';
import { DxfImportLogSectionsPanel } from './DxfImportLogContent';
import { DxfProfileAssignmentPanel } from './DxfProfileAssignmentPanel';
import { DxfPreviewScene } from './DxfPreviewScene';
import { countDxfPreviewDiagnosticsByCode } from './diagnostics';
import { buildAssignedCatalogProfileColors } from './dxfProfileAssignmentCatalog';
import { convertDxfToGridEngModel } from './dxfToGridEngModel';
import { DxfImportPreviewPanel } from './DxfImportPreview';
import {
  applyDxfPreviewDisplayStateToModel,
  buildDxfPreviewDisplayState,
  ZERO_DXF_PREVIEW_ROTATION,
  type DxfPreviewRotationDeg,
} from './previewTransform';
import type {
  DxfGroupDisplayColors,
  DxfImportPreview,
  DxfPreviewColorMode,
  DxfPreviewDiagnostic,
  DxfProfileAssignments,
  DxfToGridEngModelResult,
} from './types';

type DxfDialogTab = 'model' | 'profiles' | 'logs';

interface DxfImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function DxfImportDialog({ open, onClose }: DxfImportDialogProps) {
  const { t } = useI18n();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dxfImportSettings = useModelStore((state) => state.dxfImportSettings);
  const setModel = useModelStore((state) => state.setModel);

  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [dxfText, setDxfText] = useState<string | null>(null);
  const [fileReadError, setFileReadError] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [activeTab, setActiveTab] = useState<DxfDialogTab>('model');
  const [previewColorMode, setPreviewColorMode] = useState<DxfPreviewColorMode>('diagnostics');
  const [previewRotationDeg, setPreviewRotationDeg] = useState<DxfPreviewRotationDeg>(ZERO_DXF_PREVIEW_ROTATION);
  const [profileAssignments, setProfileAssignments] = useState<DxfProfileAssignments>({});
  const [groupDisplayColors, setGroupDisplayColors] = useState<DxfGroupDisplayColors>({});
  const [assignedCatalogItemsByGroup, setAssignedCatalogItemsByGroup] = useState<
    Partial<Record<string, CrossSectionCatalogItem>>
  >({});
  const [isImporting, setIsImporting] = useState(false);

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

    return {
      model: rawPreviewResult.model,
      preview: applyDxfProfileAssignmentsToPreview(rawPreviewResult.preview, profileAssignments),
    };
  }, [profileAssignments, rawPreviewResult]);
  const assignedCatalogProfileColors = useMemo(
    () => buildAssignedCatalogProfileColors(assignedCatalogItemsByGroup),
    [assignedCatalogItemsByGroup],
  );
  const previewDisplayState = useMemo(
    () => buildDxfPreviewDisplayState(previewResult?.preview ?? null, previewRotationDeg),
    [previewResult?.preview, previewRotationDeg],
  );

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
    setGroupDisplayColors({});
    setActiveTab('model');
    setPreviewRotationDeg(ZERO_DXF_PREVIEW_ROTATION);
    setAssignedCatalogItemsByGroup({});
    setIsImporting(false);

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

  async function handleImport() {
    if (!rawPreviewResult?.model || !previewResult || previewResult.preview.errors.length > 0 || !selectedFileName) {
      return;
    }

    setIsImporting(true);

    try {
      const assignedProfileIds = Array.from(
        new Set(
          Object.values(profileAssignments).filter(
            (profileId): profileId is string => typeof profileId === 'string' && profileId.trim().length > 0,
          ),
        ),
      );
      const resolvedProfilesById = new Map(
        (
          await Promise.all(
            assignedProfileIds.map((profileId) =>
              crossSectionsApi.getProfileDetails(profileId, { notifyOnError: false }),
            ),
          )
        ).map((details) => {
          const profile = createProfileFromCatalogDetails(details);
          return [profile.id, profile] as const;
        }),
      );
      const nextModel = applyDxfProfileAssignments(rawPreviewResult.model, profileAssignments, resolvedProfilesById);

      setModel(applyDxfPreviewDisplayStateToModel(nextModel, previewDisplayState));

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
    } catch (error) {
      notifyError({
        title: t('dxf.notifications.errorTitle', { fileName: selectedFileName }),
        details: [
          t('dxf.notifications.profileAssignmentFailed'),
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : t('dxf.notifications.unknownError'),
        ],
      });
    } finally {
      setIsImporting(false);
    }
  }

  function closeDialog() {
    setSelectedFileName(null);
    setDxfText(null);
    setFileReadError(null);
    setIsReadingFile(false);
    setActiveTab('model');
    setPreviewColorMode('diagnostics');
    setPreviewRotationDeg(ZERO_DXF_PREVIEW_ROTATION);
    setProfileAssignments({});
    setGroupDisplayColors({});
    setAssignedCatalogItemsByGroup({});
    setIsImporting(false);
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
    && unassignedProfileCount === 0
    && !isImporting;
  const canOpenLogs = previewResult != null;

  return (
    <>
      <Dialog
        open={open}
        onClose={closeDialog}
        fullWidth
        maxWidth="xl"
        fullScreen={fullScreen}
        slotProps={{
          paper: {
            sx: {
              height: fullScreen ? '100%' : 'min(88vh, 980px)',
            },
          },
        }}
      >
        <DialogTitle>
          <Stack spacing={0.5}>
            <Typography variant="h6">{t('dxf.dialog.title')}</Typography>
            {selectedFileName ? (
              <Typography variant="body2" color="text.secondary">
                {selectedFileName}
              </Typography>
            ) : null}
          </Stack>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            px: 0,
            py: 0,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".dxf"
            style={{ display: 'none' }}
            onChange={(event) => {
              void handleFileChange(event);
            }}
          />

          <Tabs
            value={activeTab}
            onChange={(_event, value: DxfDialogTab) => setActiveTab(value)}
            variant={fullScreen ? 'fullWidth' : 'standard'}
            sx={{
              px: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Tab label={t('dxf.dialog.tabModel')} value="model" />
            <Tab label={t('dxf.dialog.tabProfiles')} value="profiles" />
            <Tab label={t('dxf.dialog.tabLogs')} value="logs" />
          </Tabs>

          <Box
            sx={{
              flex: '1 1 auto',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <DxfDialogTabPanel activeTab={activeTab} tab="model" scrollMode="hidden">
              <Stack spacing={1.5} sx={{ height: '100%', minHeight: 0 }}>
                <DxfImportPreviewPanel
                  fileName={selectedFileName}
                  preview={previewResult?.preview ?? null}
                  isBusy={isReadingFile}
                  compact
                />

                <Box sx={{ flex: '1 1 auto', minHeight: 0 }}>
                  <DxfPreviewScene
                    preview={previewResult?.preview ?? null}
                    displayState={previewDisplayState}
                    colorMode={previewColorMode}
                    onColorModeChange={setPreviewColorMode}
                    rotationDeg={previewRotationDeg}
                    onRotationChange={setPreviewRotationDeg}
                    onResetRotation={() => setPreviewRotationDeg(ZERO_DXF_PREVIEW_ROTATION)}
                    isBusy={isReadingFile}
                    fullHeight
                    hideTitle
                    groupDisplayColors={groupDisplayColors}
                    assignedCatalogProfileColors={assignedCatalogProfileColors}
                  />
                </Box>
              </Stack>
            </DxfDialogTabPanel>

            <DxfDialogTabPanel activeTab={activeTab} tab="profiles" scrollMode="auto">
              <DxfProfileAssignmentPanel
                key={selectedFileName ?? 'dxf-profile-assignment'}
                groups={previewResult?.preview.colorGroups ?? []}
                assignments={profileAssignments}
                onAssignmentsChange={setProfileAssignments}
                groupDisplayColors={groupDisplayColors}
                onGroupDisplayColorsChange={setGroupDisplayColors}
                onAssignedCatalogItemsChange={setAssignedCatalogItemsByGroup}
                hideHeader
              />
            </DxfDialogTabPanel>

            <DxfDialogTabPanel activeTab={activeTab} tab="logs" scrollMode="auto">
              <DxfImportLogSectionsPanel
                fileName={selectedFileName}
                previewResult={previewResult}
                settings={dxfImportSettings}
                previewDisplayState={previewDisplayState}
                assignedCatalogItemsByGroup={assignedCatalogItemsByGroup}
              />
            </DxfDialogTabPanel>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Stack direction="row" spacing={1}>
            <ActionIconButton
              title={selectedFileName ? t('dxf.dialog.replaceFile') : t('dxf.dialog.chooseFile')}
              label={selectedFileName ? t('dxf.dialog.replaceFile') : t('dxf.dialog.chooseFile')}
              onClick={openFilePicker}
              disabled={isReadingFile || isImporting}
            >
              <UploadFileIcon />
            </ActionIconButton>

            <ActionIconButton
              title={t('dxf.dialog.openLogs')}
              label={t('dxf.dialog.openLogs')}
              onClick={() => setActiveTab('logs')}
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
              onClick={() => {
                void handleImport();
              }}
              disabled={!canImport}
            >
              <CheckIcon />
            </ActionIconButton>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}

function DxfDialogTabPanel({
  activeTab,
  tab,
  scrollMode,
  children,
}: {
  activeTab: DxfDialogTab;
  tab: DxfDialogTab;
  scrollMode: 'auto' | 'hidden';
  children: ReactNode;
}) {
  const isActive = activeTab === tab;

  return (
    <Box
      role="tabpanel"
      hidden={!isActive}
      sx={{
        display: isActive ? 'flex' : 'none',
        flex: '1 1 auto',
        minHeight: 0,
        overflow: scrollMode,
        p: 2,
      }}
    >
      <Box sx={{ flex: '1 1 auto', minHeight: 0, width: '100%' }}>
        {children}
      </Box>
    </Box>
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
