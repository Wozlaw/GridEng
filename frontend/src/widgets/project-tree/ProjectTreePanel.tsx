import type { ReactNode } from 'react';
import { useState } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  List,
  ListItemButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import { getLoadUnits, type Load, type Member, type Node, type Profile, type UnitSystem } from '../../entities/model';
import { useModelStore } from '../../app/store';
import { isSelectedEntity, isSelectedLoad } from '../../features/selection';
import { useI18n } from '../../shared/i18n';
import { formatNumber, formatOptionalText } from '../../shared/utils';

type ProjectTreeSectionKey = 'loads' | 'members' | 'nodes';

export function ProjectTreePanel() {
  const { t } = useI18n();
  const model = useModelStore((state) => state.model);
  const selectedEntity = useModelStore((state) => state.selectedEntity);
  const selectEntity = useModelStore((state) => state.selectEntity);
  const selectLoad = useModelStore((state) => state.selectLoad);
  const [expandedSections, setExpandedSections] = useState<Record<ProjectTreeSectionKey, boolean>>({
    loads: true,
    members: true,
    nodes: true,
  });

  const totalLoads = model.loadCases.reduce((sum, loadCase) => sum + loadCase.loads.length, 0);
  const profilesById = new Map(model.profiles.map((profile) => [profile.id, profile] as const));
  const nodesById = new Map(model.nodes.map((node) => [node.id, node] as const));

  function toggleSection(section: ProjectTreeSectionKey) {
    setExpandedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  return (
    <Paper
      component="aside"
      variant="outlined"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" align="center">
          {t('projectTree.panelTitle')}
        </Typography>
      </Box>

      <Stack sx={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
        <ProjectAccordionSection
          expanded={expandedSections.loads}
          title={t('projectTree.section.loads')}
          count={totalLoads}
          onToggle={() => toggleSection('loads')}
        >
          <List disablePadding dense>
            {model.loadCases.map((loadCase) => (
              <Box key={loadCase.id} sx={{ pb: 0.5 }}>
                <ListItemButton
                  selected={isSelectedEntity(selectedEntity, 'loadCase', loadCase.id)}
                  onClick={() => selectEntity({ type: 'loadCase', id: loadCase.id })}
                  sx={{ px: 1.5 }}
                >
                  <Stack spacing={0.15} sx={{ minWidth: 0 }}>
                    <Typography variant="body2">{loadCase.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('projectTree.loadCase.loadsCount', { count: loadCase.loads.length })}
                    </Typography>
                  </Stack>
                </ListItemButton>

                {loadCase.loads.length > 0 && (
                  <List disablePadding dense sx={{ pl: 1.5 }}>
                    {loadCase.loads.map((load) => (
                      <Tooltip
                        key={load.id}
                        title={formatLoadTooltip(load, nodesById, model.members, t)}
                        placement="right"
                      >
                        <ListItemButton
                          selected={isSelectedLoad(selectedEntity, loadCase.id, load.id)}
                          onClick={() => selectLoad(loadCase.id, load.id)}
                          sx={{ px: 1.5 }}
                        >
                          <Stack spacing={0.15} sx={{ minWidth: 0 }}>
                            <Typography variant="body2" noWrap>
                              {load.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {formatLoadSummary(load, model.units, t)}
                            </Typography>
                          </Stack>
                        </ListItemButton>
                      </Tooltip>
                    ))}
                  </List>
                )}
              </Box>
            ))}
          </List>
        </ProjectAccordionSection>

        <ProjectAccordionSection
          expanded={expandedSections.members}
          title={t('projectTree.section.members')}
          count={model.members.length}
          onToggle={() => toggleSection('members')}
        >
          <List disablePadding dense>
            {model.members.map((member, index) => {
              const profile = profilesById.get(member.profileId);

              return (
                <Tooltip
                  key={member.id}
                  title={formatMemberTooltip(member, nodesById, t)}
                  placement="right"
                >
                  <ListItemButton
                    selected={isSelectedEntity(selectedEntity, 'member', member.id)}
                    onClick={() => selectEntity({ type: 'member', id: member.id })}
                    sx={{ px: 1.5 }}
                  >
                    <Stack direction="row" spacing={1} sx={{ minWidth: 0, alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          flexShrink: 0,
                          bgcolor: profile?.color ?? 'profile.main',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      />
                      <Typography variant="body2" noWrap>
                        {formatMemberPrimaryText(member, index, profile)}
                      </Typography>
                    </Stack>
                  </ListItemButton>
                </Tooltip>
              );
            })}
          </List>
        </ProjectAccordionSection>

        <ProjectAccordionSection
          expanded={expandedSections.nodes}
          title={t('projectTree.section.nodes')}
          count={model.nodes.length}
          onToggle={() => toggleSection('nodes')}
        >
          <List disablePadding dense>
            {model.nodes.map((node, index) => (
              <Tooltip
                key={node.id}
                title={node.id}
                placement="right"
              >
                <ListItemButton
                  selected={isSelectedEntity(selectedEntity, 'node', node.id)}
                  onClick={() => selectEntity({ type: 'node', id: node.id })}
                  sx={{ px: 1.5 }}
                >
                  <Typography variant="body2" noWrap>
                    {node.label?.trim() || t('projectTree.nodeFallback', { index: index + 1 })}
                  </Typography>
                </ListItemButton>
              </Tooltip>
            ))}
          </List>
        </ProjectAccordionSection>
      </Stack>
    </Paper>
  );
}

interface ProjectAccordionSectionProps {
  expanded: boolean;
  title: string;
  count: number;
  onToggle: () => void;
  children: ReactNode;
}

function ProjectAccordionSection({
  expanded,
  title,
  count,
  onToggle,
  children,
}: ProjectAccordionSectionProps) {
  return (
    <Accordion
      expanded={expanded}
      onChange={onToggle}
      disableGutters
      elevation={0}
      square
      sx={{
        bgcolor: 'transparent',
        '&::before': {
          display: 'none',
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon fontSize="small" />}
        sx={{
          minHeight: 40,
          px: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          '& .MuiAccordionSummary-content': {
            my: 0.75,
          },
        }}
      >
        <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          <Typography variant="subtitle2">{title}</Typography>
          <Typography variant="caption" color="text.secondary">
            {count}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 0, py: 0.5 }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
}

function formatLoadSummary(
  load: Load,
  units: UnitSystem,
  t: ReturnType<typeof useI18n>['t'],
): string {
  if (load.type === 'nodal_concentrated') {
    const typeLabel = load.kind === 'force'
      ? t('projectTree.loadType.force')
      : t('projectTree.loadType.moment');

    return `${typeLabel} · ${formatNumber(load.magnitude, 2)} ${getLoadUnits(load, units)}`;
  }

  if (load.distribution.type === 'linear') {
    return `${t('projectTree.loadType.distributed')} · ${formatNumber(load.distribution.qStart, 2)}…${formatNumber(load.distribution.qEnd, 2)} ${getLoadUnits(load, units)}`;
  }

  return t('projectTree.loadType.distributed');
}

function formatLoadTooltip(
  load: Load,
  nodesById: Map<string, Node>,
  members: Member[],
  t: ReturnType<typeof useI18n>['t'],
): string {
  if (load.type === 'nodal_concentrated') {
    const node = nodesById.get(load.target.nodeId);

    return `${load.name} · ${node?.label?.trim() || load.target.nodeId}`;
  }

  const memberIndex = members.findIndex((member) => member.id === load.target.memberId);
  const member = memberIndex >= 0 ? members[memberIndex] : undefined;
  const memberLabel = member?.label?.trim() || t('projectTree.memberFallback', { index: memberIndex + 1 || '?' });

  return `${load.name} · ${memberLabel}`;
}

function formatMemberPrimaryText(
  member: Member,
  index: number,
  profile: Profile | undefined,
): string {
  const displayLabel = member.label?.trim() || `M-${index + 1}`;
  return `${displayLabel} — ${profile?.name ?? formatOptionalText(member.profileId)}`;
}

function formatMemberTooltip(
  member: Member,
  nodesById: Map<string, Node>,
  t: ReturnType<typeof useI18n>['t'],
): string {
  const startNode = nodesById.get(member.startNodeId);
  const endNode = nodesById.get(member.endNodeId);
  const startLabel = startNode?.label?.trim() || member.startNodeId;
  const endLabel = endNode?.label?.trim() || member.endNodeId;

  return t('projectTree.memberTooltip', {
    start: startLabel,
    end: endLabel,
    id: member.id,
  });
}
