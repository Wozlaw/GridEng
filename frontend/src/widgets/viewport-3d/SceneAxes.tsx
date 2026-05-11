import { Suspense } from 'react';

import { GizmoHelper, GizmoViewport, Text } from '@react-three/drei';

interface SceneAxesProps {
  size?: number;
}

export function SceneAxes({ size = 2000 }: SceneAxesProps) {
  const axisLabelOffset = Math.max(size * 0.12, 0.24);
  const axisLabelFontSize = Math.max(size * 0.16, 0.22);

  return (
    <>
      <axesHelper args={[size]} />

      <Suspense fallback={null}>
        <group>
          <Text
            position={[size + axisLabelOffset, 0, 0]}
            fontSize={axisLabelFontSize}
            color="#ff7a7a"
            anchorX="center"
            anchorY="middle"
          >
            X
          </Text>
          <Text
            position={[0, size + axisLabelOffset, 0]}
            fontSize={axisLabelFontSize}
            color="#63d9b6"
            anchorX="center"
            anchorY="middle"
          >
            Y
          </Text>
          <Text
            position={[0, 0, size + axisLabelOffset]}
            fontSize={axisLabelFontSize}
            color="#89d3ff"
            anchorX="center"
            anchorY="middle"
          >
            Z
          </Text>
        </group>
      </Suspense>

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
