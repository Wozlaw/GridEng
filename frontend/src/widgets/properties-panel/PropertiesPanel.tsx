import { Box, Chip, Paper, Stack, Typography } from '@mui/material';

import { useModelStore } from '../../app/store';
import { formatSelectedEntityLabel, useI18n } from '../../shared/i18n';
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

export function PropertiesPanel() {
  const { t } = useI18n();
  const model = useModelStore((state) => state.model);
  const selectedEntity = useModelStore((state) => state.selectedEntity);
  const selectedNode = useModelStore((state) => state.getSelectedNode());
  const selectedMember = useModelStore((state) => state.getSelectedMember());
  const selectedLoadCase = useModelStore((state) => state.getSelectedLoadCase());
  const selectedLoad = useModelStore((state) => state.getSelectedLoad());
  const selectedRestraint = useModelStore((state) => state.getSelectedRestraint());
  const selectedRestraintNode = useModelStore((state) => state.getSelectedRestraintNode());
  const validationReport = useModelStore((state) => state.validationReport);
  const selectedEntityLabel = formatSelectedEntityLabel(selectedEntity, t);

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

  const errorCount = validationReport.errors.length;
  const warningCount = validationReport.warnings.length;
  const validationChipColor = errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'success';
  const validationChipLabel = errorCount > 0
    ? t('topMenu.validation.errorsWarnings', {
      errors: errorCount,
      warnings: warningCount,
    })
    : warningCount > 0
      ? t('topMenu.validation.warnings', { count: warningCount })
      : t('properties.validation.valid');

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
        <Typography variant="h6" align="center">
          {t('properties.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          {selectedEntityLabel ?? t('properties.modelSummary')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Chip
            size="small"
            color={validationChipColor}
            label={validationChipLabel}
            variant="outlined"
          />
          <Chip
            size="small"
            label={`${t('common.units')}: ${model.units.length}/${model.units.force}`}
            variant="outlined"
          />
        </Box>
      </Stack>

      <Stack sx={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', p: 2 }} spacing={2}>
        {selectedEntity.type == null && (
          <ModelSummarySection
            model={model}
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
            memberLoads={selectedMemberLoads}
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
      </Stack>
    </Paper>
  );
}
