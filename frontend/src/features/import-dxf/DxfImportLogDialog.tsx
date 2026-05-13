import type { ReactNode } from 'react';

import {
  Alert,
  AlertTitle,
  Box,
  Chip,
  Stack,
  Typography,
} from '@mui/material';

import { findProfileById } from '../../entities/section';
import { useI18n } from '../../shared/i18n';
import { ImportLogDialog, type ImportLogDialogSection } from '../../shared/ui';
import { formatNumber, formatOptionalText } from '../../shared/utils/format';
import type {
  DxfImportSettings,
  DxfPreviewDiagnostic,
  DxfToGridEngModelResult,
} from './types';

interface DxfImportLogDialogProps {
  open: boolean;
  fileName: string | null;
  previewResult: DxfToGridEngModelResult | null;
  settings: DxfImportSettings;
  onClose: () => void;
}

export function DxfImportLogDialog({
  open,
  fileName,
  previewResult,
  settings,
  onClose,
}: DxfImportLogDialogProps) {
  const { t } = useI18n();
  const preview = previewResult?.preview ?? null;
  const sourceMetadata = previewResult?.model?.importMeta?.dxf;

  const sections: ImportLogDialogSection[] = [];

  if (preview != null) {
    sections.push({
      id: 'summary',
      title: t('dxf.logs.section.summary'),
      content: (
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
            <Chip
              color={preview.errors.length > 0 ? 'error' : preview.warnings.length > 0 ? 'warning' : 'success'}
              label={preview.errors.length > 0
                ? t('dxf.preview.errorsPresent')
                : preview.warnings.length > 0
                  ? t('dxf.preview.warningsOnly')
                  : t('dxf.preview.readyToImport')}
              size="small"
              variant="outlined"
            />
            <Chip
              label={preview.is3D ? t('dxf.preview.dimension3d') : t('dxf.preview.dimension2d')}
              size="small"
              variant="outlined"
            />
          </Stack>

          <LogGrid>
            <LogRow label={t('common.name')} value={formatOptionalText(fileName)} />
            <LogRow label={t('dxf.preview.lineEntities')} value={String(preview.linesCount)} />
            <LogRow label={t('dxf.preview.nodes')} value={String(preview.nodesCount)} />
            <LogRow label={t('dxf.preview.members')} value={String(preview.membersCount)} />
            <LogRow label={t('dxf.preview.ignoredEntities')} value={String(preview.ignoredEntitiesCount)} />
            <LogRow label={t('dxf.preview.mergedNodes')} value={String(preview.mergedNodesCount)} />
            <LogRow label={t('dxf.preview.danglingMembers')} value={String(preview.danglingMembersCount)} />
            <LogRow
              label={t('dxf.preview.zRange')}
              value={preview.zRange
                ? `${formatNumber(preview.zRange.min, 2)} .. ${formatNumber(preview.zRange.max, 2)} mm`
                : '-'}
            />
          </LogGrid>
        </Stack>
      ),
    });

    sections.push({
      id: 'settings',
      title: t('dxf.logs.section.settings'),
      content: (
        <LogGrid>
          <LogRow label={t('dxf.dialog.tolerance')} value={`${formatNumber(settings.toleranceMm, 3)} mm`} />
          <LogRow label={t('dxf.dialog.centerOnXY')} value={settings.centerOnXY ? t('common.enabled') : t('common.disabled')} />
          <LogRow label={t('dxf.dialog.force2DToXY')} value={settings.force2DToXY ? t('common.enabled') : t('common.disabled')} />
        </LogGrid>
      ),
    });

    if (preview.errors.length > 0) {
      sections.push({
        id: 'errors',
        title: t('dxf.preview.importErrors'),
        content: (
          <Alert severity="error" variant="outlined">
            <AlertTitle>{t('dxf.preview.importErrors')}</AlertTitle>
            <Stack spacing={0.5}>
              {preview.errors.map((error) => (
                <Typography key={error} variant="body2">
                  {error}
                </Typography>
              ))}
            </Stack>
          </Alert>
        ),
      });
    }

    if (preview.warnings.length > 0) {
      sections.push({
        id: 'warnings',
        title: t('dxf.preview.importWarnings'),
        content: (
          <Alert severity="warning" variant="outlined">
            <AlertTitle>{t('dxf.preview.importWarnings')}</AlertTitle>
            <Stack spacing={0.5}>
              {preview.warnings.map((warning) => (
                <Typography key={warning} variant="body2">
                  {warning}
                </Typography>
              ))}
            </Stack>
          </Alert>
        ),
      });
    }

    if (preview.colorGroups.length > 0) {
      sections.push({
        id: 'groups',
        title: t('dxf.logs.section.colorGroups'),
        content: (
          <Stack spacing={1}>
            {preview.colorGroups.map((group) => (
              <LogGrid key={group.key}>
                <LogRow label={t('common.group')} value={group.key} />
                <LogRow label={t('common.members')} value={String(group.membersCount)} />
                <LogRow label={t('common.layer')} value={formatOptionalText(group.layer)} />
                <LogRow label={t('common.profile')} value={formatProfileValue(group.profileId)} />
              </LogGrid>
            ))}
          </Stack>
        ),
      });
    }

    const hasStructuredDiagnostics = preview.diagnostics.summary.length > 0
      || preview.diagnostics.lines.some((entry) => entry.status !== 'ok')
      || preview.diagnostics.members.some((entry) => entry.status !== 'ok')
      || preview.diagnostics.nodes.some((entry) => entry.status !== 'ok')
      || preview.diagnostics.groups.some((entry) => entry.status !== 'ok');

    if (hasStructuredDiagnostics) {
      sections.push({
        id: 'diagnostics',
        title: t('dxf.logs.section.diagnostics'),
        content: (
          <Stack spacing={1.5}>
            {preview.diagnostics.summary.length > 0 ? (
              <DiagnosticListSection
                title={t('dxf.logs.diagnostics.summary')}
                items={preview.diagnostics.summary.map((diagnostic) => ({
                  key: `${diagnostic.code}-${diagnostic.message}`,
                  title: diagnostic.code,
                  status: diagnostic.status,
                  diagnostics: [diagnostic],
                }))}
              />
            ) : null}

            <DiagnosticListSection
              title={t('dxf.logs.diagnostics.lines')}
              items={preview.diagnostics.lines
                .filter((entry) => entry.status !== 'ok')
                .map((entry) => ({
                  key: `line-${entry.lineIndex}`,
                  title: `LINE #${entry.lineIndex}${entry.handle ? ` / ${entry.handle}` : ''}`,
                  status: entry.status,
                  diagnostics: entry.diagnostics,
                  meta: [entry.layer ? `layer: ${entry.layer}` : null, entry.groupKey ? `group: ${entry.groupKey}` : null].filter(Boolean) as string[],
                }))}
            />

            <DiagnosticListSection
              title={t('dxf.logs.diagnostics.members')}
              items={preview.diagnostics.members
                .filter((entry) => entry.status !== 'ok')
                .map((entry) => ({
                  key: entry.memberId,
                  title: `${entry.memberId}${entry.handle ? ` / ${entry.handle}` : ''}`,
                  status: entry.status,
                  diagnostics: entry.diagnostics,
                  meta: [
                    `group: ${entry.groupKey}`,
                    `nodes: ${entry.startNodeId} -> ${entry.endNodeId}`,
                    entry.layer ? `layer: ${entry.layer}` : null,
                  ].filter(Boolean) as string[],
                }))}
            />

            <DiagnosticListSection
              title={t('dxf.logs.diagnostics.nodes')}
              items={preview.diagnostics.nodes
                .filter((entry) => entry.status !== 'ok')
                .map((entry) => ({
                  key: entry.nodeId,
                  title: entry.nodeId,
                  status: entry.status,
                  diagnostics: entry.diagnostics,
                }))}
            />

            <DiagnosticListSection
              title={t('dxf.logs.diagnostics.groups')}
              items={preview.diagnostics.groups
                .filter((entry) => entry.status !== 'ok')
                .map((entry) => ({
                  key: entry.groupKey,
                  title: entry.groupKey,
                  status: entry.status,
                  diagnostics: entry.diagnostics,
                  meta: [
                    `profile: ${formatOptionalText(entry.profileId)}`,
                    entry.layer ? `layer: ${entry.layer}` : null,
                    `members: ${entry.memberIds.length}`,
                  ].filter(Boolean) as string[],
                }))}
            />
          </Stack>
        ),
      });
    }
  }

  if (sourceMetadata != null) {
    sections.push({
      id: 'sourceMetadata',
      title: t('dxf.logs.section.sourceMetadata'),
      content: (
        <Box
          component="pre"
          sx={{
            m: 0,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'monospace',
            fontSize: 12,
            color: 'text.secondary',
          }}
        >
          {JSON.stringify(sourceMetadata, null, 2)}
        </Box>
      ),
    });
  }

  return (
    <ImportLogDialog
      open={open}
      title={t('dxf.logs.title')}
      subtitle={fileName}
      sections={sections}
      emptyState={(
        <Typography variant="body2" color="text.secondary">
          {t('dxf.logs.empty')}
        </Typography>
      )}
      closeLabel={t('common.cancel')}
      onClose={onClose}
    />
  );
}

function formatProfileValue(profileId: string | undefined): string {
  if (profileId == null) {
    return '-';
  }

  const catalogProfile = findProfileById(profileId);
  return catalogProfile == null ? profileId : `${catalogProfile.name} (${catalogProfile.id})`;
}

function LogGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 220px) minmax(0, 1fr)' },
        gap: 1,
      }}
    >
      {children}
    </Box>
  );
}

function LogRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </>
  );
}

interface DiagnosticListItem {
  key: string;
  title: string;
  status: 'ok' | 'warning' | 'error';
  diagnostics: DxfPreviewDiagnostic[];
  meta?: string[];
}

function DiagnosticListSection({
  title,
  items,
}: {
  title: string;
  items: DiagnosticListItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Stack spacing={1}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>

      {items.map((item) => (
        <Box
          key={item.key}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1.25,
          }}
        >
          <Stack spacing={0.75}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }} useFlexGap>
              <Chip
                color={item.status === 'error' ? 'error' : item.status === 'warning' ? 'warning' : 'success'}
                label={item.status}
                size="small"
                variant="outlined"
              />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {item.title}
              </Typography>
            </Stack>

            {item.meta?.length ? (
              <Typography variant="caption" color="text.secondary">
                {item.meta.join(' / ')}
              </Typography>
            ) : null}

            <Stack spacing={0.5}>
              {item.diagnostics.map((diagnostic) => (
                <Typography key={`${item.key}-${diagnostic.code}-${diagnostic.message}`} variant="body2">
                  {diagnostic.message} ({diagnostic.code})
                </Typography>
              ))}
            </Stack>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
