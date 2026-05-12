import { useState } from 'react';

import {
  Alert,
  Box,
  Button,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';

import {
  getLoadUnits,
  type GridEngModel,
  type Load,
  type Material,
  type Member,
  type ModelValidationResult,
  type Node,
  type Profile,
  type Restraint,
  type UnitSystem,
} from '../../entities/model';
import { useModelStore, type RestraintPreset } from '../../app/store';
import { useI18n } from '../../shared/i18n';
import { formatNumber, formatOptionalText, formatVector } from '../../shared/utils';
import {
  AssignmentCard,
  CoordinateFields,
  LoadDetails,
  MaterialCardDialog,
  MaterialSelectionDialog,
  ProfileCardDialog,
  ProfileSelectionDialog,
  PropertyRow,
  PropertySection,
  ValidationIssueGroup,
} from './shared';
import {
  createLoadDraft,
  getActiveRestraintAxes,
  isRestraintStateEmpty,
  parseNumberDraft,
  parseVec3Draft,
  resolveRestraintPreset,
} from './helpers';
import { EMPTY_RESTRAINT_STATE, type LoadEditorDraft } from './types';

export function ModelSummarySection({
  model,
  validationReport,
}: {
  model: GridEngModel;
  validationReport: ModelValidationResult;
}) {
  const { t } = useI18n();

  return (
    <>
      <PropertySection title={t('properties.sections.model')}>
        <PropertyRow label={t('properties.rows.name')} value={model.name} />
        <PropertyRow label={t('properties.rows.schema')} value={model.schemaVersion} />
        <PropertyRow label={t('properties.rows.verticalAxis')} value={model.settings.verticalAxis} />
        <PropertyRow
          label={t('properties.rows.nodeMergeTolerance')}
          value={`${model.settings.nodeMergeToleranceMm} mm`}
        />
        <PropertyRow
          label={t('properties.rows.centerOnXY')}
          value={model.settings.centerModelByXYProjection ? t('common.enabled') : t('common.disabled')}
        />
      </PropertySection>

      <PropertySection title={t('properties.sections.inventory')}>
        <PropertyRow label={t('properties.rows.nodes')} value={`${model.nodes.length}`} />
        <PropertyRow label={t('properties.rows.members')} value={`${model.members.length}`} />
        <PropertyRow label={t('properties.rows.profiles')} value={`${model.profiles.length}`} />
        <PropertyRow label={t('properties.rows.materials')} value={`${model.materials.length}`} />
        <PropertyRow label={t('properties.rows.restraints')} value={`${model.restraints.length}`} />
        <PropertyRow label={t('properties.rows.loadCases')} value={`${model.loadCases.length}`} />
      </PropertySection>

      <PropertySection title={t('properties.sections.loadEnvironment')}>
        <PropertyRow label={t('properties.rows.defaultLoadCase')} value={model.loadCases[0]?.name ?? '-'} />
        <PropertyRow label={t('properties.rows.windDirection')} value={formatVector(model.loadCases[0]?.wind.direction)} />
        <PropertyRow
          label={t('properties.rows.windPressure')}
          value={`${formatNumber(model.loadCases[0]?.wind.nominalPressureKPa, 3)} kPa`}
        />
      </PropertySection>

      <PropertySection title={t('properties.sections.validation')}>
        {validationReport.issues.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('properties.messages.noIssuesFound')}
          </Typography>
        ) : (
          <Stack spacing={1}>
            {validationReport.errors.length > 0 && (
              <ValidationIssueGroup title={t('properties.messages.errors')} issues={validationReport.errors} />
            )}
            {validationReport.warnings.length > 0 && (
              <ValidationIssueGroup title={t('properties.messages.warnings')} issues={validationReport.warnings} />
            )}
          </Stack>
        )}
      </PropertySection>
    </>
  );
}

export function NodeEditorSection({
  node,
  restraint,
  nodeLoads,
  units,
}: {
  node: Node;
  restraint: Restraint | undefined;
  nodeLoads: Array<{ loadCaseName: string; load: Load }>;
  units: UnitSystem;
}) {
  const { t } = useI18n();
  const updateNodeLabel = useModelStore((state) => state.updateNodeLabel);
  const updateNodePosition = useModelStore((state) => state.updateNodePosition);
  const updateNodeComment = useModelStore((state) => state.updateNodeComment);
  const upsertNodeRestraint = useModelStore((state) => state.upsertNodeRestraint);
  const deleteNodeRestraint = useModelStore((state) => state.deleteNodeRestraint);
  const applyRestraintPreset = useModelStore((state) => state.applyRestraintPreset);
  const [label, setLabel] = useState(node.label ?? '');
  const [comment, setComment] = useState(node.comment ?? '');
  const [position, setPosition] = useState({
    x: String(node.position.x),
    y: String(node.position.y),
    z: String(node.position.z),
  });
  const [error, setError] = useState<string | null>(null);

  const restraintState = restraint ?? { ...EMPTY_RESTRAINT_STATE, id: '', nodeId: node.id };
  const activePreset = resolveRestraintPreset(restraintState);

  function handleApplyNode() {
    const nextPosition = parseVec3Draft(position, t);

    if (typeof nextPosition === 'string') {
      setError(nextPosition);
      return;
    }

    const updateLabelResult = updateNodeLabel(node.id, label);
    if (!updateLabelResult.ok) {
      setError(updateLabelResult.error);
      return;
    }

    const updatePositionResult = updateNodePosition(node.id, nextPosition);
    if (!updatePositionResult.ok) {
      setError(updatePositionResult.error);
      return;
    }

    const updateCommentResult = updateNodeComment(node.id, comment);
    if (!updateCommentResult.ok) {
      setError(updateCommentResult.error);
      return;
    }

    setError(null);
  }

  function handleRestraintPresetChange(_event: React.MouseEvent<HTMLElement>, preset: RestraintPreset | null) {
    if (!preset || preset === 'custom') {
      return;
    }

    const result = applyRestraintPreset(node.id, preset);
    setError(result.ok ? null : result.error);
  }

  function handleRestraintToggle(axis: keyof typeof EMPTY_RESTRAINT_STATE) {
    const nextRestraint = {
      ux: restraintState.ux,
      uy: restraintState.uy,
      uz: restraintState.uz,
      rx: restraintState.rx,
      ry: restraintState.ry,
      rz: restraintState.rz,
      [axis]: !restraintState[axis],
    };

    const result = isRestraintStateEmpty(nextRestraint)
      ? deleteNodeRestraint(node.id)
      : upsertNodeRestraint(node.id, nextRestraint);

    setError(result.ok ? null : result.error);
  }

  return (
    <>
      <PropertySection title={t('properties.sections.node')}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label={t('properties.fields.nodeName')}
          size="small"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
        <CoordinateFields
          values={position}
          onChange={(axis, value) => {
            setPosition((current) => ({
              ...current,
              [axis]: value,
            }));
          }}
        />
        <TextField
          label={t('properties.rows.comment')}
          size="small"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          multiline
          minRows={2}
        />
        <Button variant="contained" onClick={handleApplyNode}>
          {t('properties.actions.apply')}
        </Button>
      </PropertySection>

      <PropertySection title={t('properties.sections.restraint')}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={activePreset}
          onChange={handleRestraintPresetChange}
          sx={{ flexWrap: 'wrap' }}
        >
          <ToggleButton value="free">{t('properties.restraintPreset.free')}</ToggleButton>
          <ToggleButton value="hinge">{t('properties.restraintPreset.hinge')}</ToggleButton>
          <ToggleButton value="fixed">{t('properties.restraintPreset.fixed')}</ToggleButton>
          <ToggleButton value="custom">{t('properties.restraintPreset.custom')}</ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup size="small" value={getActiveRestraintAxes(restraintState)} sx={{ flexWrap: 'wrap' }}>
          {(['ux', 'uy', 'uz', 'rx', 'ry', 'rz'] as const).map((axis) => (
            <ToggleButton
              key={axis}
              value={axis}
              selected={restraintState[axis]}
              onChange={() => handleRestraintToggle(axis)}
            >
              {axis.toUpperCase()}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </PropertySection>

      <PropertySection title={t('properties.sections.loads')}>
        {nodeLoads.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('properties.messages.noNodeLoadsAssigned')}
          </Typography>
        ) : (
          <Stack spacing={1.25}>
            {nodeLoads.map(({ loadCaseName, load }) => (
              <Box key={load.id}>
                <Typography variant="subtitle2">{load.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {loadCaseName}
                </Typography>
                <LoadDetails load={load} units={units} />
              </Box>
            ))}
          </Stack>
        )}
      </PropertySection>
    </>
  );
}

export function MemberEditorSection({
  member,
  startNode,
  endNode,
  profile,
  material,
  availableProfiles,
  availableMaterials,
  memberLoads,
  units,
}: {
  member: Member;
  startNode: Node | undefined;
  endNode: Node | undefined;
  profile: Profile | undefined;
  material: Material | undefined;
  availableProfiles: Profile[];
  availableMaterials: Material[];
  memberLoads: Array<{ loadCaseName: string; load: Load }>;
  units: UnitSystem;
}) {
  const { t } = useI18n();
  const updateMemberProfile = useModelStore((state) => state.updateMemberProfile);
  const updateMemberMaterial = useModelStore((state) => state.updateMemberMaterial);
  const updateMemberGeometryOverrides = useModelStore((state) => state.updateMemberGeometryOverrides);
  const updateMemberComment = useModelStore((state) => state.updateMemberComment);
  const [geometryDraft, setGeometryDraft] = useState({
    localAxisRotationDeg: String(member.localAxisRotationDeg ?? profile?.defaultLocalAxisRotationDeg ?? 0),
    offsetYmm: String(member.offsetYmm ?? profile?.defaultOffsetYmm ?? 0),
    offsetZmm: String(member.offsetZmm ?? profile?.defaultOffsetZmm ?? 0),
  });
  const [comment, setComment] = useState(member.comment ?? '');
  const [error, setError] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [profileCardOpen, setProfileCardOpen] = useState(false);
  const [materialCardOpen, setMaterialCardOpen] = useState(false);

  function handleApplyMember() {
    const rotation = parseNumberDraft(geometryDraft.localAxisRotationDeg, t('properties.rows.localXRotation'), t);
    if (typeof rotation === 'string') {
      setError(rotation);
      return;
    }

    const offsetY = parseNumberDraft(geometryDraft.offsetYmm, t('properties.rows.offsetY'), t);
    if (typeof offsetY === 'string') {
      setError(offsetY);
      return;
    }

    const offsetZ = parseNumberDraft(geometryDraft.offsetZmm, t('properties.rows.offsetZ'), t);
    if (typeof offsetZ === 'string') {
      setError(offsetZ);
      return;
    }

    const geometryResult = updateMemberGeometryOverrides(member.id, {
      localAxisRotationDeg: rotation,
      offsetYmm: offsetY,
      offsetZmm: offsetZ,
    });

    if (!geometryResult.ok) {
      setError(geometryResult.error);
      return;
    }

    const commentResult = updateMemberComment(member.id, comment);
    if (!commentResult.ok) {
      setError(commentResult.error);
      return;
    }

    setError(null);
  }

  function handleProfileSelect(profileId: string) {
    const result = updateMemberProfile(member.id, profileId);
    setError(result.ok ? null : result.error);
    if (result.ok) {
      setProfileDialogOpen(false);
    }
  }

  function handleMaterialSelect(materialId: string) {
    const result = updateMemberMaterial(member.id, materialId);
    setError(result.ok ? null : result.error);
    if (result.ok) {
      setMaterialDialogOpen(false);
    }
  }

  return (
    <>
      <PropertySection title={t('properties.sections.member')}>
        {error && <Alert severity="error">{error}</Alert>}
        <PropertyRow label={t('properties.rows.startNode')} value={startNode?.label ?? member.startNodeId} />
        <PropertyRow label={t('properties.rows.endNode')} value={endNode?.label ?? member.endNodeId} />

        <AssignmentCard
          title={t('properties.rows.profile')}
          primary={profile?.name ?? t('properties.messages.noProfileAssigned')}
          secondary={profile?.kind}
          accentColor={profile?.color ?? 'profile.main'}
          chooseLabel={profile ? t('properties.actions.replace') : t('properties.actions.choose')}
          openLabel={t('properties.actions.openCard')}
          onChoose={() => setProfileDialogOpen(true)}
          onOpen={() => setProfileCardOpen(true)}
          openDisabled={!profile}
        />

        <AssignmentCard
          title={t('properties.rows.material')}
          primary={material?.name ?? t('properties.messages.noMaterialAssigned')}
          secondary={material ? `${formatNumber(material.elasticModulusMPa, 0)} MPa` : undefined}
          accentColor="selected.main"
          chooseLabel={material ? t('properties.actions.replace') : t('properties.actions.choose')}
          openLabel={t('properties.actions.openCard')}
          onChoose={() => setMaterialDialogOpen(true)}
          onOpen={() => setMaterialCardOpen(true)}
          openDisabled={!material}
        />

        <TextField
          label={t('properties.rows.localXRotation')}
          size="small"
          type="number"
          value={geometryDraft.localAxisRotationDeg}
          onChange={(event) => {
            setGeometryDraft((current) => ({
              ...current,
              localAxisRotationDeg: event.target.value,
            }));
          }}
        />
        <TextField
          label={t('properties.rows.offsetY')}
          size="small"
          type="number"
          value={geometryDraft.offsetYmm}
          onChange={(event) => {
            setGeometryDraft((current) => ({
              ...current,
              offsetYmm: event.target.value,
            }));
          }}
        />
        <TextField
          label={t('properties.rows.offsetZ')}
          size="small"
          type="number"
          value={geometryDraft.offsetZmm}
          onChange={(event) => {
            setGeometryDraft((current) => ({
              ...current,
              offsetZmm: event.target.value,
            }));
          }}
        />
        <TextField
          label={t('properties.rows.comment')}
          size="small"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          multiline
          minRows={2}
        />
        <Button variant="contained" onClick={handleApplyMember}>
          {t('properties.actions.apply')}
        </Button>
      </PropertySection>

      <PropertySection title={t('properties.sections.memberLoads')}>
        {memberLoads.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('properties.messages.noMemberLoadsAssigned')}
          </Typography>
        ) : (
          <Stack spacing={1.25}>
            {memberLoads.map(({ loadCaseName, load }) => (
              <Box key={load.id}>
                <Typography variant="subtitle2">{load.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {loadCaseName}
                </Typography>
                <LoadDetails load={load} units={units} />
              </Box>
            ))}
          </Stack>
        )}
      </PropertySection>

      <ProfileSelectionDialog
        open={profileDialogOpen}
        profiles={availableProfiles}
        currentProfileId={member.profileId}
        onClose={() => setProfileDialogOpen(false)}
        onSelect={handleProfileSelect}
      />

      <MaterialSelectionDialog
        open={materialDialogOpen}
        materials={availableMaterials}
        currentMaterialId={member.materialId}
        onClose={() => setMaterialDialogOpen(false)}
        onSelect={handleMaterialSelect}
      />

      <ProfileCardDialog open={profileCardOpen} profile={profile} onClose={() => setProfileCardOpen(false)} />
      <MaterialCardDialog open={materialCardOpen} material={material} onClose={() => setMaterialCardOpen(false)} />
    </>
  );
}

export function LoadCaseSummarySection({
  loadCase,
  units,
}: {
  loadCase: GridEngModel['loadCases'][number];
  units: UnitSystem;
}) {
  const { t } = useI18n();

  return (
    <>
      <PropertySection title={t('properties.sections.loadCase')}>
        <PropertyRow label={t('properties.rows.name')} value={loadCase.name} />
        <PropertyRow label={t('properties.rows.comment')} value={formatOptionalText(loadCase.comment)} />
        <PropertyRow label={t('properties.rows.loadsCount')} value={`${loadCase.loads.length}`} />
        <PropertyRow label={t('properties.rows.windDirection')} value={formatVector(loadCase.wind.direction)} />
        <PropertyRow
          label={t('properties.rows.nominalPressure')}
          value={`${formatNumber(loadCase.wind.nominalPressureKPa, 3)} kPa`}
        />
      </PropertySection>

      <PropertySection title={t('properties.sections.loads')}>
        {loadCase.loads.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('properties.messages.noLoadsAssigned')}
          </Typography>
        ) : (
          <Stack spacing={1.25}>
            {loadCase.loads.map((load) => (
              <Box key={load.id}>
                <Typography variant="subtitle2">{load.name}</Typography>
                <LoadDetails load={load} units={units} />
              </Box>
            ))}
          </Stack>
        )}
      </PropertySection>
    </>
  );
}

export function LoadEditorSection({
  load,
  loadCaseId,
  loadCaseName,
  nodes,
  members,
  units,
}: {
  load: Load;
  loadCaseId: string;
  loadCaseName: string;
  nodes: Node[];
  members: Member[];
  units: UnitSystem;
}) {
  const { t } = useI18n();
  const updateLoad = useModelStore((state) => state.updateLoad);
  const [draft, setDraft] = useState<LoadEditorDraft>(() => createLoadDraft(load));
  const [error, setError] = useState<string | null>(null);

  const isFunctionDistribution = draft.type === 'member_distributed' && draft.distributionType === 'function';

  function handleApplyLoad() {
    const direction = parseVec3Draft(draft.direction, t);
    if (typeof direction === 'string') {
      setError(direction);
      return;
    }

    const basePatch = {
      type: draft.type,
      name: draft.name,
      comment: draft.comment,
      kind: draft.kind,
      direction,
    } as const;

    if (draft.type === 'nodal_concentrated') {
      const magnitude = parseNumberDraft(draft.magnitude, t('properties.rows.magnitude'), t);
      if (typeof magnitude === 'string') {
        setError(magnitude);
        return;
      }

      const result = updateLoad(loadCaseId, load.id, {
        ...basePatch,
        target: {
          type: 'node',
          nodeId: draft.targetNodeId,
        },
        magnitude,
      });

      setError(result.ok ? null : result.error);
      return;
    }

    if (isFunctionDistribution) {
      const result = updateLoad(loadCaseId, load.id, {
        ...basePatch,
        target: {
          type: 'member',
          memberId: draft.targetMemberId,
        },
      });

      setError(result.ok ? null : result.error);
      return;
    }

    const qStart = parseNumberDraft(draft.qStart, t('properties.rows.qStart'), t);
    if (typeof qStart === 'string') {
      setError(qStart);
      return;
    }

    const qEnd = parseNumberDraft(draft.qEnd, t('properties.rows.qEnd'), t);
    if (typeof qEnd === 'string') {
      setError(qEnd);
      return;
    }

    const xStartRel = parseNumberDraft(draft.xStartRel, t('properties.rows.xStartRel'), t);
    if (typeof xStartRel === 'string') {
      setError(xStartRel);
      return;
    }

    const xEndRel = parseNumberDraft(draft.xEndRel, t('properties.rows.xEndRel'), t);
    if (typeof xEndRel === 'string') {
      setError(xEndRel);
      return;
    }

    const result = updateLoad(loadCaseId, load.id, {
      ...basePatch,
      target: {
        type: 'member',
        memberId: draft.targetMemberId,
      },
      distribution: {
        type: 'linear',
        qStart,
        qEnd,
        xStartRel,
        xEndRel,
      },
    });

    setError(result.ok ? null : result.error);
  }

  return (
    <>
      <PropertySection title={t('properties.sections.load')}>
        {error && <Alert severity="error">{error}</Alert>}
        <PropertyRow label={t('properties.sections.loadCase')} value={loadCaseName} />
        <TextField
          label={t('properties.rows.name')}
          size="small"
          value={draft.name}
          onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
        />
        <TextField
          label={t('properties.rows.comment')}
          size="small"
          value={draft.comment}
          onChange={(event) => setDraft((current) => ({ ...current, comment: event.target.value }))}
          multiline
          minRows={2}
        />
        <Select
          size="small"
          value={draft.type}
          onChange={(event) => {
            const nextType = event.target.value as 'nodal_concentrated' | 'member_distributed';

            setDraft((current) => ({
              ...current,
              type: nextType,
              targetNodeId: nextType === 'nodal_concentrated'
                ? current.targetNodeId || nodes[0]?.id || ''
                : current.targetNodeId,
              targetMemberId: nextType === 'member_distributed'
                ? current.targetMemberId || members[0]?.id || ''
                : current.targetMemberId,
            }));
          }}
        >
          <MenuItem value="nodal_concentrated">{t('properties.values.nodalConcentrated')}</MenuItem>
          <MenuItem value="member_distributed">{t('properties.values.memberDistributed')}</MenuItem>
        </Select>
        <Select
          size="small"
          value={draft.kind}
          onChange={(event) => {
            setDraft((current) => ({
              ...current,
              kind: event.target.value as 'force' | 'moment',
            }));
          }}
        >
          <MenuItem value="force">{t('properties.loadKind.force')}</MenuItem>
          <MenuItem value="moment">{t('properties.loadKind.moment')}</MenuItem>
        </Select>
        <TextField
          label={t('properties.rows.coordinateSystem')}
          size="small"
          value={t('properties.coordinateSystem.global')}
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
        />
        <CoordinateFields
          values={draft.direction}
          onChange={(axis, value) => {
            setDraft((current) => ({
              ...current,
              direction: {
                ...current.direction,
                [axis]: value,
              },
            }));
          }}
        />

        {draft.type === 'nodal_concentrated' ? (
          <>
            <Select
              size="small"
              value={draft.targetNodeId}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  targetNodeId: event.target.value,
                }));
              }}
            >
              {nodes.map((node, index) => (
                <MenuItem key={node.id} value={node.id}>
                  {node.label?.trim() || t('projectTree.nodeFallback', { index: index + 1 })}
                </MenuItem>
              ))}
            </Select>
            <TextField
              label={`${t('properties.rows.magnitude')} (${getLoadUnits(load.type === 'nodal_concentrated' ? load : { ...load, type: 'nodal_concentrated', magnitude: 0, target: { type: 'node', nodeId: draft.targetNodeId } }, units)})`}
              size="small"
              type="number"
              value={draft.magnitude}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  magnitude: event.target.value,
                }));
              }}
            />
          </>
        ) : (
          <>
            <Select
              size="small"
              value={draft.targetMemberId}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  targetMemberId: event.target.value,
                }));
              }}
            >
              {members.map((member, index) => (
                <MenuItem key={member.id} value={member.id}>
                  {member.label?.trim() || t('projectTree.memberFallback', { index: index + 1 })}
                </MenuItem>
              ))}
            </Select>

            {isFunctionDistribution ? (
              <Alert severity="info">
                {t('properties.messages.functionDistributionReserved')}
              </Alert>
            ) : (
              <>
                <TextField
                  label={`${t('properties.rows.qStart')} (${getLoadUnits(load.type === 'member_distributed' ? load : {
                    ...load,
                    type: 'member_distributed',
                    target: { type: 'member', memberId: draft.targetMemberId },
                    distribution: { type: 'linear', qStart: 0, qEnd: 0 },
                  }, units)})`}
                  size="small"
                  type="number"
                  value={draft.qStart}
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      qStart: event.target.value,
                    }));
                  }}
                />
                <TextField
                  label={`${t('properties.rows.qEnd')} (${getLoadUnits(load.type === 'member_distributed' ? load : {
                    ...load,
                    type: 'member_distributed',
                    target: { type: 'member', memberId: draft.targetMemberId },
                    distribution: { type: 'linear', qStart: 0, qEnd: 0 },
                  }, units)})`}
                  size="small"
                  type="number"
                  value={draft.qEnd}
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      qEnd: event.target.value,
                    }));
                  }}
                />
                <TextField
                  label={t('properties.rows.xStartRel')}
                  size="small"
                  type="number"
                  value={draft.xStartRel}
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      xStartRel: event.target.value,
                    }));
                  }}
                />
                <TextField
                  label={t('properties.rows.xEndRel')}
                  size="small"
                  type="number"
                  value={draft.xEndRel}
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      xEndRel: event.target.value,
                    }));
                  }}
                />
              </>
            )}
          </>
        )}

        <Button variant="contained" onClick={handleApplyLoad}>
          {t('properties.actions.apply')}
        </Button>
      </PropertySection>

      <PropertySection title={t('properties.sections.loadDetails')}>
        <LoadDetails load={load} units={units} />
      </PropertySection>
    </>
  );
}

export function StandaloneRestraintEditorSection({
  restraint,
  node,
}: {
  restraint: Restraint;
  node: Node | undefined;
}) {
  const { t } = useI18n();
  const upsertNodeRestraint = useModelStore((state) => state.upsertNodeRestraint);
  const deleteNodeRestraint = useModelStore((state) => state.deleteNodeRestraint);
  const applyRestraintPreset = useModelStore((state) => state.applyRestraintPreset);
  const [comment, setComment] = useState(restraint.comment ?? '');
  const [error, setError] = useState<string | null>(null);
  const activePreset = resolveRestraintPreset(restraint);

  function handleCommentApply() {
    const result = upsertNodeRestraint(restraint.nodeId, { comment });
    setError(result.ok ? null : result.error);
  }

  function handlePresetChange(_event: React.MouseEvent<HTMLElement>, preset: RestraintPreset | null) {
    if (!preset || preset === 'custom') {
      return;
    }

    const result = applyRestraintPreset(restraint.nodeId, preset);
    setError(result.ok ? null : result.error);
  }

  function handleToggle(axis: keyof typeof EMPTY_RESTRAINT_STATE) {
    const nextRestraint = {
      ux: restraint.ux,
      uy: restraint.uy,
      uz: restraint.uz,
      rx: restraint.rx,
      ry: restraint.ry,
      rz: restraint.rz,
      [axis]: !restraint[axis],
    };

    const result = isRestraintStateEmpty(nextRestraint)
      ? deleteNodeRestraint(restraint.nodeId)
      : upsertNodeRestraint(restraint.nodeId, nextRestraint);

    setError(result.ok ? null : result.error);
  }

  return (
    <>
      <PropertySection title={t('properties.sections.restraint')}>
        {error && <Alert severity="error">{error}</Alert>}
        <PropertyRow label={t('entity.node')} value={node?.label ?? restraint.nodeId} />
        <TextField
          label={t('properties.rows.comment')}
          size="small"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          multiline
          minRows={2}
        />
        <Button variant="contained" onClick={handleCommentApply}>
          {t('properties.actions.apply')}
        </Button>

        <ToggleButtonGroup
          exclusive
          size="small"
          value={activePreset}
          onChange={handlePresetChange}
          sx={{ flexWrap: 'wrap' }}
        >
          <ToggleButton value="free">{t('properties.restraintPreset.free')}</ToggleButton>
          <ToggleButton value="hinge">{t('properties.restraintPreset.hinge')}</ToggleButton>
          <ToggleButton value="fixed">{t('properties.restraintPreset.fixed')}</ToggleButton>
          <ToggleButton value="custom">{t('properties.restraintPreset.custom')}</ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup size="small" value={getActiveRestraintAxes(restraint)} sx={{ flexWrap: 'wrap' }}>
          {(['ux', 'uy', 'uz', 'rx', 'ry', 'rz'] as const).map((axis) => (
            <ToggleButton
              key={axis}
              value={axis}
              selected={restraint[axis]}
              onChange={() => handleToggle(axis)}
            >
              {axis.toUpperCase()}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </PropertySection>

      <PropertySection title={t('properties.sections.associatedNode')}>
        <PropertyRow label={t('properties.rows.nodeId')} value={node?.label ?? restraint.nodeId} />
        <PropertyRow label={t('properties.rows.position')} value={node ? formatVector(node.position) : '-'} />
        <PropertyRow label={t('properties.rows.nodeComment')} value={formatOptionalText(node?.comment)} />
      </PropertySection>
    </>
  );
}

export function StandaloneProfileSection({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <PropertySection title={t('properties.sections.profile')}>
        <Alert severity="info">{t('properties.messages.profileCardInDialog')}</Alert>
        <AssignmentCard
          title={t('properties.rows.profile')}
          primary={profile.name}
          secondary={profile.kind}
          accentColor={profile.color ?? 'profile.main'}
          chooseLabel={t('properties.actions.choose')}
          openLabel={t('properties.actions.openCard')}
          onChoose={() => {}}
          onOpen={() => setOpen(true)}
          chooseDisabled
        />
      </PropertySection>

      <ProfileCardDialog open={open} profile={profile} onClose={() => setOpen(false)} />
    </>
  );
}

export function StandaloneMaterialSection({ material }: { material: Material }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <PropertySection title={t('properties.sections.material')}>
        <Alert severity="info">{t('properties.messages.materialCardInDialog')}</Alert>
        <AssignmentCard
          title={t('properties.rows.material')}
          primary={material.name}
          secondary={`${formatNumber(material.elasticModulusMPa, 0)} MPa`}
          accentColor="selected.main"
          chooseLabel={t('properties.actions.choose')}
          openLabel={t('properties.actions.openCard')}
          onChoose={() => {}}
          onOpen={() => setOpen(true)}
          chooseDisabled
        />
      </PropertySection>

      <MaterialCardDialog open={open} material={material} onClose={() => setOpen(false)} />
    </>
  );
}
