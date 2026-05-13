import type { ReactNode } from 'react';

import { Box, Paper, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Line, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Color } from 'three';

import { calculateBoundingBox } from '../../entities/model';
import { findProfileById } from '../../entities/section';
import { useI18n } from '../../shared/i18n';
import { SceneAxes } from '../../widgets/viewport-3d/SceneAxes';
import { SceneGrid } from '../../widgets/viewport-3d/SceneGrid';
import {
  getSceneBoundingRadius,
  modelPositionToScene,
  scaleModelLengthMm,
  type ScenePoint3,
} from '../../widgets/viewport-3d/modelToScene';
import type { DxfImportPreview, DxfPreviewColorMode } from './types';

const DIAGNOSTIC_COLORS = {
  ok: '#58b77d',
  warning: '#d1a64b',
  error: '#d76464',
} as const;

const FALLBACK_PROFILE_COLOR = '#aeb7bf';
const SHORT_LINE_MARKER_RADIUS = 0.04;

interface DxfPreviewSceneProps {
  preview: DxfImportPreview | null;
  colorMode: DxfPreviewColorMode;
  onColorModeChange: (mode: DxfPreviewColorMode) => void;
  isBusy?: boolean;
}

export function DxfPreviewScene({
  preview,
  colorMode,
  onColorModeChange,
  isBusy = false,
}: DxfPreviewSceneProps) {
  const { t } = useI18n();

  return (
    <StackedPreviewPaper>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
          px: 2,
          pt: 2,
        }}
      >
        <Typography variant="subtitle2">{t('dxf.preview.sceneTitle')}</Typography>

        <ToggleButtonGroup
          size="small"
          exclusive
          value={colorMode}
          onChange={(_event, value) => {
            if (value === 'diagnostics' || value === 'profiles') {
              onColorModeChange(value);
            }
          }}
          aria-label={t('dxf.preview.colorModeAria')}
        >
          <ToggleButton value="diagnostics" aria-label={t('dxf.preview.modeDiagnostics')}>
            {t('dxf.preview.modeDiagnostics')}
          </ToggleButton>
          <ToggleButton value="profiles" aria-label={t('dxf.preview.modeProfiles')}>
            {t('dxf.preview.modeProfiles')}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ p: 2, pt: 1.5 }}>
        <PreviewSceneViewport preview={preview} colorMode={colorMode} isBusy={isBusy} />
      </Box>
    </StackedPreviewPaper>
  );
}

function PreviewSceneViewport({
  preview,
  colorMode,
  isBusy,
}: {
  preview: DxfImportPreview | null;
  colorMode: DxfPreviewColorMode;
  isBusy: boolean;
}) {
  const theme = useTheme();
  const { t } = useI18n();

  if (isBusy) {
    return <PreviewScenePlaceholder title={t('dxf.preview.preparingTitle')} body={t('dxf.preview.scenePreparing')} />;
  }

  if (preview == null || preview.diagnostics.lines.length === 0) {
    return <PreviewScenePlaceholder title={t('dxf.preview.sceneTitle')} body={t('dxf.preview.sceneEmptyHint')} />;
  }

  const lineEntries = preview.diagnostics.lines;
  const profileColorByGroupKey = new Map(
    preview.colorGroups.map((group) => [
      group.key,
      group.profileId == null ? undefined : findProfileById(group.profileId)?.color,
    ] as const),
  );
  const sceneBounds = calculateBoundingBox(lineEntries.flatMap((line) => [line.start, line.end]));
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

  return (
    <Paper
      variant="outlined"
      sx={{
        height: 360,
        overflow: 'hidden',
        borderRadius: 1.5,
      }}
    >
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
          const assignedProfileColor = line.groupKey == null ? undefined : profileColorByGroupKey.get(line.groupKey);
          const color = colorMode === 'diagnostics'
            ? DIAGNOSTIC_COLORS[line.status]
            : assignedProfileColor ?? line.displayColor ?? FALLBACK_PROFILE_COLOR;
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
    </Paper>
  );
}

function PreviewScenePlaceholder({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        height: 360,
        borderStyle: 'dashed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="subtitle2">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {body}
        </Typography>
      </Box>
    </Paper>
  );
}

function StackedPreviewPaper({ children }: { children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      {children}
    </Paper>
  );
}

function getSceneLineLength(start: ScenePoint3, end: ScenePoint3): number {
  return Math.hypot(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
}
