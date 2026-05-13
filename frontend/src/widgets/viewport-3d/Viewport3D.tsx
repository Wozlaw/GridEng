import type { RefObject } from 'react';
import { useEffect, useMemo, useRef } from 'react';

import { Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { Color, PerspectiveCamera, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { useModelStore } from '../../app/store';
import type { GridEngModel } from '../../entities/model';
import { useI18n } from '../../shared/i18n';
import { notifyWarning } from '../../shared/ui';
import { MemberLines } from './MemberLines';
import { MemberRealMeshes } from './MemberRealMeshes';
import { LoadVectors } from './LoadVectors';
import { MomentVectors } from './MomentVectors';
import { NodePoints } from './NodePoints';
import { RestraintMarkers } from './RestraintMarkers';
import { SceneAxes } from './SceneAxes';
import { SceneGrid } from './SceneGrid';
import { StressMapLegend } from './StressMapLegend';
import { WindOverlay } from './WindOverlay';
import {
  getFitCameraDistance,
  getViewportSceneMetrics,
  type ViewportSceneMetrics,
} from './modelToScene';
import { getMemberStressColor, resolveStressMapState } from './stressMap';

const DEFAULT_CAMERA_DIRECTION = new Vector3(1, -1, 0.82).normalize();

export function Viewport3D() {
  const { t } = useI18n();
  const theme = useTheme();
  const model = useModelStore((state) => state.model);
  const activeLoadCaseId = useModelStore((state) => state.activeLoadCaseId);
  const viewMode = useModelStore((state) => state.viewMode);
  const visibility = useModelStore((state) => state.visibility);
  const fitRequestNonce = useModelStore((state) => state.fitRequestNonce);
  const clearSelection = useModelStore((state) => state.clearSelection);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const stressMapNotificationKeyRef = useRef<string | null>(null);

  const sceneMetrics = useMemo(() => getViewportSceneMetrics(model.nodes), [model.nodes]);
  const activeLoadCase = useMemo(
    () => model.loadCases.find((loadCase) => loadCase.id === activeLoadCaseId) ?? model.loadCases[0],
    [activeLoadCaseId, model.loadCases],
  );
  const activeStressMapState = useMemo(
    () => (activeLoadCase == null ? null : resolveStressMapState(model.results, activeLoadCase.id)),
    [activeLoadCase, model.results],
  );
  const isStressMapMode = viewMode === 'stress-map';
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
  const resolveStressMemberColor = useMemo(
    () => (
      !isStressMapMode
        ? undefined
        : (member: GridEngModel['members'][number]) => getMemberStressColor(member, activeStressMapState) ?? undefined
    ),
    [activeStressMapState, isStressMapMode],
  );
  const sceneBackgroundColor = theme.palette.background.default;
  const secondaryLightColor = theme.palette.mode === 'dark' ? '#b8c0c7' : '#7f8a93';

  useEffect(() => {
    if (!isStressMapMode) {
      stressMapNotificationKeyRef.current = null;
      return;
    }

    if (activeStressMapState != null) {
      stressMapNotificationKeyRef.current = 'has-results';
      return;
    }

    const loadCaseKey = activeLoadCase?.id ?? '__no-load-case__';

    if (stressMapNotificationKeyRef.current === loadCaseKey) {
      return;
    }

    stressMapNotificationKeyRef.current = loadCaseKey;

    notifyWarning({
      title: t('notifications.stressMap.noResults.title'),
      details: [
        t('notifications.stressMap.noResults.detail', {
          loadCase: activeLoadCase?.name ?? activeLoadCase?.id ?? t('common.none'),
        }),
      ],
    });
  }, [activeLoadCase?.id, activeLoadCase?.name, activeStressMapState, isStressMapMode, t]);

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
          scene.background = new Color(sceneBackgroundColor);
        }}
        onPointerMissed={() => clearSelection()}
      >
        <ViewportSceneBackground backgroundColor={sceneBackgroundColor} />
        <ViewportFitController
          controlsRef={controlsRef}
          fitRequestNonce={fitRequestNonce}
          sceneMetrics={sceneMetrics}
        />
        <ambientLight intensity={0.65} />
        <directionalLight position={[1, -1, 2]} intensity={1.2} />
        <directionalLight position={[-1, 1, 0.5]} intensity={0.4} color={secondaryLightColor} />

        {visibility.grid && <SceneGrid size={sceneMetrics.sceneGridSize} />}
        <SceneAxes size={sceneMetrics.sceneAxesSize} visible={visibility.axes} />
        <WindOverlay wind={activeLoadCase?.wind} />

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
          visible={visibility.members && viewMode !== 'real' && viewMode !== 'stress-map'}
          pickRadius={Math.max(sceneMetrics.sceneNodeRadius * 1.35, sceneMetrics.sceneLongestSide * 0.012)}
        />
        <MemberRealMeshes
          members={model.members}
          nodesById={nodeById}
          profilesById={profilesById}
          visible={visibility.members && (viewMode === 'real' || viewMode === 'stress-map')}
          pickRadius={Math.max(sceneMetrics.sceneNodeRadius * 1.35, sceneMetrics.sceneLongestSide * 0.012)}
          resolveMemberColor={resolveStressMemberColor}
        />
        <NodePoints
          nodes={model.nodes}
          nodeRadius={sceneMetrics.sceneNodeRadius}
          visible={visibility.nodes && viewMode !== 'real' && viewMode !== 'stress-map'}
        />
        <RestraintMarkers
          restraints={model.restraints}
          nodesById={nodeById}
          sceneCenter={sceneMetrics.sceneCenter}
          visible={visibility.restraints}
          showLabels={visibility.labels}
          nodeRadius={sceneMetrics.sceneNodeRadius}
        />
        <LoadVectors
          loadCase={activeLoadCase}
          nodesById={nodeById}
          membersById={membersById}
          visible={visibility.loads}
          showLabels={visibility.labels}
          units={model.units}
          sceneLongestSide={sceneMetrics.sceneLongestSide}
        />
        <MomentVectors
          loadCase={activeLoadCase}
          nodesById={nodeById}
          membersById={membersById}
          visible={visibility.loads && visibility.moments}
          showLabels={visibility.labels}
          units={model.units}
          sceneLongestSide={sceneMetrics.sceneLongestSide}
        />
      </Canvas>
      {isStressMapMode && activeStressMapState != null && (
        <StressMapLegend
          visible
          metricKind={activeStressMapState.range.kind}
          min={activeStressMapState.range.min}
          max={activeStressMapState.range.max}
        />
      )}
    </Paper>
  );
}

function ViewportSceneBackground({ backgroundColor }: { backgroundColor: string }) {
  return <color attach="background" args={[backgroundColor]} />;
}

interface ViewportFitControllerProps {
  controlsRef: RefObject<OrbitControlsImpl | null>;
  fitRequestNonce: number;
  sceneMetrics: ViewportSceneMetrics;
}

function ViewportFitController({
  controlsRef,
  fitRequestNonce,
  sceneMetrics,
}: ViewportFitControllerProps) {
  const size = useThree((state) => state.size);
  const lastAppliedFitNonceRef = useRef<number>(fitRequestNonce);

  useEffect(() => {
    if (fitRequestNonce === lastAppliedFitNonceRef.current) {
      return;
    }

    lastAppliedFitNonceRef.current = fitRequestNonce;

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
  }, [controlsRef, fitRequestNonce, sceneMetrics, size.height, size.width]);

  return null;
}
