import type { ReactNode } from 'react';

import {
  Box,
  Chip,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import { useModelStore } from '../../app/store';
import { isSelectedEntity } from '../../features/selection';

export function ProjectTreePanel() {
  const model = useModelStore((state) => state.model);
  const selectedEntity = useModelStore((state) => state.selectedEntity);
  const selectEntity = useModelStore((state) => state.selectEntity);

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
          Project Tree
        </Typography>
        <Typography variant="h6">Model Structure</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip size="small" label={`${model.nodes.length} nodes`} variant="outlined" />
          <Chip size="small" label={`${model.members.length} members`} variant="outlined" />
          <Chip size="small" label={`${model.profiles.length} profiles`} variant="outlined" />
        </Box>
      </Stack>

      <Stack sx={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
        <ProjectSection title="Profiles" count={model.profiles.length}>
          <List disablePadding dense>
            {model.profiles.map((profile) => (
              <ListItemButton
                key={profile.id}
                selected={isSelectedEntity(selectedEntity, 'profile', profile.id)}
                onClick={() => selectEntity({ type: 'profile', id: profile.id })}
              >
                <ListItemText primary={profile.name} secondary={`${profile.kind} | ${profile.id}`} />
              </ListItemButton>
            ))}
          </List>
        </ProjectSection>

        <Divider />

        <ProjectSection title="Materials" count={model.materials.length}>
          <List disablePadding dense>
            {model.materials.map((material) => (
              <ListItemButton
                key={material.id}
                selected={isSelectedEntity(selectedEntity, 'material', material.id)}
                onClick={() => selectEntity({ type: 'material', id: material.id })}
              >
                <ListItemText primary={material.name} secondary={material.id} />
              </ListItemButton>
            ))}
          </List>
        </ProjectSection>

        <Divider />

        <ProjectSection title="Load Cases" count={model.loadCases.length}>
          <List disablePadding dense>
            {model.loadCases.map((loadCase) => (
              <ListItemButton
                key={loadCase.id}
                selected={isSelectedEntity(selectedEntity, 'loadCase', loadCase.id)}
                onClick={() => selectEntity({ type: 'loadCase', id: loadCase.id })}
              >
                <ListItemText primary={loadCase.name} secondary={`${loadCase.loads.length} loads`} />
              </ListItemButton>
            ))}
          </List>
        </ProjectSection>

        <Divider />

        <ProjectSection title="Members" count={model.members.length}>
          <List disablePadding dense>
            {model.members.map((member) => (
              <ListItemButton
                key={member.id}
                selected={isSelectedEntity(selectedEntity, 'member', member.id)}
                onClick={() => selectEntity({ type: 'member', id: member.id })}
              >
                <ListItemText primary={member.id} secondary={`${member.startNodeId} -> ${member.endNodeId}`} />
              </ListItemButton>
            ))}
          </List>
        </ProjectSection>

        <Divider />

        <ProjectSection title="Nodes" count={model.nodes.length}>
          <List disablePadding dense>
            {model.nodes.map((node) => (
              <ListItemButton
                key={node.id}
                selected={isSelectedEntity(selectedEntity, 'node', node.id)}
                onClick={() => selectEntity({ type: 'node', id: node.id })}
              >
                <ListItemText
                  primary={node.label ?? node.id}
                  secondary={`${node.position.x}, ${node.position.y}, ${node.position.z}`}
                />
              </ListItemButton>
            ))}
          </List>
        </ProjectSection>
      </Stack>
    </Paper>
  );
}

interface ProjectSectionProps {
  title: string;
  count: number;
  children: ReactNode;
}

function ProjectSection({ title, count, children }: ProjectSectionProps) {
  return (
    <Stack spacing={0.5} sx={{ px: 1.25, py: 1.25 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2">{title}</Typography>
        <Typography variant="caption" color="text.secondary">
          {count}
        </Typography>
      </Box>
      {children}
    </Stack>
  );
}
