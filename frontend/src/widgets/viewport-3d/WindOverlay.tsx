import { Suspense } from 'react';

import { GizmoHelper, Text } from '@react-three/drei';
import { Quaternion, Vector3 } from 'three';

import type { WindLoadDefinition } from '../../entities/model';
import { useI18n } from '../../shared/i18n';
import { formatNumber } from '../../shared/utils/format';
import { SCENE_LABEL_FONT_SIZE } from './SceneUprightLabel';

interface WindOverlayProps {
  wind: WindLoadDefinition | undefined;
}

const WIND_COLOR = '#2080ff';
const WIND_EPSILON = 1e-9;
const WIND_GIZMO_SCALE = 40;
const SHAFT_LENGTH = 0.76;
const SHAFT_RADIUS = 0.05;
const HEAD_LENGTH = 0.24;
const HEAD_RADIUS = 0.14;
const PIVOT_RADIUS = HEAD_RADIUS;
const PRESSURE_LABEL_FONT_SIZE = SCENE_LABEL_FONT_SIZE * 3;
const ARROW_UP = new Vector3(0, 1, 0);

export function WindOverlay({ wind }: WindOverlayProps) {
  const { t } = useI18n();

  if (wind == null) {
    return null;
  }

  const direction = new Vector3(
    wind.direction.x,
    wind.direction.y,
    wind.direction.z,
  );

  if (direction.lengthSq() <= WIND_EPSILON) {
    return null;
  }

  direction.normalize();
  const pressureLabel = Number.isFinite(wind.nominalPressurePa)
    ? `${formatNumber(wind.nominalPressurePa, 0)} ${t('wind.dialog.pressureUnit')}`
    : null;

  return (
    <GizmoHelper alignment="top-right" margin={[88, 88]} renderPriority={2}>
      <WindArrow direction={direction} pressureLabel={pressureLabel} />
    </GizmoHelper>
  );
}

function WindArrow({
  direction,
  pressureLabel,
}: {
  direction: Vector3;
  pressureLabel: string | null;
}) {
  const quaternion = new Quaternion().setFromUnitVectors(ARROW_UP, direction);
  const projectedDirection = new Vector3(direction.x, direction.y, 0);
  const pressureDirection = projectedDirection.lengthSq() <= WIND_EPSILON
    ? new Vector3(0, 1, 0)
    : projectedDirection.normalize();
  const pressureLabelRotationZ = Math.atan2(-pressureDirection.x, pressureDirection.y)
    + Math.PI
    + Math.PI / 2;
  const pressureLabelPosition: [number, number, number] = [
    pressureDirection.x * (SHAFT_LENGTH + HEAD_LENGTH),
    pressureDirection.y * (SHAFT_LENGTH + HEAD_LENGTH),
    -(PRESSURE_LABEL_FONT_SIZE * 1.3),
  ];

  return (
    <group scale={WIND_GIZMO_SCALE}>
      <group quaternion={quaternion}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[PIVOT_RADIUS, 18, 18]} />
          <meshBasicMaterial color={WIND_COLOR} toneMapped={false} />
        </mesh>

        <mesh position={[0, SHAFT_LENGTH / 2, 0]}>
          <cylinderGeometry args={[SHAFT_RADIUS, SHAFT_RADIUS, SHAFT_LENGTH, 18]} />
          <meshBasicMaterial color={WIND_COLOR} toneMapped={false} />
        </mesh>

        <mesh position={[0, -SHAFT_LENGTH / 2, 0]}>
          <cylinderGeometry args={[SHAFT_RADIUS, SHAFT_RADIUS, SHAFT_LENGTH, 18]} />
          <meshBasicMaterial color={WIND_COLOR} toneMapped={false} />
        </mesh>

        <mesh position={[0, SHAFT_LENGTH + HEAD_LENGTH / 2, 0]}>
          <coneGeometry args={[HEAD_RADIUS, HEAD_LENGTH, 18]} />
          <meshBasicMaterial color={WIND_COLOR} toneMapped={false} />
        </mesh>
      </group>

      {pressureLabel && (
        <group position={pressureLabelPosition} rotation={[0, 0, pressureLabelRotationZ]}>
          <Suspense fallback={null}>
            <Text
              rotation={[Math.PI / 2, 0, 0]}
              fontSize={PRESSURE_LABEL_FONT_SIZE}
              color={WIND_COLOR}
              anchorX="left"
              anchorY="middle"
            >
              {pressureLabel}
            </Text>
          </Suspense>
        </group>
      )}
    </group>
  );
}
