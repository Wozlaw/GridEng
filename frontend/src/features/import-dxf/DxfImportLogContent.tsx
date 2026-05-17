import type { ReactNode } from 'react';
import { useMemo } from 'react';

import {
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import { findProfileById, type CrossSectionCatalogItem } from '../../entities/section';
import { useI18n } from '../../shared/i18n';
import { formatNumber, formatOptionalText } from '../../shared/utils/format';
import type {
  DxfColorGroup,
  DxfImportSettings,
  DxfPreviewDiagnostic,
  DxfPreviewDiagnosticStatus,
  DxfToGridEngModelResult,
} from './types';
import type { DxfPreviewDisplayState } from './previewTransform';

interface DxfImportLogSectionsPanelProps {
  fileName: string | null;
  previewResult: DxfToGridEngModelResult | null;
  settings: DxfImportSettings;
  previewDisplayState?: DxfPreviewDisplayState | null;
  assignedCatalogItemsByGroup?: Partial<Record<string, CrossSectionCatalogItem>>;
}

interface LogItem {
  key: string;
  title: string;
  status: 'info' | 'warning' | 'error';
  messages: string[];
  context?: string[];
  color?: string;
}

export function DxfImportLogSectionsPanel({
  fileName,
  previewResult,
  settings,
  previewDisplayState = null,
  assignedCatalogItemsByGroup = {},
}: DxfImportLogSectionsPanelProps) {
  const { t } = useI18n();
  const preview = previewResult?.preview ?? null;

  const mappingItems = useMemo<LogItem[]>(() => {
    if (preview == null || preview.colorGroups.length === 0) {
      return [];
    }

    const groupDiagnosticsByKey = new Map(
      preview.diagnostics.groups.map((entry) => [entry.groupKey, entry] as const),
    );

    return preview.colorGroups.map((group) => {
      const diagnosticEntry = groupDiagnosticsByKey.get(group.key);
      const messages = uniqueMessages([
        ...collectDiagnosticMessages(diagnosticEntry?.diagnostics),
      ]);
      const status = diagnosticEntry == null
        ? group.profileId == null ? 'warning' : 'info'
        : toLogStatus(diagnosticEntry.status);
      const context = [
        `${t('dxf.logs.originalColor')}: ${resolveGroupDisplayColor(group)}`,
        group.layer ? `${t('common.layer')}: ${group.layer}` : null,
        `${t('common.members')}: ${group.membersCount}`,
        `${t('dxf.logs.assignedProfile')}: ${formatProfileValue(
          group.profileId,
          assignedCatalogItemsByGroup[group.key],
        )}`,
      ].filter(Boolean) as string[];

      return {
        key: `group-${group.key}`,
        title: t('dxf.logs.item.group', { id: group.key }),
        status,
        messages,
        context,
        color: resolveGroupDisplayColor(group),
      };
    });
  }, [assignedCatalogItemsByGroup, preview, t]);

  const issueItems = useMemo<LogItem[]>(() => {
    if (preview == null) {
      return [];
    }

    const items: LogItem[] = [];

    for (const error of preview.errors) {
      items.push({
        key: `error-${error}`,
        title: t('dxf.logs.item.import'),
        status: 'error',
        messages: [error],
      });
    }

    for (const warning of preview.warnings) {
      items.push({
        key: `warning-${warning}`,
        title: t('dxf.logs.item.import'),
        status: 'warning',
        messages: [warning],
      });
    }

    for (const diagnostic of preview.diagnostics.summary) {
      items.push({
        key: `summary-${diagnostic.code}-${diagnostic.message}`,
        title: t('dxf.logs.item.import'),
        status: toLogStatus(diagnostic.status),
        messages: [diagnostic.message],
      });
    }

    for (const line of preview.diagnostics.lines.filter((entry) => entry.status !== 'ok')) {
      items.push({
        key: `line-${line.lineIndex}`,
        title: `LINE #${line.lineIndex}`,
        status: toLogStatus(line.status),
        messages: collectDiagnosticMessages(line.diagnostics),
        context: [
          line.handle ? `${t('properties.rows.dxfHandle')}: ${line.handle}` : null,
          line.layer ? `${t('common.layer')}: ${line.layer}` : null,
          line.groupKey ? `${t('common.group')}: ${line.groupKey}` : null,
          line.displayColor ? `${t('dxf.logs.originalColor')}: ${line.displayColor}` : null,
        ].filter(Boolean) as string[],
      });
    }

    for (const member of preview.diagnostics.members.filter((entry) => entry.status !== 'ok')) {
      items.push({
        key: `member-${member.memberId}`,
        title: t('dxf.logs.item.member', { id: member.memberId }),
        status: toLogStatus(member.status),
        messages: collectDiagnosticMessages(member.diagnostics),
        context: [
          member.handle ? `${t('properties.rows.dxfHandle')}: ${member.handle}` : null,
          member.layer ? `${t('common.layer')}: ${member.layer}` : null,
          `${t('common.group')}: ${member.groupKey}`,
          `${t('dxf.logs.memberNodes')}: ${member.startNodeId} -> ${member.endNodeId}`,
        ].filter(Boolean) as string[],
      });
    }

    for (const node of preview.diagnostics.nodes.filter((entry) => entry.status !== 'ok')) {
      items.push({
        key: `node-${node.nodeId}`,
        title: t('dxf.logs.item.node', { id: node.nodeId }),
        status: toLogStatus(node.status),
        messages: collectDiagnosticMessages(node.diagnostics),
      });
    }

    return items.sort(compareLogItems);
  }, [preview, t]);

  if (preview == null) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderStyle: 'dashed',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {t('dxf.logs.empty')}
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Paper variant="outlined" sx={{ p: 1.75 }}>
        <Stack spacing={1.25}>
          <Typography variant="subtitle2">{t('dxf.logs.section.summary')}</Typography>

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
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.75 }}>
        <Stack spacing={1.25}>
          <Typography variant="subtitle2">{t('dxf.logs.section.settings')}</Typography>
          <LogGrid>
            <LogRow label={t('dxf.dialog.tolerance')} value={`${formatNumber(settings.toleranceMm, 3)} mm`} />
            <LogRow
              label={t('dxf.dialog.centerOnXY')}
              value={settings.centerOnXY ? t('common.enabled') : t('common.disabled')}
            />
            <LogRow
              label={t('dxf.dialog.force2DToXY')}
              value={settings.force2DToXY ? t('common.enabled') : t('common.disabled')}
            />
            <LogRow
              label={t('dxf.logs.previewRotation')}
              value={previewDisplayState == null
                ? '-'
                : `X ${formatNumber(previewDisplayState.rotationDeg.x, 0)} deg / Y ${formatNumber(previewDisplayState.rotationDeg.y, 0)} deg / Z ${formatNumber(previewDisplayState.rotationDeg.z, 0)} deg`}
            />
            <LogRow
              label={t('dxf.logs.previewNormalization')}
              value={previewDisplayState == null
                ? '-'
                : `dX ${formatNumber(previewDisplayState.normalizationShiftMm.x, 2)} mm / dY ${formatNumber(previewDisplayState.normalizationShiftMm.y, 2)} mm / dZ ${formatNumber(previewDisplayState.normalizationShiftMm.z, 2)} mm`}
            />
          </LogGrid>
        </Stack>
      </Paper>

      {mappingItems.length > 0 ? (
        <Paper variant="outlined" sx={{ p: 1.75 }}>
          <Stack spacing={1.25}>
            <Typography variant="subtitle2">{t('dxf.logs.section.mapping')}</Typography>
            <Stack spacing={1}>
              {mappingItems.map((item) => (
                <LogCard key={item.key} item={item} />
              ))}
            </Stack>
          </Stack>
        </Paper>
      ) : null}

      <Paper variant="outlined" sx={{ p: 1.75 }}>
        <Stack spacing={1.25}>
          <Typography variant="subtitle2">{t('dxf.logs.section.issues')}</Typography>
          {issueItems.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t('dxf.logs.noIssues')}
            </Typography>
          ) : (
            <Stack spacing={1}>
              {issueItems.map((item) => (
                <LogCard key={item.key} item={item} />
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}

function formatProfileValue(
  profileId: string | undefined,
  assignedCatalogItem: CrossSectionCatalogItem | undefined,
): string {
  if (profileId == null) {
    return '-';
  }

  if (assignedCatalogItem != null) {
    return `${assignedCatalogItem.displayName} (${assignedCatalogItem.id})`;
  }

  const catalogProfile = findProfileById(profileId);
  return catalogProfile == null ? profileId : `${catalogProfile.name} (${catalogProfile.id})`;
}

function resolveGroupDisplayColor(group: DxfColorGroup): string {
  if (typeof group.trueColor === 'string' && group.trueColor.trim().length > 0) {
    return group.trueColor;
  }

  if (typeof group.color === 'string' && group.color.trim().length > 0) {
    return group.color;
  }

  if (typeof group.trueColor === 'number' && Number.isFinite(group.trueColor)) {
    return `#${Math.max(0, Math.trunc(group.trueColor)).toString(16).padStart(6, '0').slice(-6)}`;
  }

  if (typeof group.color === 'number' && Number.isFinite(group.color)) {
    return `#${Math.max(0, Math.trunc(group.color)).toString(16).padStart(6, '0').slice(-6)}`;
  }

  return '#9aa1a9';
}

function collectDiagnosticMessages(diagnostics: readonly DxfPreviewDiagnostic[] | undefined): string[] {
  return uniqueMessages((diagnostics ?? []).map((diagnostic) => diagnostic.message));
}

function uniqueMessages(messages: readonly string[]): string[] {
  return Array.from(new Set(messages.filter((message) => message.trim().length > 0)));
}

function toLogStatus(status: DxfPreviewDiagnosticStatus): 'info' | 'warning' | 'error' {
  switch (status) {
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    default:
      return 'info';
  }
}

function compareLogItems(left: LogItem, right: LogItem): number {
  return getLogStatusRank(right.status) - getLogStatusRank(left.status)
    || left.title.localeCompare(right.title)
    || left.key.localeCompare(right.key);
}

function getLogStatusRank(status: LogItem['status']): number {
  switch (status) {
    case 'error':
      return 2;
    case 'warning':
      return 1;
    default:
      return 0;
  }
}

function LogGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 220px) minmax(0, 1fr)' },
        gap: 0.75,
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

function LogCard({ item }: { item: LogItem }) {
  const { t } = useI18n();

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.25,
        p: 1.25,
      }}
    >
      <Stack spacing={0.75}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }} useFlexGap>
          <Chip
            color={item.status === 'error' ? 'error' : item.status === 'warning' ? 'warning' : 'default'}
            label={item.status === 'error'
              ? t('dxf.logs.status.error')
              : item.status === 'warning'
                ? t('dxf.logs.status.warning')
                : t('dxf.logs.status.info')}
            size="small"
            variant="outlined"
          />
          {item.color ? <ColorSwatch color={item.color} /> : null}
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {item.title}
          </Typography>
        </Stack>

        {item.context?.length ? (
          <Typography variant="caption" color="text.secondary">
            {item.context.join(' / ')}
          </Typography>
        ) : null}

        {item.messages.length ? (
          <Stack spacing={0.25}>
            {item.messages.map((message) => (
              <Typography key={`${item.key}-${message}`} variant="body2">
                {message}
              </Typography>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}

function ColorSwatch({ color }: { color: string }) {
  return (
    <Box
      sx={{
        width: 14,
        height: 14,
        borderRadius: 0.5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: color,
        flexShrink: 0,
      }}
    />
  );
}
