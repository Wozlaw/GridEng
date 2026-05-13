import { GizmoHelper, GizmoViewport } from '@react-three/drei';

import { SCENE_LABEL_FONT_SIZE, SceneUprightLabel } from './SceneUprightLabel';

interface SceneAxesProps {
  size?: number;
}

export function SceneAxes({ size = 2000 }: SceneAxesProps) {
  const axisLabelOffset = Math.max(size * 0.06, 0.12);

  return (
    <>
      <axesHelper args={[size]} />

      <group>
        <SceneUprightLabel
          position={[size + axisLabelOffset, 0, 0]}
          text="X"
          color="#ff7a7a"
          fontSize={SCENE_LABEL_FONT_SIZE}
        />
        <SceneUprightLabel
          position={[0, size + axisLabelOffset, 0]}
          text="Y"
          color="#63d9b6"
          fontSize={SCENE_LABEL_FONT_SIZE}
        />
        <SceneUprightLabel
          position={[0, 0, size + axisLabelOffset]}
          text="Z"
          color="#89d3ff"
          fontSize={SCENE_LABEL_FONT_SIZE}
        />
      </group>

      <GizmoHelper alignment="bottom-right" margin={[88, 88]}>
        <GizmoViewport
          axisColors={['#ff7a7a', '#63d9b6', '#89d3ff']}
          labelColor="#f4f7fb"
          axisHeadScale={1}
        />
      </GizmoHelper>
    </>
  );
}
