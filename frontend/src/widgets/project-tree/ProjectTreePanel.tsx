import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  List,
  ListItemButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { type Load, type Member, type Node, type Profile } from '../../entities/model';
import { useModelStore } from '../../app/store';
import { isSelectedEntity, isSelectedLoad } from '../../features/selection';
import { useI18n } from '../../shared/i18n';
import { formatOptionalText } from '../../shared/utils';

type ProjectTreeSectionKey = 'loads' | 'members' | 'nodes';

export function ProjectTreePanel() {
  const { t } = useI18n();
  const model = useModelStore((state) => state.model);
  const selectedEntity = useModelStore((state) => state.selectedEntity);
  const selectEntity = useModelStore((state) => state.selectEntity);
  const selectLoad = useModelStore((state) => state.selectLoad);
  const activeLoadCaseId = useModelStore((state) => state.activeLoadCaseId);
  const setActiveLoadCaseId = useModelStore((state) => state.setActiveLoadCaseId);
  const [expandedSections, setExpandedSections] = useState<Record<ProjectTreeSectionKey, boolean>>({
    loads: true,
    members: true,
    nodes: true,
  });

  const activeLoadCase = useMemo(
    () => model.loadCases.find((loadCase) => loadCase.id === activeLoadCaseId) ?? model.loadCases[0],
    [activeLoadCaseId, model.loadCases],
  );
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
        width: '100%',
        minHeight: 0,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.25,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography
          variant="subtitle2"
          align="center"
          color="text.secondary"
          sx={{ fontWeight: 600, letterSpacing: '0.03em' }}
        >
          {t('projectTree.panelTitle')}
        </Typography>
      </Box>

      <Stack
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          overscrollBehaviorY: 'contain',
          scrollbarGutter: 'stable',
        }}
      >
        <ProjectAccordionSection
          expanded={expandedSections.loads}
          title={t('projectTree.section.loads')}
          count={activeLoadCase?.loads.length ?? 0}
          onToggle={() => toggleSection('loads')}
        >
          {model.loadCases.length === 0 ? (
            <Box sx={{ px: 1.5, py: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t('projectTree.messages.noLoadCases')}
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ px: 1.5, py: 1 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label={t('projectTree.loadCase.selectLabel')}
                  value={activeLoadCase?.id ?? ''}
                  onChange={(event) => {
                    setActiveLoadCaseId(event.target.value);
                  }}
                >
                  {model.loadCases.map((loadCase) => (
                    <MenuItem key={loadCase.id} value={loadCase.id}>
                      {loadCase.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {activeLoadCase != null && (
                <ListItemButton
                  selected={isSelectedEntity(selectedEntity, 'loadCase', activeLoadCase.id)}
                  onClick={() => selectEntity({ type: 'loadCase', id: activeLoadCase.id })}
                  sx={{ px: 1.5, mx: 0.75, borderRadius: 1 }}
                >
                  <Stack spacing={0.15} sx={{ minWidth: 0 }}>
                    <Typography variant="body2">{activeLoadCase.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('projectTree.loadCase.loadsCount', { count: activeLoadCase.loads.length })}
                    </Typography>
                  </Stack>
                </ListItemButton>
              )}

              {activeLoadCase != null && activeLoadCase.loads.length > 0 && (
                <List disablePadding dense sx={{ pl: 1.5, pr: 0.75, pb: 0.5 }}>
                  {activeLoadCase.loads.map((load) => (
                    <Tooltip
                      key={load.id}
                      title={formatLoadTooltip(load, nodesById, model.members, t)}
                      placement="right"
                    >
                      <ListItemButton
                        selected={isSelectedLoad(selectedEntity, activeLoadCase.id, load.id)}
                        onClick={() => selectLoad(activeLoadCase.id, load.id)}
                        sx={{ px: 1.5 }}
                      >
                        <Typography variant="body2" noWrap>
                          {formatLoadPrimaryText(load, t)}
                        </Typography>
                      </ListItemButton>
                    </Tooltip>
                  ))}
                </List>
              )}
            </>
          )}
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
          minHeight: 36,
          px: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          '& .MuiAccordionSummary-content': {
            my: 0.5,
          },
        }}
      >
        <Box
          sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
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

function formatLoadPrimaryText(
  load: Load,
  t: ReturnType<typeof useI18n>['t'],
): string {
  const loadName = load.name.trim();
  if (loadName.length > 0) {
    return loadName;
  }

  if (load.type === 'nodal_concentrated') {
    return load.kind === 'force'
      ? t('projectTree.loadType.force')
      : t('projectTree.loadType.moment');
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
