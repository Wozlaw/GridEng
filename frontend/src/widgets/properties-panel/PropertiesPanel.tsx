import type { ReactNode } from 'react';

import {
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import {
  getLoadUnits,
  resolveConcentratedLoadVector,
  resolveDistributedLoadVectors,
  type Load,
  type UnitSystem,
} from '../../entities/model';
import { getSelectedEntityLabel } from '../../features/selection';
import { useModelStore } from '../../app/store';
import { formatNumber, formatOptionalText, formatRestraintState, formatVector } from '../../shared/utils';

export function PropertiesPanel() {
  const model = useModelStore((state) => state.model);
  const selectedEntity = useModelStore((state) => state.selectedEntity);
  const selectedNode = useModelStore((state) => state.getSelectedNode());
  const selectedMember = useModelStore((state) => state.getSelectedMember());
  const selectedLoadCase = useModelStore((state) => state.getSelectedLoadCase());
  const selectedLoad = useModelStore((state) => state.getSelectedLoad());
  const selectedRestraint = useModelStore((state) => state.getSelectedRestraint());
  const selectedRestraintNode = useModelStore((state) => state.getSelectedRestraintNode());
  const validationReport = useModelStore((state) => state.validationReport);
  const selectedEntityLabel = getSelectedEntityLabel(selectedEntity);
  const errorCount = validationReport.errors.length;
  const warningCount = validationReport.warnings.length;
  const validationChipColor = errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'success';
  const validationChipLabel = errorCount > 0
    ? `${errorCount} errors${warningCount > 0 ? ` / ${warningCount} warnings` : ''}`
    : warningCount > 0
      ? `${warningCount} warnings`
      : 'Valid';

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
    ? model.loadCases.flatMap((loadCase) =>
        loadCase.loads
          .filter((load) => load.type === 'nodal_concentrated' && load.target.nodeId === selectedNode.id)
          .map((load) => ({ loadCaseName: loadCase.name, load }))
      )
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
  const selectedMemberLoads = selectedMember
    ? model.loadCases.flatMap((loadCase) =>
        loadCase.loads
          .filter((load) => load.type === 'member_distributed' && load.target.memberId === selectedMember.id)
          .map((load) => ({ loadCaseName: loadCase.name, load }))
      )
    : [];

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
      <Stack spacing={1} sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="overline" color="text.secondary">
          Properties
        </Typography>
        <Typography variant="h6">{selectedEntityLabel ?? 'Model Summary'}</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            size="small"
            color={validationChipColor}
            label={validationChipLabel}
            variant="outlined"
          />
          <Chip size="small" label={`Units: ${model.units.length}/${model.units.force}`} variant="outlined" />
        </Box>
      </Stack>

      <Stack sx={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', p: 2 }} spacing={2}>
        {selectedEntity.type == null && (
          <>
            <PropertySection title="Model">
              <PropertyRow label="Name" value={model.name} />
              <PropertyRow label="Schema" value={model.schemaVersion} />
              <PropertyRow label="Vertical axis" value={model.settings.verticalAxis} />
              <PropertyRow label="Node merge tolerance" value={`${model.settings.nodeMergeToleranceMm} mm`} />
              <PropertyRow
                label="Center on XY"
                value={model.settings.centerModelByXYProjection ? 'Enabled' : 'Disabled'}
              />
            </PropertySection>

            <PropertySection title="Inventory">
              <PropertyRow label="Nodes" value={`${model.nodes.length}`} />
              <PropertyRow label="Members" value={`${model.members.length}`} />
              <PropertyRow label="Profiles" value={`${model.profiles.length}`} />
              <PropertyRow label="Materials" value={`${model.materials.length}`} />
              <PropertyRow label="Restraints" value={`${model.restraints.length}`} />
              <PropertyRow label="Load cases" value={`${model.loadCases.length}`} />
            </PropertySection>

            <PropertySection title="Load Environment">
              <PropertyRow label="Default load case" value={model.loadCases[0]?.name ?? '-'} />
              <PropertyRow label="Wind direction" value={formatVector(model.loadCases[0]?.wind.direction)} />
              <PropertyRow
                label="Wind pressure"
                value={`${formatNumber(model.loadCases[0]?.wind.nominalPressureKPa, 3)} kPa`}
              />
            </PropertySection>

            <PropertySection title="Validation">
              {validationReport.issues.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No issues found. Model topology is ready for further UI work.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {validationReport.errors.length > 0 && (
                    <ValidationIssueGroup title="Errors" issues={validationReport.errors} />
                  )}
                  {validationReport.warnings.length > 0 && (
                    <ValidationIssueGroup title="Warnings" issues={validationReport.warnings} />
                  )}
                </Stack>
              )}
            </PropertySection>
          </>
        )}

        {selectedNode && (
          <>
            <PropertySection title="Node">
              <PropertyRow label="Label" value={selectedNode.label ?? selectedNode.id} />
              <PropertyRow label="Position" value={formatVector(selectedNode.position)} />
              <PropertyRow label="Comment" value={formatOptionalText(selectedNode.comment)} />
              <PropertyRow label="Layer" value={formatOptionalText(selectedNode.source?.layer)} />
              <PropertyRow label="DXF handle" value={formatOptionalText(selectedNode.source?.handle)} />
            </PropertySection>

            <PropertySection title="Restraint">
              {selectedNodeRestraint ? (
                <>
                  <PropertyRow label="Id" value={selectedNodeRestraint.id} />
                  <PropertyRow label="UX" value={formatRestraintState(selectedNodeRestraint.ux)} />
                  <PropertyRow label="UY" value={formatRestraintState(selectedNodeRestraint.uy)} />
                  <PropertyRow label="UZ" value={formatRestraintState(selectedNodeRestraint.uz)} />
                  <PropertyRow label="RX" value={formatRestraintState(selectedNodeRestraint.rx)} />
                  <PropertyRow label="RY" value={formatRestraintState(selectedNodeRestraint.ry)} />
                  <PropertyRow label="RZ" value={formatRestraintState(selectedNodeRestraint.rz)} />
                  <PropertyRow label="Comment" value={formatOptionalText(selectedNodeRestraint.comment)} />
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No restraint assigned.
                </Typography>
              )}
            </PropertySection>

            <PropertySection title="Loads">
              {selectedNodeLoads.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No node loads assigned.
                </Typography>
              ) : (
                <Stack spacing={1.25}>
                  {selectedNodeLoads.map(({ loadCaseName, load }) => (
                    <Box key={load.id}>
                      <Typography variant="subtitle2">{load.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {loadCaseName}
                      </Typography>
                      <LoadDetails load={load} units={model.units} />
                    </Box>
                  ))}
                </Stack>
              )}
            </PropertySection>
          </>
        )}

        {selectedMember && (
          <>
            <PropertySection title="Member">
              <PropertyRow label="Start node" value={memberStartNode?.label ?? selectedMember.startNodeId} />
              <PropertyRow label="End node" value={memberEndNode?.label ?? selectedMember.endNodeId} />
              <PropertyRow label="Profile" value={memberProfile?.name ?? selectedMember.profileId} />
              <PropertyRow label="Material" value={memberMaterial?.name ?? selectedMember.materialId} />
              <PropertyRow
                label="Local X rotation"
                value={`${formatNumber(selectedMember.localAxisRotationDeg ?? memberProfile?.defaultLocalAxisRotationDeg ?? 0)} deg`}
              />
              <PropertyRow
                label="Offset Y"
                value={`${formatNumber(selectedMember.offsetYmm ?? memberProfile?.defaultOffsetYmm ?? 0)} mm`}
              />
              <PropertyRow
                label="Offset Z"
                value={`${formatNumber(selectedMember.offsetZmm ?? memberProfile?.defaultOffsetZmm ?? 0)} mm`}
              />
              <PropertyRow label="Comment" value={formatOptionalText(selectedMember.comment)} />
            </PropertySection>

            <PropertySection title="DXF Source">
              <PropertyRow label="Layer" value={formatOptionalText(selectedMember.source?.layer)} />
              <PropertyRow label="Entity type" value={formatOptionalText(selectedMember.source?.entityType)} />
              <PropertyRow label="Color" value={formatOptionalText(selectedMember.source?.color)} />
              <PropertyRow label="Color index" value={formatOptionalText(selectedMember.source?.colorIndex)} />
              <PropertyRow label="True color" value={formatOptionalText(selectedMember.source?.trueColor)} />
              <PropertyRow label="Handle" value={formatOptionalText(selectedMember.source?.handle)} />
            </PropertySection>

            <PropertySection title="Member Loads">
              {selectedMemberLoads.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No member loads assigned.
                </Typography>
              ) : (
                <Stack spacing={1.25}>
                  {selectedMemberLoads.map(({ loadCaseName, load }) => (
                    <Box key={load.id}>
                      <Typography variant="subtitle2">{load.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {loadCaseName}
                      </Typography>
                      <LoadDetails load={load} units={model.units} />
                    </Box>
                  ))}
                </Stack>
              )}
            </PropertySection>
          </>
        )}

        {selectedProfile && (
          <>
            <PropertySection title="Profile">
              <PropertyRow label="Name" value={selectedProfile.name} />
              <PropertyRow label="Kind" value={selectedProfile.kind} />
              <PropertyRow label="Comment" value={formatOptionalText(selectedProfile.comment)} />
              <PropertyRow label="Mass" value={`${formatNumber(selectedProfile.massKgPerM, 3)} kg/m`} />
              <PropertyRow
                label="Default rotation"
                value={`${formatNumber(selectedProfile.defaultLocalAxisRotationDeg)} deg`}
              />
              <PropertyRow label="Default offset Y" value={`${formatNumber(selectedProfile.defaultOffsetYmm)} mm`} />
              <PropertyRow label="Default offset Z" value={`${formatNumber(selectedProfile.defaultOffsetZmm)} mm`} />
            </PropertySection>

            <PropertySection title="Section Properties">
              <PropertyRow label="Area" value={`${formatNumber(selectedProfile.section.areaMm2)} mm2`} />
              <PropertyRow label="Iy" value={`${formatNumber(selectedProfile.section.IyMm4)} mm4`} />
              <PropertyRow label="Iz" value={`${formatNumber(selectedProfile.section.IzMm4)} mm4`} />
              <PropertyRow label="Jx" value={`${formatNumber(selectedProfile.section.JxMm4)} mm4`} />
              <PropertyRow label="Wy" value={`${formatNumber(selectedProfile.section.WyMm3)} mm3`} />
              <PropertyRow label="Wz" value={`${formatNumber(selectedProfile.section.WzMm3)} mm3`} />
              <PropertyRow label="Wx" value={`${formatNumber(selectedProfile.section.WxMm3)} mm3`} />
            </PropertySection>

            <PropertySection title="Params">
              <Stack spacing={0.5}>
                {Object.entries(selectedProfile.params).map(([key, value]) => (
                  <PropertyRow key={key} label={key} value={`${formatNumber(value)} mm`} />
                ))}
              </Stack>
            </PropertySection>
          </>
        )}

        {selectedMaterial && (
          <PropertySection title="Material">
            <PropertyRow label="Name" value={selectedMaterial.name} />
            <PropertyRow label="Comment" value={formatOptionalText(selectedMaterial.comment)} />
            <PropertyRow label="E" value={`${formatNumber(selectedMaterial.elasticModulusMPa)} MPa`} />
            <PropertyRow label="G" value={`${formatNumber(selectedMaterial.shearModulusMPa)} MPa`} />
            <PropertyRow label="Poisson" value={formatNumber(selectedMaterial.poissonRatio, 3)} />
            <PropertyRow label="Density" value={`${formatNumber(selectedMaterial.densityKgPerM3)} kg/m3`} />
            <PropertyRow label="Yield" value={`${formatNumber(selectedMaterial.yieldStrengthMPa)} MPa`} />
          </PropertySection>
        )}

        {selectedEntity.type === 'loadCase' && selectedLoadCase && (
          <>
            <PropertySection title="Load Case">
              <PropertyRow label="Name" value={selectedLoadCase.name} />
              <PropertyRow label="Comment" value={formatOptionalText(selectedLoadCase.comment)} />
              <PropertyRow label="Loads count" value={`${selectedLoadCase.loads.length}`} />
              <PropertyRow label="Wind direction" value={formatVector(selectedLoadCase.wind.direction)} />
              <PropertyRow
                label="Nominal pressure"
                value={`${formatNumber(selectedLoadCase.wind.nominalPressureKPa, 3)} kPa`}
              />
            </PropertySection>

            <PropertySection title="Loads">
              {selectedLoadCase.loads.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No loads assigned.
                </Typography>
              ) : (
                <Stack spacing={1.25}>
                  {selectedLoadCase.loads.map((load) => (
                    <Box key={load.id}>
                      <Typography variant="subtitle2">{load.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatLoadTarget(load)}
                      </Typography>
                      <LoadDetails load={load} units={model.units} />
                    </Box>
                  ))}
                </Stack>
              )}
            </PropertySection>
          </>
        )}

        {selectedEntity.type === 'load' && selectedLoad && selectedLoadCase && (
          <>
            <PropertySection title="Load">
              <PropertyRow label="Name" value={selectedLoad.name} />
              <PropertyRow label="Id" value={selectedLoad.id} />
              <PropertyRow label="Load case" value={selectedLoadCase.name} />
              <PropertyRow label="Target" value={formatLoadTarget(selectedLoad)} />
              <PropertyRow label="Comment" value={formatOptionalText(selectedLoad.comment)} />
            </PropertySection>

            <PropertySection title="Load Details">
              <LoadDetails load={selectedLoad} units={model.units} />
            </PropertySection>
          </>
        )}

        {selectedEntity.type === 'restraint' && selectedRestraint && (
          <>
            <PropertySection title="Restraint">
              <PropertyRow label="Id" value={selectedRestraint.id} />
              <PropertyRow label="Node" value={selectedRestraintNode?.label ?? selectedRestraint.nodeId} />
              <PropertyRow label="Comment" value={formatOptionalText(selectedRestraint.comment)} />
              <PropertyRow label="UX" value={formatRestraintState(selectedRestraint.ux)} />
              <PropertyRow label="UY" value={formatRestraintState(selectedRestraint.uy)} />
              <PropertyRow label="UZ" value={formatRestraintState(selectedRestraint.uz)} />
              <PropertyRow label="RX" value={formatRestraintState(selectedRestraint.rx)} />
              <PropertyRow label="RY" value={formatRestraintState(selectedRestraint.ry)} />
              <PropertyRow label="RZ" value={formatRestraintState(selectedRestraint.rz)} />
            </PropertySection>

            <PropertySection title="Associated Node">
              <PropertyRow label="Node id" value={selectedRestraint.nodeId} />
              <PropertyRow
                label="Position"
                value={selectedRestraintNode ? formatVector(selectedRestraintNode.position) : '-'}
              />
              <PropertyRow
                label="Node comment"
                value={formatOptionalText(selectedRestraintNode?.comment)}
              />
            </PropertySection>
          </>
        )}
      </Stack>
    </Paper>
  );
}

interface PropertySectionProps {
  title: string;
  children: ReactNode;
}

function PropertySection({ title, children }: PropertySectionProps) {
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">{title}</Typography>
      <Divider />
      <Stack spacing={1}>{children}</Stack>
    </Stack>
  );
}

interface PropertyRowProps {
  label: string;
  value: string;
}

function PropertyRow({ label, value }: PropertyRowProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 132px) minmax(0, 1fr)',
        gap: 1,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}

interface ValidationIssueGroupProps {
  title: string;
  issues: Array<{
    code: string;
    message: string;
    entityType?: string;
    entityId?: string;
  }>;
}

function ValidationIssueGroup({ title, issues }: ValidationIssueGroupProps) {
  return (
    <Stack spacing={0.75}>
      <Typography variant="subtitle2">{title}</Typography>
      {issues.map((issue) => (
        <Box key={`${title}-${issue.code}-${issue.entityId ?? issue.message}`}>
          <Typography variant="body2">{issue.message}</Typography>
          <Typography variant="caption" color="text.secondary">
            {issue.entityType ? `${issue.code} | ${issue.entityType}` : issue.code}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}

interface LoadDetailsProps {
  load: Load;
  units: UnitSystem;
}

function LoadDetails({ load, units }: LoadDetailsProps) {
  if (load.type === 'nodal_concentrated') {
    const resolved = resolveConcentratedLoadVector(load);
    const vector = load.kind === 'force' ? resolved.force : resolved.moment;

    return (
      <>
        <PropertyRow label="Type" value="Nodal concentrated" />
        <PropertyRow label="Kind" value={load.kind} />
        <PropertyRow label="Magnitude" value={`${formatNumber(load.magnitude, 3)} ${getLoadUnits(load, units)}`} />
        <PropertyRow label="Direction" value={formatVector(load.direction, 3)} />
        <PropertyRow label="Resolved vector" value={formatVector(vector, 3)} />
        <PropertyRow label="Coordinate system" value={load.coordinateSystem} />
        <PropertyRow label="Comment" value={formatOptionalText(load.comment)} />
      </>
    );
  }

  if (load.distribution.type === 'linear') {
    const resolved = resolveDistributedLoadVectors(load);
    const xStartRel = load.distribution.xStartRel ?? 0;
    const xEndRel = load.distribution.xEndRel ?? 1;

    return (
      <>
        <PropertyRow label="Type" value="Member distributed" />
        <PropertyRow label="Kind" value={load.kind} />
        <PropertyRow label="Direction" value={formatVector(load.direction, 3)} />
        <PropertyRow
          label="qStart"
          value={`${formatNumber(load.distribution.qStart, 3)} ${getLoadUnits(load, units)}`}
        />
        <PropertyRow
          label="qEnd"
          value={`${formatNumber(load.distribution.qEnd, 3)} ${getLoadUnits(load, units)}`}
        />
        <PropertyRow label="Range" value={`${formatNumber(xStartRel, 3)} .. ${formatNumber(xEndRel, 3)} rel`} />
        <PropertyRow label="Start vector" value={formatVector(resolved.start, 3)} />
        <PropertyRow label="End vector" value={formatVector(resolved.end, 3)} />
        <PropertyRow label="Coordinate system" value={load.coordinateSystem} />
        <PropertyRow label="Comment" value={formatOptionalText(load.comment)} />
      </>
    );
  }

  return (
    <>
      <PropertyRow label="Type" value="Member distributed" />
      <PropertyRow label="Kind" value={load.kind} />
      <PropertyRow label="Direction" value={formatVector(load.direction, 3)} />
      <PropertyRow label="Distribution" value="Function placeholder" />
      <PropertyRow label="Expression" value={load.distribution.expression} />
      <PropertyRow label="Coordinate system" value={load.coordinateSystem} />
      <PropertyRow label="Comment" value={formatOptionalText(load.comment)} />
    </>
  );
}

function formatLoadTarget(load: Load): string {
  return load.type === 'nodal_concentrated'
    ? `Node ${load.target.nodeId}`
    : `Member ${load.target.memberId}`;
}
