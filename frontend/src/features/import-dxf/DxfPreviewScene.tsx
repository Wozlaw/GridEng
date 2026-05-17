import type { ReactNode } from 'react';

import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {
  Box,
  IconButton,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
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
import type { DxfGroupDisplayColors, DxfImportPreview, DxfPreviewColorMode } from './types';
import type { DxfPreviewDisplayState, DxfPreviewRotationDeg } from './previewTransform';

const DIAGNOSTIC_COLORS = {
  ok: '#58b77d',
  warning: '#d1a64b',
  error: '#d76464',
} as const;

const FALLBACK_PROFILE_COLOR = '#aeb7bf';
const SHORT_LINE_MARKER_RADIUS = 0.04;

interface DxfPreviewSceneProps {
  preview: DxfImportPreview | null;
  displayState: DxfPreviewDisplayState | null;
  colorMode: DxfPreviewColorMode;
  onColorModeChange: (mode: DxfPreviewColorMode) => void;
  rotationDeg: DxfPreviewRotationDeg;
  onRotationChange: (rotationDeg: DxfPreviewRotationDeg) => void;
  onResetRotation: () => void;
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
  onColorModeChange,
  rotationDeg,
  onRotationChange,
  onResetRotation,
  isBusy = false,
  fullHeight = false,
  hideTitle = false,
  groupDisplayColors = {},
  assignedCatalogProfileColors = {},
}: DxfPreviewSceneProps) {
  const { t } = useI18n();

  return (
    <StackedPreviewPaper fullHeight={fullHeight}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: hideTitle ? '1fr' : { xs: '1fr', md: 'auto 1fr' },
          gap: 1,
          px: 1.5,
          pt: 1.5,
          pb: 0.5,
          alignItems: 'start',
        }}
      >
        {!hideTitle ? <Typography variant="subtitle2">{t('dxf.preview.sceneTitle')}</Typography> : null}

        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={1}
          sx={{
            alignItems: { xs: 'stretch', lg: 'center' },
            justifyContent: 'space-between',
          }}
        >
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

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }} useFlexGap>
            <RotationNumberField
              axis="X"
              value={rotationDeg.x}
              tooltip={t('dxf.preview.rotateX')}
              onChange={(value) => onRotationChange({ ...rotationDeg, x: value })}
            />
            <RotationNumberField
              axis="Y"
              value={rotationDeg.y}
              tooltip={t('dxf.preview.rotateY')}
              onChange={(value) => onRotationChange({ ...rotationDeg, y: value })}
            />
            <RotationNumberField
              axis="Z"
              value={rotationDeg.z}
              tooltip={t('dxf.preview.rotateZ')}
              onChange={(value) => onRotationChange({ ...rotationDeg, z: value })}
            />

            <Tooltip title={t('dxf.preview.resetRotation')}>
              <span>
                <IconButton
                  aria-label={t('dxf.preview.resetRotation')}
                  size="small"
                  onClick={onResetRotation}
                >
                  <RestartAltIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, pt: 0.5, minHeight: 0, flex: '1 1 auto' }}>
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
    </StackedPreviewPaper>
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
      <PreviewScenePlaceholder
        title={t('dxf.preview.preparingTitle')}
        body={t('dxf.preview.scenePreparing')}
        height={viewportHeight}
      />
    );
  }

  if (preview == null || preview.diagnostics.lines.length === 0) {
    return (
      <PreviewScenePlaceholder
        title={t('dxf.preview.sceneTitle')}
        body={t('dxf.preview.sceneEmptyHint')}
        height={viewportHeight}
      />
    );
  }

  if (displayState == null) {
    return (
      <PreviewScenePlaceholder
        title={t('dxf.preview.sceneTitle')}
        body={t('dxf.preview.sceneEmptyHint')}
        height={viewportHeight}
      />
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

  return (
    <Paper
      variant="outlined"
      sx={{
        height: viewportHeight,
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
          const assignedProfileColor = line.groupKey == null
            ? undefined
            : assignedCatalogProfileColors[line.groupKey];
          const overriddenGroupColor = line.groupKey == null ? undefined : groupDisplayColors[line.groupKey];
          const color = colorMode === 'diagnostics'
            ? DIAGNOSTIC_COLORS[line.status]
            : overriddenGroupColor ?? assignedProfileColor ?? line.displayColor ?? FALLBACK_PROFILE_COLOR;
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

function RotationNumberField({
  axis,
  value,
  tooltip,
  onChange,
}: {
  axis: 'X' | 'Y' | 'Z';
  value: number;
  tooltip: string;
  onChange: (value: number) => void;
}) {
  return (
    <Tooltip title={tooltip}>
      <TextField
        size="small"
        type="number"
        label={`${axis}°`}
        value={value}
        onChange={(event) => {
          const nextValue = Number(event.target.value);
          onChange(Number.isFinite(nextValue) ? nextValue : 0);
        }}
        slotProps={{
          htmlInput: {
            'aria-label': tooltip,
            step: 90,
          },
        }}
        sx={{ width: 86 }}
      />
    </Tooltip>
  );
}

function PreviewScenePlaceholder({
  title,
  body,
  height,
}: {
  title: string;
  body: string;
  height: number | string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        height,
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

function StackedPreviewPaper({
  children,
  fullHeight,
}: {
  children: ReactNode;
  fullHeight: boolean;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        height: fullHeight ? '100%' : 'auto',
      }}
    >
      {children}
    </Paper>
  );
}

function getSceneLineLength(start: ScenePoint3, end: ScenePoint3): number {
  return Math.hypot(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
}
