import type { ReactNode } from 'react';
import { useMemo } from 'react';

import {
  Box,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import type { SteelMaterialResolvedProperties } from '../../entities/material';
import { findProfileById, type CrossSectionCatalogItem } from '../../entities/section';
import { useI18n } from '../../shared/i18n';
import { formatNumber, formatOptionalText } from '../../shared/utils/format';
import { getDxfPreviewOverallStatus } from './diagnostics';
import { resolveDxfGroupDisplayColor } from './dxfColors';
import type {
  DxfImportSettings,
  DxfMaterialAssignments,
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
  materialAssignments?: DxfMaterialAssignments;
  assignedMaterialOptionsByGroup?: Partial<Record<string, SteelMaterialResolvedProperties>>;
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
  materialAssignments = {},
  assignedMaterialOptionsByGroup = {},
}: DxfImportLogSectionsPanelProps) {
  const { t } = useI18n();
  const preview = previewResult?.preview ?? null;
  const overallStatus = preview == null
    ? 'info'
    : toLogStatus(getDxfPreviewOverallStatus(preview, { includeGroupDiagnostics: true }));

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
        ? group.profileId == null || materialAssignments[group.key] == null ? 'error' : 'info'
        : toLogStatus(diagnosticEntry.status);
      const context = [
        `${t('dxf.logs.originalColor')}: ${resolveDxfGroupDisplayColor(group)}`,
        group.layer ? `${t('common.layer')}: ${group.layer}` : null,
        `${t('common.members')}: ${group.membersCount}`,
        `${t('dxf.logs.assignedProfile')}: ${formatProfileValue(
          group.profileId,
          assignedCatalogItemsByGroup[group.key],
        )}`,
        `${t('dxf.logs.assignedMaterial')}: ${formatMaterialValue(
          materialAssignments[group.key],
          assignedMaterialOptionsByGroup[group.key],
        )}`,
      ].filter(Boolean) as string[];

      return {
        key: `group-${group.key}`,
        title: t('dxf.logs.item.group', { id: group.key }),
        status,
        messages,
        context,
        color: resolveDxfGroupDisplayColor(group),
      };
    });
  }, [assignedCatalogItemsByGroup, assignedMaterialOptionsByGroup, materialAssignments, preview, t]);

  const issueItems = useMemo<LogItem[]>(() => {
    if (preview == null) {
      return [];
    }

    const items: LogItem[] = [];

    for (const diagnostic of preview.diagnostics.summary) {
      items.push({
        key: `summary-${diagnostic.code}-${diagnostic.message}`,
        title: t('dxf.logs.item.import'),
        status: toLogStatus(diagnostic.status),
        messages: [diagnostic.message],
      });
    }

    for (const line of preview.diagnostics.lines.filter((entry) => entry.diagnostics.length > 0)) {
      items.push({
        key: line.handle ? `line-${line.handle}` : `line-${line.lineIndex}`,
        title: formatLineTitle(line),
        status: getLogStatusFromDiagnostics(line.diagnostics),
        messages: collectDiagnosticMessages(line.diagnostics),
        context: [
          line.handle ? `${t('properties.rows.dxfHandle')}: ${line.handle}` : null,
          line.layer ? `${t('common.layer')}: ${line.layer}` : null,
          line.groupKey ? `${t('common.group')}: ${line.groupKey}` : null,
          line.displayColor ? `${t('dxf.logs.originalColor')}: ${line.displayColor}` : null,
        ].filter(Boolean) as string[],
      });
    }

    for (const member of preview.diagnostics.members.filter((entry) => entry.diagnostics.length > 0)) {
      items.push({
        key: `member-${member.memberId}`,
        title: t('dxf.logs.item.member', { id: member.memberId }),
        status: getLogStatusFromDiagnostics(member.diagnostics),
        messages: collectDiagnosticMessages(member.diagnostics),
        context: [
          member.handle ? `${t('properties.rows.dxfHandle')}: ${member.handle}` : null,
          member.layer ? `${t('common.layer')}: ${member.layer}` : null,
          `${t('common.group')}: ${member.groupKey}`,
          `${t('dxf.logs.memberNodes')}: ${member.startNodeId} -> ${member.endNodeId}`,
        ].filter(Boolean) as string[],
      });
    }

    for (const node of preview.diagnostics.nodes.filter((entry) => entry.diagnostics.length > 0)) {
      items.push({
        key: `node-${node.nodeId}`,
        title: t('dxf.logs.item.node', { id: node.nodeId }),
        status: getLogStatusFromDiagnostics(node.diagnostics),
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

          <LogGrid>
            <LogRow label={t('common.name')} value={formatOptionalText(fileName)} />
            <LogRow label={t('status.title')} value={formatLogStatusLabel(t, overallStatus)} />
            <LogRow label={t('common.type')} value={preview.is3D ? t('dxf.preview.dimension3d') : t('dxf.preview.dimension2d')} />
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

function formatMaterialValue(
  materialId: string | undefined,
  assignedMaterialOption: SteelMaterialResolvedProperties | undefined,
): string {
  if (materialId == null) {
    return '-';
  }

  if (assignedMaterialOption != null) {
    return `${assignedMaterialOption.displayName} (${assignedMaterialOption.propertyId})`;
  }

  return materialId;
}

function collectDiagnosticMessages(diagnostics: readonly DxfPreviewDiagnostic[] | undefined): string[] {
  return uniqueMessages((diagnostics ?? []).map((diagnostic) => diagnostic.message));
}

function uniqueMessages(messages: readonly string[]): string[] {
  return Array.from(new Set(messages.filter((message) => message.trim().length > 0)));
}

function getLogStatusFromDiagnostics(diagnostics: readonly DxfPreviewDiagnostic[]): LogItem['status'] {
  let status: DxfPreviewDiagnosticStatus = 'ok';

  for (const diagnostic of diagnostics) {
    status = getHigherLogStatus(status, diagnostic.status);
  }

  return toLogStatus(status);
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

function getHigherLogStatus(
  current: DxfPreviewDiagnosticStatus,
  next: DxfPreviewDiagnosticStatus,
): DxfPreviewDiagnosticStatus {
  const rank: Record<DxfPreviewDiagnosticStatus, number> = {
    ok: 0,
    info: 1,
    warning: 2,
    error: 3,
  };

  return rank[next] > rank[current] ? next : current;
}

function formatLogStatusLabel(
  t: ReturnType<typeof useI18n>['t'],
  status: LogItem['status'],
): string {
  switch (status) {
    case 'error':
      return t('dxf.logs.status.error');
    case 'warning':
      return t('dxf.logs.status.warning');
    default:
      return t('dxf.logs.status.info');
  }
}

function formatLineTitle(line: { lineIndex: number; handle?: string }): string {
  return line.handle != null && line.handle.trim().length > 0
    ? `LINE ${line.handle}`
    : `LINE #${line.lineIndex + 1}`;
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
  const statusColor = item.status === 'error'
    ? 'error.main'
    : item.status === 'warning'
      ? 'warning.main'
      : 'text.secondary';

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
          {item.color ? <ColorSwatch color={item.color} /> : null}
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {item.title}
          </Typography>
        </Stack>

        <Typography variant="caption" sx={{ color: statusColor, fontWeight: 600 }}>
          {t('status.title')}: {formatLogStatusLabel(t, item.status)}
        </Typography>

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
