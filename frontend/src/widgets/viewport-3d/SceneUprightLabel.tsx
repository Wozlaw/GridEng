import { Suspense, useRef } from 'react';

import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

import type { ScenePoint3 } from './modelToScene';

export const SCENE_LABEL_FONT_SIZE = 0.16;

interface SceneUprightLabelProps {
  position: ScenePoint3;
  text: string;
  color: string;
  fontSize?: number;
}

export function SceneUprightLabel({
  position,
  text,
  color,
  fontSize = SCENE_LABEL_FONT_SIZE,
}: SceneUprightLabelProps) {
  const groupRef = useRef<Group | null>(null);

  useFrame(({ camera }) => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    const dx = camera.position.x - position[0];
    const dy = camera.position.y - position[1];
    const horizontalLength = Math.hypot(dx, dy);

    if (horizontalLength <= 1e-8) {
      return;
    }

    group.rotation.set(0, 0, Math.atan2(-dx, dy) + Math.PI);
  });

  return (
    <group ref={groupRef} position={position}>
      <Suspense fallback={null}>
        <Text
          rotation={[Math.PI / 2, 0, 0]}
          fontSize={fontSize}
          color={color}
          anchorX="center"
          anchorY="middle"
        >
          {text}
        </Text>
      </Suspense>
    </group>
  );
}
