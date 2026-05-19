import type { ReactNode } from 'react';

import {
  Box,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Line, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Color } from 'three';

import { useI18n } from '../../shared/i18n';
import { SceneAxes } from '../../widgets/viewport-3d/SceneAxes';
import { SceneGrid } from '../../widgets/viewport-3d/SceneGrid';
import {
  getSceneBoundingRadius,
  modelPositionToScene,
  scaleModelLengthMm,
  type ScenePoint3,
} from '../../widgets/viewport-3d/modelToScene';
import { resolveDxfGroupDisplayColor } from './dxfColors';
import type { DxfGroupDisplayColors, DxfImportPreview, DxfPreviewColorMode } from './types';
import type { DxfPreviewDisplayState } from './previewTransform';

const DIAGNOSTIC_COLORS = {
  ok: '#58b77d',
  info: '#58b77d',
  warning: '#d1a64b',
  error: '#d76464',
} as const;

const FALLBACK_PROFILE_COLOR = '#aeb7bf';
const SHORT_LINE_MARKER_RADIUS = 0.04;

interface DxfPreviewSceneProps {
  preview: DxfImportPreview | null;
  displayState: DxfPreviewDisplayState | null;
  colorMode: DxfPreviewColorMode;
  isBusy?: boolean;
  fullHeight?: boolean;
  hideTitle?: boolean;
  groupDisplayColors?: DxfGroupDisplayColors;
  assignedCatalogProfileColors?: Partial<Record<string, string>>;
}

export function DxfPreviewScene({
  preview,
  displayState,
  colorMode,
  isBusy = false,
  fullHeight = false,
  hideTitle = false,
  groupDisplayColors = {},
  assignedCatalogProfileColors = {},
}: DxfPreviewSceneProps) {
  const { t } = useI18n();

  return (
    <PreviewSceneRoot fullHeight={fullHeight}>
      {!hideTitle ? (
        <Box sx={{ px: 1.5, pt: 1, pb: 0.75 }}>
          <Typography variant="subtitle2">{t('dxf.preview.sceneTitle')}</Typography>
        </Box>
      ) : null}

      <Box sx={{ flex: '1 1 auto', minHeight: 0, m: 0, p: 0 }}>
        <PreviewSceneViewport
          preview={preview}
          displayState={displayState}
          colorMode={colorMode}
          isBusy={isBusy}
          viewportHeight={fullHeight ? '100%' : 360}
          groupDisplayColors={groupDisplayColors}
          assignedCatalogProfileColors={assignedCatalogProfileColors}
        />
      </Box>
    </PreviewSceneRoot>
  );
}

function PreviewSceneViewport({
  preview,
  displayState,
  colorMode,
  isBusy,
  viewportHeight,
  groupDisplayColors,
  assignedCatalogProfileColors,
}: {
  preview: DxfImportPreview | null;
  displayState: DxfPreviewDisplayState | null;
  colorMode: DxfPreviewColorMode;
  isBusy: boolean;
  viewportHeight: number | string;
  groupDisplayColors: DxfGroupDisplayColors;
  assignedCatalogProfileColors: Partial<Record<string, string>>;
}) {
  const theme = useTheme();
  const { t } = useI18n();

  if (isBusy) {
    return (
      <ViewportFrame height={viewportHeight}>
        <PreviewScenePlaceholder body={t('dxf.preview.scenePreparing')} />
      </ViewportFrame>
    );
  }

  if (preview == null || preview.diagnostics.lines.length === 0 || displayState == null) {
    return (
      <ViewportFrame height={viewportHeight}>
        <PreviewScenePlaceholder body={t('dxf.preview.sceneEmptyHint')} />
      </ViewportFrame>
    );
  }

  const lineEntries = displayState.lines;
  const sceneBounds = displayState.bounds;
  const sceneCenter: ScenePoint3 = sceneBounds ? modelPositionToScene(sceneBounds.center) : [0, 0, 0];
  const sceneBoundingRadius = sceneBounds ? getSceneBoundingRadius(sceneBounds) : 1.5;
  const sceneLongestSide = Math.max(
    scaleModelLengthMm(
      Math.max(sceneBounds?.size.x ?? 3000, sceneBounds?.size.y ?? 3000, sceneBounds?.size.z ?? 3000),
    ),
    3,
  );
  const sceneGridSize = Math.max(sceneLongestSide * 3.2, 12);
  const sceneAxesSize = Math.max(sceneLongestSide * 0.8, 1.8);
  const sceneCameraDistance = Math.max(sceneBoundingRadius * 2.8, sceneLongestSide * 1.9, 5.7);
  const sceneFarPlane = Math.max(sceneLongestSide * 60, 200);
  const backgroundColor = theme.palette.background.default;
  const secondaryLightColor = theme.palette.mode === 'dark' ? '#b8c0c7' : '#7f8a93';
  const groupBaseColors = new Map(
    (preview.colorGroups ?? []).map((group) => [group.key, resolveDxfGroupDisplayColor(group)] as const),
  );

  return (
    <ViewportFrame height={viewportHeight}>
      <Canvas
        camera={{
          position: [
            sceneCenter[0] + sceneCameraDistance,
            sceneCenter[1] - sceneCameraDistance,
            sceneCenter[2] + sceneCameraDistance * 0.82,
          ],
          fov: 34,
          near: 0.01,
          far: sceneFarPlane,
        }}
        gl={{ antialias: true }}
        onCreated={({ camera, scene }) => {
          camera.up.set(0, 0, 1);
          camera.lookAt(sceneCenter[0], sceneCenter[1], sceneCenter[2]);
          scene.background = new Color(backgroundColor);
        }}
      >
        <color attach="background" args={[backgroundColor]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[1, -1, 2]} intensity={1.15} />
        <directionalLight position={[-1, 1, 0.5]} intensity={0.4} color={secondaryLightColor} />

        <SceneGrid size={sceneGridSize} />
        <SceneAxes size={sceneAxesSize} />

        <OrbitControls makeDefault target={sceneCenter} maxPolarAngle={Math.PI / 2.02} />

        {lineEntries.map((line) => {
          const overriddenGroupColor = line.groupKey == null ? undefined : groupDisplayColors[line.groupKey];
          const groupBaseColor = line.groupKey == null ? undefined : groupBaseColors.get(line.groupKey);
          const assignedProfileColor = line.groupKey == null
            ? undefined
            : assignedCatalogProfileColors[line.groupKey];
          const color = colorMode === 'diagnostics'
            ? DIAGNOSTIC_COLORS[line.status]
            : overriddenGroupColor
              ?? groupBaseColor
              ?? line.displayColor
              ?? assignedProfileColor
              ?? FALLBACK_PROFILE_COLOR;
          const start = modelPositionToScene(line.start);
          const end = modelPositionToScene(line.end);
          const length = getSceneLineLength(start, end);

          if (length <= 1e-6) {
            const midpoint: ScenePoint3 = [
              (start[0] + end[0]) / 2,
              (start[1] + end[1]) / 2,
              (start[2] + end[2]) / 2,
            ];

            return (
              <mesh key={`marker-${line.lineIndex}`} position={midpoint}>
                <sphereGeometry args={[SHORT_LINE_MARKER_RADIUS, 18, 18]} />
                <meshStandardMaterial color={color} />
              </mesh>
            );
          }

          return (
            <Line
              key={`line-${line.lineIndex}`}
              points={[start, end]}
              color={color}
              lineWidth={2.8}
            />
          );
        })}
      </Canvas>
    </ViewportFrame>
  );
}

function PreviewScenePlaceholder({ body }: { body: string }) {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
        {body}
      </Typography>
    </Box>
  );
}

function PreviewSceneRoot({
  children,
  fullHeight,
}: {
  children: ReactNode;
  fullHeight: boolean;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        height: fullHeight ? '100%' : 'auto',
        m: 0,
        p: 0,
      }}
    >
      {children}
    </Box>
  );
}

function ViewportFrame({
  children,
  height,
}: {
  children: ReactNode;
  height: number | string;
}) {
  return (
    <Box
      sx={{
        width: '100%',
        height,
        minHeight: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        m: 0,
        p: 0,
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          m: 0,
          p: 0,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

function getSceneLineLength(start: ScenePoint3, end: ScenePoint3): number {
  return Math.hypot(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
}
