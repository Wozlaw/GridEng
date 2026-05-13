import { useTheme } from '@mui/material/styles';
import { GizmoHelper, GizmoViewport } from '@react-three/drei';

import { SCENE_LABEL_FONT_SIZE, SceneUprightLabel } from './SceneUprightLabel';

interface SceneAxesProps {
  size?: number;
  visible?: boolean;
}

export function SceneAxes({ size = 2000, visible = true }: SceneAxesProps) {
  const theme = useTheme();
  const axisLabelOffset = Math.max(size * 0.06, 0.12);
  const isDark = theme.palette.mode === 'dark';
  const axisXColor = isDark ? '#ff7a7a' : '#b84b4b';
  const axisYColor = isDark ? '#63d9b6' : '#2d8f72';
  const axisZColor = isDark ? '#89d3ff' : '#356f99';
  const gizmoLabelColor = isDark ? '#f4f7fb' : '#1f252b';

  return (
    <>
      {visible && <axesHelper args={[size]} />}

      {visible && (
        <group>
          <SceneUprightLabel
            position={[size + axisLabelOffset, 0, 0]}
            text="X"
            color={axisXColor}
            fontSize={SCENE_LABEL_FONT_SIZE}
          />
          <SceneUprightLabel
            position={[0, size + axisLabelOffset, 0]}
            text="Y"
            color={axisYColor}
            fontSize={SCENE_LABEL_FONT_SIZE}
          />
          <SceneUprightLabel
            position={[0, 0, size + axisLabelOffset]}
            text="Z"
            color={axisZColor}
            fontSize={SCENE_LABEL_FONT_SIZE}
          />
        </group>
      )}

      <GizmoHelper alignment="bottom-right" margin={[88, 88]}>
        {visible && (
          <GizmoViewport
            axisColors={[axisXColor, axisYColor, axisZColor]}
            labelColor={gizmoLabelColor}
            axisHeadScale={1}
          />
        )}
      </GizmoHelper>
    </>
  );
}
