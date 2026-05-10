import type { ReactNode } from 'react';

import {
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import { useModelStore } from '../../app/store';
import { formatNumber, formatOptionalText, formatRestraintState, formatVector } from '../../shared/utils';

export function PropertiesPanel() {
  const model = useModelStore((state) => state.model);
  const selectedEntity = useModelStore((state) => state.selectedEntity);
  const validationReport = useModelStore((state) => state.validationReport);
  const errorCount = validationReport.errors.length;
  const warningCount = validationReport.warnings.length;
  const validationChipColor = errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'success';
  const validationChipLabel = errorCount > 0
    ? `${errorCount} errors${warningCount > 0 ? ` / ${warningCount} warnings` : ''}`
    : warningCount > 0
      ? `${warningCount} warnings`
      : 'Valid';

  const selectedNode = selectedEntity.type === 'node'
    ? model.nodes.find((node) => node.id === selectedEntity.id)
    : undefined;
  const selectedMember = selectedEntity.type === 'member'
    ? model.members.find((member) => member.id === selectedEntity.id)
    : undefined;
  const selectedProfile = selectedEntity.type === 'profile'
    ? model.profiles.find((profile) => profile.id === selectedEntity.id)
    : undefined;
  const selectedMaterial = selectedEntity.type === 'material'
    ? model.materials.find((material) => material.id === selectedEntity.id)
    : undefined;
  const selectedLoadCase = selectedEntity.type === 'loadCase'
    ? model.loadCases.find((loadCase) => loadCase.id === selectedEntity.id)
    : undefined;

  const selectedNodeRestraint = selectedNode
    ? model.restraints.find((restraint) => restraint.nodeId === selectedNode.id)
    : undefined;
  const selectedNodeLoads = selectedNode
    ? model.loadCases.flatMap((loadCase) =>
        loadCase.loads
          .filter((load) => load.target.type === 'node' && load.target.nodeId === selectedNode.id)
          .map((load) => ({ loadCaseName: loadCase.name, load })),
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
        <Typography variant="h6">
          {selectedEntity.type ? `${selectedEntity.type} ${selectedEntity.id}` : 'Model Summary'}
        </Typography>
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

      <Stack sx={{ minHeight: 0, overflowY: 'auto', p: 2 }} spacing={2}>
        {!selectedEntity.type && (
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
              <PropertyRow label="Layer" value={formatOptionalText(selectedNode.source?.layer)} />
              <PropertyRow label="DXF handle" value={formatOptionalText(selectedNode.source?.handle)} />
            </PropertySection>

            <PropertySection title="Restraint">
              {selectedNodeRestraint ? (
                <>
                  <PropertyRow label="UX" value={formatRestraintState(selectedNodeRestraint.ux)} />
                  <PropertyRow label="UY" value={formatRestraintState(selectedNodeRestraint.uy)} />
                  <PropertyRow label="UZ" value={formatRestraintState(selectedNodeRestraint.uz)} />
                  <PropertyRow label="RX" value={formatRestraintState(selectedNodeRestraint.rx)} />
                  <PropertyRow label="RY" value={formatRestraintState(selectedNodeRestraint.ry)} />
                  <PropertyRow label="RZ" value={formatRestraintState(selectedNodeRestraint.rz)} />
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
                      <Typography variant="subtitle2">{load.description ?? load.id}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {loadCaseName}
                      </Typography>
                      <PropertyRow label="Force" value={formatVector(load.vector.force)} />
                      <PropertyRow label="Moment" value={formatVector(load.vector.moment)} />
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
            </PropertySection>

            <PropertySection title="DXF Source">
              <PropertyRow label="Layer" value={formatOptionalText(selectedMember.source?.layer)} />
              <PropertyRow label="Entity type" value={formatOptionalText(selectedMember.source?.entityType)} />
              <PropertyRow label="Color" value={formatOptionalText(selectedMember.source?.color)} />
              <PropertyRow label="Color index" value={formatOptionalText(selectedMember.source?.colorIndex)} />
              <PropertyRow label="True color" value={formatOptionalText(selectedMember.source?.trueColor)} />
              <PropertyRow label="Handle" value={formatOptionalText(selectedMember.source?.handle)} />
            </PropertySection>
          </>
        )}

        {selectedProfile && (
          <>
            <PropertySection title="Profile">
              <PropertyRow label="Name" value={selectedProfile.name} />
              <PropertyRow label="Kind" value={selectedProfile.kind} />
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
            <PropertyRow label="E" value={`${formatNumber(selectedMaterial.elasticModulusMPa)} MPa`} />
            <PropertyRow label="G" value={`${formatNumber(selectedMaterial.shearModulusMPa)} MPa`} />
            <PropertyRow label="Poisson" value={formatNumber(selectedMaterial.poissonRatio, 3)} />
            <PropertyRow label="Density" value={`${formatNumber(selectedMaterial.densityKgPerM3)} kg/m3`} />
            <PropertyRow label="Yield" value={`${formatNumber(selectedMaterial.yieldStrengthMPa)} MPa`} />
          </PropertySection>
        )}

        {selectedLoadCase && (
          <>
            <PropertySection title="Load Case">
              <PropertyRow label="Name" value={selectedLoadCase.name} />
              <PropertyRow label="Loads count" value={`${selectedLoadCase.loads.length}`} />
              <PropertyRow label="Wind direction" value={formatVector(selectedLoadCase.wind.direction)} />
              <PropertyRow
                label="Nominal pressure"
                value={`${formatNumber(selectedLoadCase.wind.nominalPressureKPa, 3)} kPa`}
              />
            </PropertySection>

            <PropertySection title="Loads">
              <Stack spacing={1.25}>
                {selectedLoadCase.loads.map((load) => (
                  <Box key={load.id}>
                    <Typography variant="subtitle2">{load.description ?? load.id}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {load.target.type === 'node'
                        ? `Node ${load.target.nodeId}`
                        : `Member ${load.target.memberId}`}
                    </Typography>
                    <PropertyRow label="Force" value={formatVector(load.vector.force)} />
                    <PropertyRow label="Moment" value={formatVector(load.vector.moment)} />
                  </Box>
                ))}
              </Stack>
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
