import { Box, Button, MenuItem, Paper, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

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
import { notifyWarning } from '../../shared/ui';
import { formatNumber, formatVector } from '../../shared/utils';
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
import { getActiveRestraintAxes, parseNumberDraft, resolveRestraintPreset } from './helpers';
import {
  PropertyActionRow,
  PropertyEditorRow,
  PropertyRow,
  PropertySection,
  TechnicalDetailsSection,
} from './shared';
import { EMPTY_RESTRAINT_STATE } from './types';

const DIFFERENT_VALUE = '******РАЗЛИЧНЫЕ******';

interface SelectedLoadRecord {
  loadCase: GridEngModel['loadCases'][number];
  load: Load;
}

type NodeSelection = { type: 'node'; id: string };
type MemberSelection = { type: 'member'; id: string };
type LoadSelection = { type: 'load'; loadCaseId: string; loadId: string };
type RestraintSelection = { type: 'restraint'; restraintId: string };

export function PropertiesPanel() {
  const { t } = useI18n();
  const model = useModelStore((state) => state.model);
  const selectedEntity = useModelStore((state) => state.selectedEntity);
  const selectedEntities = useModelStore((state) => state.selectedEntities);
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
  const multiSelection = useMemo(
    () => resolveMultiSelection(model, selectedEntities),
    [model, selectedEntities],
  );

  const headerLabel = getPropertiesHeaderLabel({
    model,
    selectedEntity,
    selectedEntities,
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
        spacing={0}
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography
          variant="body1"
          align="center"
          noWrap
          title={headerLabel}
          sx={{ fontWeight: 600, lineHeight: 1.25 }}
        >
          {headerLabel}
        </Typography>
      </Stack>

      <Box
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          overscrollBehaviorY: 'contain',
          scrollbarGutter: 'stable',
          p: 2,
        }}
      >
        <Stack spacing={2} sx={{ minWidth: 0 }}>
          {selectedEntities.length > 1 ? (
            <>
              <MultiSelectionOverviewSection selection={multiSelection} />
              {multiSelection.nodes.length > 0 && (
                <MultiNodeBatchSection
                  nodes={multiSelection.nodes}
                  restraintsByNodeId={multiSelection.restraintsByNodeId}
                  totalSelectionCount={selectedEntities.length}
                />
              )}
              {multiSelection.members.length > 0 && (
                <MultiMemberBatchSection
                  members={multiSelection.members}
                  model={model}
                  totalSelectionCount={selectedEntities.length}
                />
              )}
              {multiSelection.loads.length > 0 && (
                <MultiLoadBatchSection
                  loads={multiSelection.loads}
                  totalSelectionCount={selectedEntities.length}
                />
              )}
              {multiSelection.restraints.length > 0 && (
                <MultiRestraintBatchSection
                  restraints={multiSelection.restraints}
                  nodesById={multiSelection.nodesById}
                  totalSelectionCount={selectedEntities.length}
                />
              )}
            </>
          ) : (
            <>
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
            </>
          )}
        </Stack>
      </Box>
    </Paper>
  );
}

function MultiSelectionOverviewSection({
  selection,
}: {
  selection: ReturnType<typeof resolveMultiSelection>;
}) {
  const { t } = useI18n();
  const typeSummary = selection.types
    .map((type) => t(`entity.${type}` as I18nKey))
    .join(', ');

  return (
    <PropertySection title={t('properties.sections.selection')}>
      <PropertyRow label={t('properties.rows.selectionCount')} value={String(selection.totalCount)} />
      <PropertyRow label={t('properties.rows.entityTypes')} value={typeSummary} />
    </PropertySection>
  );
}

function MultiNodeBatchSection({
  nodes,
  restraintsByNodeId,
  totalSelectionCount,
}: {
  nodes: Node[];
  restraintsByNodeId: Map<string, Restraint | undefined>;
  totalSelectionCount: number;
}) {
  const { t } = useI18n();
  const updateNodeComment = useModelStore((state) => state.updateNodeComment);
  const upsertNodeRestraint = useModelStore((state) => state.upsertNodeRestraint);
  const deleteNodeRestraint = useModelStore((state) => state.deleteNodeRestraint);
  const applyRestraintPreset = useModelStore((state) => state.applyRestraintPreset);
  const [commentDraft, setCommentDraft] = useState('');
  const restraintStates = nodes.map((node) => restraintsByNodeId.get(node.id) ?? {
    ...EMPTY_RESTRAINT_STATE,
    id: '',
    nodeId: node.id,
  });

  function handleApplyComment() {
    const result = applyBatch(nodes, totalSelectionCount, t('properties.rows.comment'), (node) =>
      updateNodeComment(node.id, commentDraft)
    );
    if (!result.ok) {
      return;
    }

    notifyPartialApply(totalSelectionCount, nodes.length, t('entity.node'), t);
    setCommentDraft('');
  }

  function handleApplyPreset(preset: 'free' | 'hinge' | 'fixed') {
    const result = applyBatch(nodes, totalSelectionCount, t('properties.rows.restraintPreset'), (node) =>
      applyRestraintPreset(node.id, preset)
    );
    if (result.ok) {
      notifyPartialApply(totalSelectionCount, nodes.length, t('entity.node'), t);
    }
  }

  function handleToggleAxis(axis: keyof typeof EMPTY_RESTRAINT_STATE) {
    const shouldEnable = !restraintStates.every((restraint) => restraint[axis]);
    const result = applyBatch(nodes, totalSelectionCount, t('properties.rows.dof'), (node) => {
      const current = restraintsByNodeId.get(node.id) ?? {
        ...EMPTY_RESTRAINT_STATE,
        id: '',
        nodeId: node.id,
      };
      const nextState = {
        ux: current.ux,
        uy: current.uy,
        uz: current.uz,
        rx: current.rx,
        ry: current.ry,
        rz: current.rz,
        [axis]: shouldEnable,
      };

      return Object.values(nextState).some(Boolean)
        ? upsertNodeRestraint(node.id, nextState)
        : deleteNodeRestraint(node.id);
    });

    if (result.ok) {
      notifyPartialApply(totalSelectionCount, nodes.length, t('entity.node'), t);
    }
  }

  return (
    <PropertySection title={t('properties.sections.node')}>
      <PropertyRow label={t('properties.rows.selectionCount')} value={String(nodes.length)} />
      <PropertyRow label={t('properties.fields.nodeName')} value={resolveSharedText(nodes, (node) => node.label?.trim() || '')} />
      <PropertyRow label={t('properties.rows.position')} value={resolveSharedText(nodes, (node) => formatVector(node.position))} />
      <PropertyRow label={t('properties.rows.comment')} value={resolveSharedText(nodes, (node) => node.comment ?? '')} />
      <PropertyRow label={t('properties.rows.restraintPreset')} value={resolveSharedText(restraintStates, (restraint) => t(`properties.restraintPreset.${resolveRestraintPreset(restraint)}` as I18nKey))} />
      <PropertyRow label={t('properties.rows.dof')} value={resolveSharedText(restraintStates, (restraint) => formatDofSummary(restraint, t))} />
      <PropertyEditorRow label={t('properties.rows.comment')}>
        <TextField
          size="small"
          value={commentDraft}
          placeholder={t('properties.placeholders.batchValue')}
          onChange={(event) => setCommentDraft(event.target.value)}
        />
      </PropertyEditorRow>
      <PropertyActionRow label={t('properties.actions.apply')}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={null}
          onChange={(_event, preset: 'free' | 'hinge' | 'fixed' | null) => {
            if (preset != null) {
              handleApplyPreset(preset);
            }
          }}
        >
          <ToggleButton value="free">{t('properties.restraintPreset.free')}</ToggleButton>
          <ToggleButton value="hinge">{t('properties.restraintPreset.hinge')}</ToggleButton>
          <ToggleButton value="fixed">{t('properties.restraintPreset.fixed')}</ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup size="small" value={[]}>
          {(['ux', 'uy', 'uz', 'rx', 'ry', 'rz'] as const).map((axis) => (
            <ToggleButton key={axis} value={axis} onClick={() => handleToggleAxis(axis)}>
              {axis.toUpperCase()}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Button variant="contained" onClick={handleApplyComment}>
          {t('properties.actions.apply')}
        </Button>
      </PropertyActionRow>
    </PropertySection>
  );
}

function MultiMemberBatchSection({
  members,
  model,
  totalSelectionCount,
}: {
  members: Member[];
  model: GridEngModel;
  totalSelectionCount: number;
}) {
  const { t } = useI18n();
  const updateMemberProfile = useModelStore((state) => state.updateMemberProfile);
  const updateMemberMaterial = useModelStore((state) => state.updateMemberMaterial);
  const updateMemberGeometryOverrides = useModelStore((state) => state.updateMemberGeometryOverrides);
  const updateMemberComment = useModelStore((state) => state.updateMemberComment);
  const profilesById = useMemo(
    () => new Map(model.profiles.map((profile) => [profile.id, profile] as const)),
    [model.profiles],
  );
  const materialsById = useMemo(
    () => new Map(model.materials.map((material) => [material.id, material] as const)),
    [model.materials],
  );
  const [profileDraft, setProfileDraft] = useState('');
  const [materialDraft, setMaterialDraft] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const [rotationDraft, setRotationDraft] = useState('');
  const [offsetYDraft, setOffsetYDraft] = useState('');
  const [offsetZDraft, setOffsetZDraft] = useState('');

  function handleApplyProfile() {
    if (profileDraft.length === 0) {
      return;
    }

    const result = applyBatch(members, totalSelectionCount, t('properties.rows.profile'), (member) =>
      updateMemberProfile(member.id, profileDraft)
    );
    if (result.ok) {
      notifyPartialApply(totalSelectionCount, members.length, t('entity.member'), t);
      setProfileDraft('');
    }
  }

  function handleApplyMaterial() {
    if (materialDraft.length === 0) {
      return;
    }

    const result = applyBatch(members, totalSelectionCount, t('properties.rows.material'), (member) =>
      updateMemberMaterial(member.id, materialDraft)
    );
    if (result.ok) {
      notifyPartialApply(totalSelectionCount, members.length, t('entity.member'), t);
      setMaterialDraft('');
    }
  }

  function handleApplyGeometry() {
    const localAxisRotationDeg = parseOptionalBatchNumber(rotationDraft, t('properties.rows.localXRotation'), t);
    if (typeof localAxisRotationDeg === 'string') {
      return;
    }

    const offsetYmm = parseOptionalBatchNumber(offsetYDraft, t('properties.rows.offsetY'), t);
    if (typeof offsetYmm === 'string') {
      return;
    }

    const offsetZmm = parseOptionalBatchNumber(offsetZDraft, t('properties.rows.offsetZ'), t);
    if (typeof offsetZmm === 'string') {
      return;
    }

    const result = applyBatch(members, totalSelectionCount, t('properties.rows.localXRotation'), (member) =>
      updateMemberGeometryOverrides(member.id, {
        ...(localAxisRotationDeg != null ? { localAxisRotationDeg } : {}),
        ...(offsetYmm != null ? { offsetYmm } : {}),
        ...(offsetZmm != null ? { offsetZmm } : {}),
      })
    );
    if (result.ok) {
      notifyPartialApply(totalSelectionCount, members.length, t('entity.member'), t);
      setRotationDraft('');
      setOffsetYDraft('');
      setOffsetZDraft('');
    }
  }

  function handleApplyComment() {
    const result = applyBatch(members, totalSelectionCount, t('properties.rows.comment'), (member) =>
      updateMemberComment(member.id, commentDraft)
    );
    if (result.ok) {
      notifyPartialApply(totalSelectionCount, members.length, t('entity.member'), t);
      setCommentDraft('');
    }
  }

  return (
    <PropertySection title={t('properties.sections.member')}>
      <PropertyRow label={t('properties.rows.selectionCount')} value={String(members.length)} />
      <PropertyRow label={t('properties.rows.profile')} value={resolveSharedText(members, (member) => profilesById.get(member.profileId)?.name ?? member.profileId)} />
      <PropertyRow label={t('properties.rows.material')} value={resolveSharedText(members, (member) => materialsById.get(member.materialId)?.name ?? member.materialId)} />
      <PropertyRow label={t('properties.rows.localXRotation')} value={resolveSharedText(members, (member) => formatNumber(member.localAxisRotationDeg ?? 0, 3))} />
      <PropertyRow label={t('properties.rows.offsetY')} value={resolveSharedText(members, (member) => formatNumber(member.offsetYmm ?? 0, 3))} />
      <PropertyRow label={t('properties.rows.offsetZ')} value={resolveSharedText(members, (member) => formatNumber(member.offsetZmm ?? 0, 3))} />
      <PropertyRow label={t('properties.rows.comment')} value={resolveSharedText(members, (member) => member.comment ?? '')} />
      <PropertyEditorRow label={t('properties.rows.profile')}>
        <TextField
          select
          size="small"
          value={profileDraft}
          onChange={(event) => setProfileDraft(event.target.value)}
        >
          <MenuItem value="">{t('common.none')}</MenuItem>
          {model.profiles.map((profile) => (
            <MenuItem key={profile.id} value={profile.id}>{profile.name}</MenuItem>
          ))}
        </TextField>
      </PropertyEditorRow>
      <PropertyEditorRow label={t('properties.rows.material')}>
        <TextField
          select
          size="small"
          value={materialDraft}
          onChange={(event) => setMaterialDraft(event.target.value)}
        >
          <MenuItem value="">{t('common.none')}</MenuItem>
          {model.materials.map((material) => (
            <MenuItem key={material.id} value={material.id}>{material.name}</MenuItem>
          ))}
        </TextField>
      </PropertyEditorRow>
      <PropertyEditorRow label={t('properties.rows.localXRotation')}>
        <TextField size="small" type="number" value={rotationDraft} onChange={(event) => setRotationDraft(event.target.value)} />
      </PropertyEditorRow>
      <PropertyEditorRow label={t('properties.rows.offsetY')}>
        <TextField size="small" type="number" value={offsetYDraft} onChange={(event) => setOffsetYDraft(event.target.value)} />
      </PropertyEditorRow>
      <PropertyEditorRow label={t('properties.rows.offsetZ')}>
        <TextField size="small" type="number" value={offsetZDraft} onChange={(event) => setOffsetZDraft(event.target.value)} />
      </PropertyEditorRow>
      <PropertyEditorRow label={t('properties.rows.comment')}>
        <TextField size="small" value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} />
      </PropertyEditorRow>
      <PropertyActionRow label={t('properties.actions.apply')}>
        <Button variant="outlined" onClick={handleApplyProfile}>
          {t('properties.rows.profile')}
        </Button>
        <Button variant="outlined" onClick={handleApplyMaterial}>
          {t('properties.rows.material')}
        </Button>
        <Button variant="outlined" onClick={handleApplyGeometry}>
          {t('properties.rows.localXRotation')}
        </Button>
        <Button variant="contained" onClick={handleApplyComment}>
          {t('properties.rows.comment')}
        </Button>
      </PropertyActionRow>
    </PropertySection>
  );
}

function MultiLoadBatchSection({
  loads,
  totalSelectionCount,
}: {
  loads: SelectedLoadRecord[];
  totalSelectionCount: number;
}) {
  const { t } = useI18n();
  const updateLoadComment = useModelStore((state) => state.updateLoadComment);
  const [commentDraft, setCommentDraft] = useState('');

  function handleApplyComment() {
    const result = applyBatch(loads, totalSelectionCount, t('properties.rows.comment'), ({ loadCase, load }) =>
      updateLoadComment(loadCase.id, load.id, commentDraft)
    );
    if (result.ok) {
      notifyPartialApply(totalSelectionCount, loads.length, t('entity.load'), t);
      setCommentDraft('');
    }
  }

  return (
    <PropertySection title={t('properties.sections.load')}>
      <PropertyRow label={t('properties.rows.selectionCount')} value={String(loads.length)} />
      <PropertyRow label={t('properties.sections.loadCase')} value={resolveSharedText(loads, ({ loadCase }) => loadCase.name)} />
      <PropertyRow label={t('properties.rows.type')} value={resolveSharedText(loads, ({ load }) => load.type)} />
      <PropertyRow label={t('properties.rows.kind')} value={resolveSharedText(loads, ({ load }) => load.kind)} />
      <PropertyRow label={t('properties.rows.direction')} value={resolveSharedText(loads, ({ load }) => formatVector(load.direction))} />
      <PropertyRow label={t('properties.rows.comment')} value={resolveSharedText(loads, ({ load }) => load.comment ?? '')} />
      <PropertyEditorRow label={t('properties.rows.comment')}>
        <TextField size="small" value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} />
      </PropertyEditorRow>
      <PropertyActionRow label={t('properties.actions.apply')}>
        <Button variant="contained" onClick={handleApplyComment}>
          {t('properties.rows.comment')}
        </Button>
      </PropertyActionRow>
    </PropertySection>
  );
}

function MultiRestraintBatchSection({
  restraints,
  nodesById,
  totalSelectionCount,
}: {
  restraints: Restraint[];
  nodesById: Map<string, Node>;
  totalSelectionCount: number;
}) {
  const { t } = useI18n();
  const upsertNodeRestraint = useModelStore((state) => state.upsertNodeRestraint);
  const deleteNodeRestraint = useModelStore((state) => state.deleteNodeRestraint);
  const applyRestraintPreset = useModelStore((state) => state.applyRestraintPreset);
  const [commentDraft, setCommentDraft] = useState('');

  function handleApplyComment() {
    const result = applyBatch(restraints, totalSelectionCount, t('properties.rows.comment'), (restraint) =>
      upsertNodeRestraint(restraint.nodeId, { comment: commentDraft })
    );
    if (result.ok) {
      notifyPartialApply(totalSelectionCount, restraints.length, t('entity.restraint'), t);
      setCommentDraft('');
    }
  }

  function handleApplyPreset(preset: 'free' | 'hinge' | 'fixed') {
    const result = applyBatch(restraints, totalSelectionCount, t('properties.rows.restraintPreset'), (restraint) =>
      applyRestraintPreset(restraint.nodeId, preset)
    );
    if (result.ok) {
      notifyPartialApply(totalSelectionCount, restraints.length, t('entity.restraint'), t);
    }
  }

  function handleToggleAxis(axis: keyof typeof EMPTY_RESTRAINT_STATE) {
    const shouldEnable = !restraints.every((restraint) => restraint[axis]);
    const result = applyBatch(restraints, totalSelectionCount, t('properties.rows.dof'), (restraint) => {
      const nextState = {
        ux: restraint.ux,
        uy: restraint.uy,
        uz: restraint.uz,
        rx: restraint.rx,
        ry: restraint.ry,
        rz: restraint.rz,
        [axis]: shouldEnable,
      };

      return Object.values(nextState).some(Boolean)
        ? upsertNodeRestraint(restraint.nodeId, nextState)
        : deleteNodeRestraint(restraint.nodeId);
    });

    if (result.ok) {
      notifyPartialApply(totalSelectionCount, restraints.length, t('entity.restraint'), t);
    }
  }

  return (
    <PropertySection title={t('properties.sections.restraint')}>
      <PropertyRow label={t('properties.rows.selectionCount')} value={String(restraints.length)} />
      <PropertyRow label={t('properties.rows.nodeId')} value={resolveSharedText(restraints, (restraint) => nodesById.get(restraint.nodeId)?.label?.trim() || restraint.nodeId)} />
      <PropertyRow label={t('properties.rows.comment')} value={resolveSharedText(restraints, (restraint) => restraint.comment ?? '')} />
      <PropertyRow label={t('properties.rows.restraintPreset')} value={resolveSharedText(restraints, (restraint) => t(`properties.restraintPreset.${resolveRestraintPreset(restraint)}` as I18nKey))} />
      <PropertyRow label={t('properties.rows.dof')} value={resolveSharedText(restraints, (restraint) => formatDofSummary(restraint, t))} />
      <PropertyEditorRow label={t('properties.rows.comment')}>
        <TextField size="small" value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} />
      </PropertyEditorRow>
      <PropertyActionRow label={t('properties.actions.apply')}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={null}
          onChange={(_event, preset: 'free' | 'hinge' | 'fixed' | null) => {
            if (preset != null) {
              handleApplyPreset(preset);
            }
          }}
        >
          <ToggleButton value="free">{t('properties.restraintPreset.free')}</ToggleButton>
          <ToggleButton value="hinge">{t('properties.restraintPreset.hinge')}</ToggleButton>
          <ToggleButton value="fixed">{t('properties.restraintPreset.fixed')}</ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup size="small" value={[]}>
          {(['ux', 'uy', 'uz', 'rx', 'ry', 'rz'] as const).map((axis) => (
            <ToggleButton key={axis} value={axis} onClick={() => handleToggleAxis(axis)}>
              {axis.toUpperCase()}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Button variant="contained" onClick={handleApplyComment}>
          {t('properties.rows.comment')}
        </Button>
      </PropertyActionRow>
    </PropertySection>
  );
}

function getPropertiesHeaderLabel({
  model,
  selectedEntity,
  selectedEntities,
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
  selectedEntities: SelectedEntity[];
  selectedNode?: Node;
  selectedMember?: Member;
  selectedLoadCase?: GridEngModel['loadCases'][number];
  selectedLoad?: Load;
  selectedRestraintNode?: Node;
  selectedProfile?: Profile;
  selectedMaterial?: Material;
  t: TFunction<I18nKey>;
}): string {
  if (selectedEntities.length > 1) {
    const types = [...new Set(selectedEntities.map((candidate) => candidate.type).filter((type) => type != null))];
    if (types.length === 1 && types[0] != null) {
      return t('properties.multiSelection.sameType', {
        count: selectedEntities.length,
        entity: t(`entity.${types[0]}` as I18nKey),
      });
    }

    return t('properties.multiSelection.mixed', {
      count: selectedEntities.length,
      types: types.map((type) => t(`entity.${type}` as I18nKey)).join(', '),
    });
  }

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

function resolveMultiSelection(
  model: GridEngModel,
  selectedEntities: SelectedEntity[],
) {
  const nodes = selectedEntities
    .filter((selectedEntity): selectedEntity is NodeSelection => selectedEntity.type === 'node')
    .map((selectedEntity) => model.nodes.find((node) => node.id === selectedEntity.id))
    .filter((node): node is Node => node != null);
  const members = selectedEntities
    .filter((selectedEntity): selectedEntity is MemberSelection => selectedEntity.type === 'member')
    .map((selectedEntity) => model.members.find((member) => member.id === selectedEntity.id))
    .filter((member): member is Member => member != null);
  const loads = selectedEntities
    .filter((selectedEntity): selectedEntity is LoadSelection => selectedEntity.type === 'load')
    .map((selectedEntity) => {
      const loadCase = model.loadCases.find((candidate) => candidate.id === selectedEntity.loadCaseId);
      const load = loadCase?.loads.find((candidate) => candidate.id === selectedEntity.loadId);
      return loadCase == null || load == null ? null : { loadCase, load };
    })
    .filter((record): record is SelectedLoadRecord => record != null);
  const restraints = selectedEntities
    .filter((selectedEntity): selectedEntity is RestraintSelection => selectedEntity.type === 'restraint')
    .map((selectedEntity) => model.restraints.find((restraint) => restraint.id === selectedEntity.restraintId))
    .filter((restraint): restraint is Restraint => restraint != null);
  const nodesById = new Map(model.nodes.map((node) => [node.id, node] as const));
  const restraintsByNodeId = new Map(model.restraints.map((restraint) => [restraint.nodeId, restraint] as const));
  const types = [...new Set(
    selectedEntities
      .map((candidate) => candidate.type)
      .filter((type): type is Exclude<SelectedEntity['type'], null> => type != null),
  )];

  return {
    totalCount: selectedEntities.length,
    types,
    nodes,
    members,
    loads,
    restraints,
    nodesById,
    restraintsByNodeId,
  };
}

function resolveSharedText<T>(
  items: T[],
  getValue: (item: T) => string,
): string {
  if (items.length === 0) {
    return '-';
  }

  const first = normalizeSharedValue(getValue(items[0]));
  const isShared = items.every((item) => normalizeSharedValue(getValue(item)) === first);

  if (!isShared) {
    return DIFFERENT_VALUE;
  }

  return first.length > 0 ? first : '-';
}

function normalizeSharedValue(value: string): string {
  return value.trim();
}

function parseOptionalBatchNumber(
  value: string,
  label: string,
  t: TFunction<I18nKey>,
): number | null | string {
  if (value.trim().length === 0) {
    return null;
  }

  return parseNumberDraft(value, label, t);
}

function formatDofSummary(
  restraint: Pick<Restraint, keyof typeof EMPTY_RESTRAINT_STATE>,
  t: TFunction<I18nKey>,
): string {
  const axes = getActiveRestraintAxes(restraint).map((axis) => axis.toUpperCase());
  return axes.length > 0 ? axes.join(', ') : t('common.none');
}

function applyBatch<T>(
  items: T[],
  _totalSelectionCount: number,
  _propertyLabel: string,
  applyPatch: (item: T) => { ok: true } | { ok: false; error: string },
): { ok: true } | { ok: false; error: string } {
  for (const item of items) {
    const result = applyPatch(item);
    if (!result.ok) {
      return result;
    }
  }

  return { ok: true };
}

function notifyPartialApply(
  totalSelectionCount: number,
  applicableCount: number,
  entityLabel: string,
  t: TFunction<I18nKey>,
) {
  const skippedCount = totalSelectionCount - applicableCount;

  if (skippedCount <= 0) {
    return;
  }

  notifyWarning({
    title: t('notifications.selection.partialApply.title'),
    details: [
      t('notifications.selection.partialApply.detail', {
        entity: entityLabel,
        count: skippedCount,
      }),
    ],
  });
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
