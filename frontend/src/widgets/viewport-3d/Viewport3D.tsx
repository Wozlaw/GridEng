import type { RefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { Color, PerspectiveCamera, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { useModelStore } from '../../app/store';
import { MemberLines } from './MemberLines';
import { LoadVectors } from './LoadVectors';
import { MomentVectors } from './MomentVectors';
import { NodePoints } from './NodePoints';
import { RestraintMarkers } from './RestraintMarkers';
import { SceneAxes } from './SceneAxes';
import { SceneGrid } from './SceneGrid';
import {
  getFitCameraDistance,
  getViewportSceneMetrics,
  type ViewportSceneMetrics,
} from './modelToScene';

const DEFAULT_CAMERA_DIRECTION = new Vector3(1, -1, 0.82).normalize();

export function Viewport3D() {
  const model = useModelStore((state) => state.model);
  const viewMode = useModelStore((state) => state.viewMode);
  const visibility = useModelStore((state) => state.visibility);
  const clearSelection = useModelStore((state) => state.clearSelection);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [fitRequestVersion, setFitRequestVersion] = useState(0);

  const sceneMetrics = useMemo(() => getViewportSceneMetrics(model.nodes), [model.nodes]);
  const modelCenter = sceneMetrics.modelBounds?.center ?? { x: 0, y: 0, z: 0 };
  const activeLoadCase = model.loadCases[0];
  const nodeById = useMemo(
    () => new Map(model.nodes.map((node) => [node.id, node] as const)),
    [model.nodes],
  );
  const membersById = useMemo(
    () => new Map(model.members.map((member) => [member.id, member] as const)),
    [model.members],
  );
  const profilesById = useMemo(
    () => new Map(model.profiles.map((profile) => [profile.id, profile] as const)),
    [model.profiles],
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        position: 'relative',
        minHeight: 0,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Canvas
        camera={{
          position: [
            sceneMetrics.sceneCenter[0] + sceneMetrics.sceneCameraDistance,
            sceneMetrics.sceneCenter[1] - sceneMetrics.sceneCameraDistance,
            sceneMetrics.sceneCenter[2] + sceneMetrics.sceneCameraDistance * 0.82,
          ],
          fov: 34,
          near: 0.01,
          far: sceneMetrics.sceneFarPlane,
        }}
        gl={{ antialias: true }}
        onCreated={({ camera, scene }) => {
          camera.up.set(0, 0, 1);
          camera.lookAt(
            sceneMetrics.sceneCenter[0],
            sceneMetrics.sceneCenter[1],
            sceneMetrics.sceneCenter[2],
          );
          scene.background = new Color('#071019');
        }}
        onPointerMissed={() => clearSelection()}
      >
        <ViewportFitController
          controlsRef={controlsRef}
          fitRequestVersion={fitRequestVersion}
          sceneMetrics={sceneMetrics}
        />
        <ambientLight intensity={0.65} />
        <directionalLight position={[1, -1, 2]} intensity={1.4} />
        <directionalLight position={[-1, 1, 0.5]} intensity={0.5} color="#7ecce5" />
        <SceneGrid size={sceneMetrics.sceneGridSize} />
        <SceneAxes size={sceneMetrics.sceneAxesSize} />
        <OrbitControls
          ref={controlsRef}
          makeDefault
          target={sceneMetrics.sceneCenter}
          maxPolarAngle={Math.PI / 2.02}
        />

        <MemberLines
          members={model.members}
          nodesById={nodeById}
          profilesById={profilesById}
          visible={visibility.members}
        />
        <NodePoints
          nodes={model.nodes}
          nodeRadius={sceneMetrics.sceneNodeRadius}
          visible={visibility.nodes}
        />
        <RestraintMarkers
          restraints={model.restraints}
          nodesById={nodeById}
          visible={visibility.restraints}
          nodeRadius={sceneMetrics.sceneNodeRadius}
        />
        <LoadVectors
          loadCase={activeLoadCase}
          nodesById={nodeById}
          membersById={membersById}
          visible={visibility.loads}
          sceneLongestSide={sceneMetrics.sceneLongestSide}
        />
        <MomentVectors
          loadCase={activeLoadCase}
          nodesById={nodeById}
          membersById={membersById}
          visible={visibility.moments}
          sceneLongestSide={sceneMetrics.sceneLongestSide}
        />
      </Canvas>

      <Stack
        spacing={1}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          maxWidth: 360,
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            px: 1.5,
            py: 1.25,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'rgba(8, 12, 18, 0.74)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Typography variant="overline" color="text.secondary">
            Viewport
          </Typography>
          <Typography variant="subtitle1">Z-up scene scaffold</Typography>
          <Typography variant="body2" color="text.secondary">
            Current mode: {viewMode}. Loads, moments, and restraints use the canonical model state.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip size="small" label={`Center: ${Math.round(modelCenter.x)}, ${Math.round(modelCenter.y)}, ${Math.round(modelCenter.z)}`} />
          <Chip size="small" label={`Span: ${Math.round(sceneMetrics.modelLongestSideMm)} mm`} />
          <Chip size="small" label="Scale: 0.001" />
          <Chip size="small" label="Axis: Z up" />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, pointerEvents: 'auto' }}>
          <Button
            size="small"
            variant="contained"
            disabled={sceneMetrics.modelBounds == null}
            onClick={() => {
              setFitRequestVersion((version) => version + 1);
            }}
          >
            Fit
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}

interface ViewportFitControllerProps {
  controlsRef: RefObject<OrbitControlsImpl | null>;
  fitRequestVersion: number;
  sceneMetrics: ViewportSceneMetrics;
}

function ViewportFitController({
  controlsRef,
  fitRequestVersion,
  sceneMetrics,
}: ViewportFitControllerProps) {
  const size = useThree((state) => state.size);

  useEffect(() => {
    const controls = controlsRef.current;

    if (!sceneMetrics.modelBounds || !controls) {
      return;
    }

    const camera = controls.object;
    if (!(camera instanceof PerspectiveCamera)) {
      return;
    }

    const aspectRatio = size.height > 0 ? size.width / size.height : 1;
    const fitDistance = getFitCameraDistance(
      sceneMetrics.sceneBoundingRadius,
      camera.fov,
      aspectRatio,
    );

    if (fitDistance <= 0) {
      return;
    }

    const target = new Vector3(...sceneMetrics.sceneCenter);
    const nextPosition = target.clone().addScaledVector(DEFAULT_CAMERA_DIRECTION, fitDistance);

    camera.position.copy(nextPosition);
    camera.near = 0.01;
    camera.far = Math.max(sceneMetrics.sceneFarPlane, fitDistance * 20);
    camera.lookAt(target);
    camera.updateProjectionMatrix();

    controls.target.copy(target);
    controls.update();
  }, [
    controlsRef,
    fitRequestVersion,
    sceneMetrics,
    size.height,
    size.width,
  ]);

  return null;
}
