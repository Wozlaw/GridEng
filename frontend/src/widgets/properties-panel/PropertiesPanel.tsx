import { Paper, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';

import type {
  GridEngModel,
  Load,
  Material,
  Member,
  Node,
  Profile,
  Restraint,
  SourceRef,
} from '../../entities/model';
import { useModelStore } from '../../app/store';
import type { SelectedEntity } from '../../features/selection';
import { type I18nKey, type TFunction, useI18n } from '../../shared/i18n';
import {
  LoadCaseSummarySection,
  LoadEditorSection,
  MemberEditorSection,
  ModelSummarySection,
  NodeEditorSection,
  StandaloneMaterialSection,
  StandaloneProfileSection,
  StandaloneRestraintEditorSection,
} from './sections';
import { TechnicalDetailsSection } from './shared';

export function PropertiesPanel() {
  const { t } = useI18n();
  const model = useModelStore((state) => state.model);
  const selectedEntity = useModelStore((state) => state.selectedEntity);
  const selectedNode = useModelStore((state) => state.getSelectedNode());
  const selectedMember = useModelStore((state) => state.getSelectedMember());
  const selectedLoadCase = useModelStore((state) => state.getSelectedLoadCase());
  const activeLoadCaseId = useModelStore((state) => state.activeLoadCaseId);
  const selectedLoad = useModelStore((state) => state.getSelectedLoad());
  const selectedRestraint = useModelStore((state) => state.getSelectedRestraint());
  const selectedRestraintNode = useModelStore((state) => state.getSelectedRestraintNode());
  const validationReport = useModelStore((state) => state.validationReport);
  const activeLoadCase = useMemo(
    () => model.loadCases.find((loadCase) => loadCase.id === activeLoadCaseId) ?? model.loadCases[0],
    [activeLoadCaseId, model.loadCases],
  );

  const selectedProfile = selectedEntity.type === 'profile'
    ? model.profiles.find((profile) => profile.id === selectedEntity.id)
    : undefined;
  const selectedMaterial = selectedEntity.type === 'material'
    ? model.materials.find((material) => material.id === selectedEntity.id)
    : undefined;

  const selectedNodeRestraint = selectedNode
    ? model.restraints.find((restraint) => restraint.nodeId === selectedNode.id)
    : undefined;
  const selectedNodeLoads = selectedNode
    ? (activeLoadCase?.loads ?? [])
      .filter((load) => load.type === 'nodal_concentrated' && load.target.nodeId === selectedNode.id)
      .map((load) => ({ loadCaseName: activeLoadCase?.name ?? '-', load }))
    : [];

  const memberStartNode = selectedMember
    ? model.nodes.find((node) => node.id === selectedMember.startNodeId)
    : undefined;
  const memberEndNode = selectedMember
    ? model.nodes.find((node) => node.id === selectedMember.endNodeId)
    : undefined;
  const memberProfile = selectedMember
    ? model.profiles.find((profile) => profile.id === selectedMember.profileId)
    : undefined;
  const memberMaterial = selectedMember
    ? model.materials.find((material) => material.id === selectedMember.materialId)
    : undefined;
  const selectedMemberDistributedLoads = selectedMember
    ? (activeLoadCase?.loads ?? [])
      .filter((load) => load.type === 'member_distributed' && load.target.memberId === selectedMember.id)
      .map((load) => ({ loadCaseName: activeLoadCase?.name ?? '-', load }))
    : [];

  const headerLabel = getPropertiesHeaderLabel({
    model,
    selectedEntity,
    selectedNode,
    selectedMember,
    selectedLoadCase,
    selectedLoad,
    selectedRestraintNode,
    selectedProfile,
    selectedMaterial,
    t,
  });
  const technicalDetails = buildPropertiesTechnicalDetails({
    selectedEntity,
    selectedNode,
    selectedMember,
    selectedLoadCase,
    selectedLoad,
    selectedRestraint,
    selectedProfile,
    selectedMaterial,
    t,
  });

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
      <Stack
        spacing={0.5}
        sx={{
          px: 2,
          pt: 1.25,
          pb: 1.5,
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
          {t('properties.title')}
        </Typography>
        <Typography
          variant="body1"
          align="center"
          sx={{ fontWeight: 600, lineHeight: 1.25, wordBreak: 'break-word' }}
        >
          {headerLabel}
        </Typography>
      </Stack>

      <Stack
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          overscrollBehaviorY: 'contain',
          scrollbarGutter: 'stable',
          p: 2,
        }}
        spacing={2}
      >
        {selectedEntity.type == null && (
          <ModelSummarySection
            model={model}
            activeLoadCase={activeLoadCase}
            validationReport={validationReport}
          />
        )}

        {selectedNode && (
          <NodeEditorSection
            key={selectedNode.id}
            node={selectedNode}
            restraint={selectedNodeRestraint}
            nodeLoads={selectedNodeLoads}
            units={model.units}
          />
        )}

        {selectedMember && (
          <MemberEditorSection
            key={selectedMember.id}
            member={selectedMember}
            startNode={memberStartNode}
            endNode={memberEndNode}
            profile={memberProfile}
            material={memberMaterial}
            availableProfiles={model.profiles}
            availableMaterials={model.materials}
            memberLoads={selectedMemberDistributedLoads}
            units={model.units}
          />
        )}

        {selectedEntity.type === 'loadCase' && selectedLoadCase && (
          <LoadCaseSummarySection
            loadCase={selectedLoadCase}
            units={model.units}
          />
        )}

        {selectedEntity.type === 'load' && selectedLoad && selectedLoadCase && (
          <LoadEditorSection
            key={`${selectedLoadCase.id}-${selectedLoad.id}`}
            load={selectedLoad}
            loadCaseId={selectedLoadCase.id}
            loadCaseName={selectedLoadCase.name}
            nodes={model.nodes}
            members={model.members}
            units={model.units}
          />
        )}

        {selectedEntity.type === 'restraint' && selectedRestraint && (
          <StandaloneRestraintEditorSection
            key={selectedRestraint.id}
            restraint={selectedRestraint}
            node={selectedRestraintNode}
          />
        )}

        {selectedProfile && (
          <StandaloneProfileSection profile={selectedProfile} />
        )}

        {selectedMaterial && (
          <StandaloneMaterialSection material={selectedMaterial} />
        )}

        <TechnicalDetailsSection
          title={
            technicalDetails.hasSource
              ? `${t('properties.rows.id')} / ${t('properties.rows.source')}`
              : t('properties.rows.id')
          }
          rows={technicalDetails.rows}
        />
      </Stack>
    </Paper>
  );
}

function getPropertiesHeaderLabel({
  model,
  selectedEntity,
  selectedNode,
  selectedMember,
  selectedLoadCase,
  selectedLoad,
  selectedRestraintNode,
  selectedProfile,
  selectedMaterial,
  t,
}: {
  model: GridEngModel;
  selectedEntity: SelectedEntity;
  selectedNode?: Node;
  selectedMember?: Member;
  selectedLoadCase?: GridEngModel['loadCases'][number];
  selectedLoad?: Load;
  selectedRestraintNode?: Node;
  selectedProfile?: Profile;
  selectedMaterial?: Material;
  t: TFunction<I18nKey>;
}): string {
  switch (selectedEntity.type) {
    case null:
      return t('properties.modelSummary');
    case 'node':
      return formatNodeLabel(selectedNode, model.nodes, t);
    case 'member':
      return formatMemberLabel(selectedMember, model.members, t);
    case 'loadCase':
      return selectedLoadCase?.name ?? t('properties.sections.loadCase');
    case 'load':
      return selectedLoad?.name?.trim() || t('entity.load');
    case 'restraint':
      return selectedRestraintNode == null
        ? t('entity.restraint')
        : `${t('entity.restraint')}: ${formatNodeLabel(selectedRestraintNode, model.nodes, t)}`;
    case 'profile':
      return selectedProfile?.name ?? t('entity.profile');
    case 'material':
      return selectedMaterial?.name ?? t('entity.material');
  }
}

function buildPropertiesTechnicalDetails({
  selectedEntity,
  selectedNode,
  selectedMember,
  selectedLoadCase,
  selectedLoad,
  selectedRestraint,
  selectedProfile,
  selectedMaterial,
  t,
}: {
  selectedEntity: SelectedEntity;
  selectedNode?: Node;
  selectedMember?: Member;
  selectedLoadCase?: GridEngModel['loadCases'][number];
  selectedLoad?: Load;
  selectedRestraint?: Restraint;
  selectedProfile?: Profile;
  selectedMaterial?: Material;
  t: TFunction<I18nKey>;
}): { hasSource: boolean; rows: Array<{ label: string; value: string }> } {
  const rows: Array<{ label: string; value: string }> = [];
  let hasSource = false;

  function pushId(value: string | undefined) {
    if (value != null && value.trim().length > 0) {
      rows.push({ label: t('properties.rows.id'), value });
    }
  }

  function pushSource(source: SourceRef | undefined) {
    if (source == null) {
      return;
    }

    hasSource = true;
    rows.push({ label: t('properties.rows.source'), value: source.source });

    if (source.entityType != null) {
      rows.push({ label: t('properties.rows.entityType'), value: source.entityType });
    }

    if (source.layer != null && source.layer.trim().length > 0) {
      rows.push({ label: t('properties.rows.layer'), value: source.layer });
    }

    if (source.color != null) {
      rows.push({ label: t('properties.rows.color'), value: String(source.color) });
    }

    if (source.colorIndex != null) {
      rows.push({ label: t('properties.rows.colorIndex'), value: String(source.colorIndex) });
    }

    if (source.trueColor != null) {
      rows.push({ label: t('properties.rows.trueColor'), value: String(source.trueColor) });
    }

    if (source.handle != null && source.handle.trim().length > 0) {
      rows.push({ label: t('properties.rows.handle'), value: source.handle });
    }
  }

  switch (selectedEntity.type) {
    case 'node':
      pushId(selectedNode?.id);
      pushSource(selectedNode?.source);
      break;
    case 'member':
      pushId(selectedMember?.id);
      pushSource(selectedMember?.source);
      break;
    case 'loadCase':
      pushId(selectedLoadCase?.id);
      break;
    case 'load':
      pushId(selectedLoad?.id);
      break;
    case 'restraint':
      pushId(selectedRestraint?.id);
      if (selectedRestraint?.nodeId != null) {
        rows.push({ label: t('properties.rows.nodeId'), value: selectedRestraint.nodeId });
      }
      break;
    case 'profile':
      pushId(selectedProfile?.id);
      break;
    case 'material':
      pushId(selectedMaterial?.id);
      break;
    case null:
      break;
  }

  return { hasSource, rows };
}

function formatNodeLabel(
  node: Node | undefined,
  nodes: Node[],
  t: TFunction<I18nKey>,
): string {
  if (node == null) {
    return t('entity.node');
  }

  const label = node.label?.trim();
  if (label && label.length > 0) {
    return label;
  }

  const index = nodes.findIndex((item) => item.id === node.id);
  return t('projectTree.nodeFallback', { index: index >= 0 ? index + 1 : '?' });
}

function formatMemberLabel(
  member: Member | undefined,
  members: Member[],
  t: TFunction<I18nKey>,
): string {
  if (member == null) {
    return t('entity.member');
  }

  const label = member.label?.trim();
  if (label && label.length > 0) {
    return label;
  }

  const index = members.findIndex((item) => item.id === member.id);
  return t('projectTree.memberFallback', { index: index >= 0 ? index + 1 : '?' });
}
