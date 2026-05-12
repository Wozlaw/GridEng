import { Suspense, useState } from 'react';

import { Line, Text } from '@react-three/drei';

import { useModelStore } from '../../app/store';
import type { GridEngModel, Restraint } from '../../entities/model';
import { modelPositionToScene, type ScenePoint3 } from './modelToScene';

const RESTRAINT_COLOR = '#7fd6ff';
const SELECTED_RESTRAINT_COLOR = '#f4bf61';
const HOVER_RESTRAINT_COLOR = '#d4efff';
const LABEL_OFFSET_FACTOR = 1.5;

interface RestraintMarkersProps {
  restraints: GridEngModel['restraints'];
  nodesById: Map<string, GridEngModel['nodes'][number]>;
  visible: boolean;
  nodeRadius: number;
}

export function RestraintMarkers({
  restraints,
  nodesById,
  visible,
  nodeRadius,
}: RestraintMarkersProps) {
  const selectedEntity = useModelStore((state) => state.selectedEntity);

  if (!visible || restraints.length === 0) {
    return null;
  }

  return (
    <>
      {restraints.map((restraint) => {
        const node = nodesById.get(restraint.nodeId);

        if (node == null) {
          return null;
        }

        const isSelected = (selectedEntity.type === 'restraint' && selectedEntity.restraintId === restraint.id)
          || (selectedEntity.type === 'node' && selectedEntity.id === restraint.nodeId);

        return (
          <RestraintMarkerGroup
            key={restraint.id}
            restraint={restraint}
            nodePosition={modelPositionToScene(node.position)}
            nodeRadius={nodeRadius}
            isSelected={isSelected}
          />
        );
      })}
    </>
  );
}

interface RestraintMarkerGroupProps {
  restraint: Restraint;
  nodePosition: ScenePoint3;
  nodeRadius: number;
  isSelected: boolean;
}

function RestraintMarkerGroup({
  restraint,
  nodePosition,
  nodeRadius,
  isSelected,
}: RestraintMarkerGroupProps) {
  const selectRestraint = useModelStore((state) => state.selectRestraint);
  const [isHovered, setIsHovered] = useState(false);

  const markerSize = Math.max(nodeRadius * 3.1, 0.12);
  const basePosition: ScenePoint3 = [
    nodePosition[0],
    nodePosition[1],
    nodePosition[2] - markerSize * 0.9,
  ];
  const translationalHalf = markerSize * 0.34;
  const ringRadius = markerSize * 0.26;
  const color = isSelected
    ? SELECTED_RESTRAINT_COLOR
    : isHovered
      ? HOVER_RESTRAINT_COLOR
      : RESTRAINT_COLOR;
  const activeDofsLabel = formatActiveRestraintLabel(restraint);
  const showLabel = isSelected || isHovered;
  const labelPosition: ScenePoint3 = [
    nodePosition[0],
    nodePosition[1],
    nodePosition[2] + markerSize * LABEL_OFFSET_FACTOR,
  ];
  const rotationMarkers = buildRotationMarkers(basePosition, ringRadius);

  return (
    <group
      onClick={(event) => {
        event.stopPropagation();
        selectRestraint(restraint.id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setIsHovered(true);
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        setIsHovered(false);
      }}
    >
      <mesh position={basePosition}>
        <sphereGeometry args={[markerSize * 0.8, 12, 12]} />
        <meshBasicMaterial transparent opacity={0.01} depthWrite={false} />
      </mesh>

      <Line points={[nodePosition, basePosition]} color={color} lineWidth={2.2} />

      {restraint.ux && (
        <Line
          points={[
            [basePosition[0] - translationalHalf, basePosition[1], basePosition[2]],
            [basePosition[0] + translationalHalf, basePosition[1], basePosition[2]],
          ]}
          color={color}
          lineWidth={2.4}
        />
      )}
      {restraint.uy && (
        <Line
          points={[
            [basePosition[0], basePosition[1] - translationalHalf, basePosition[2]],
            [basePosition[0], basePosition[1] + translationalHalf, basePosition[2]],
          ]}
          color={color}
          lineWidth={2.4}
        />
      )}
      {restraint.uz && (
        <Line
          points={[
            [basePosition[0], basePosition[1], basePosition[2] - translationalHalf],
            [basePosition[0], basePosition[1], basePosition[2] + translationalHalf],
          ]}
          color={color}
          lineWidth={2.4}
        />
      )}

      {restraint.rx && <Line points={rotationMarkers.rx} color={color} lineWidth={2.1} />}
      {restraint.ry && <Line points={rotationMarkers.ry} color={color} lineWidth={2.1} />}
      {restraint.rz && <Line points={rotationMarkers.rz} color={color} lineWidth={2.1} />}

      {showLabel && (
        <Suspense fallback={null}>
          <Text
            position={labelPosition}
            fontSize={Math.max(markerSize * 0.28, 0.08)}
            color={color}
            anchorX="center"
            anchorY="middle"
          >
            {activeDofsLabel}
          </Text>
        </Suspense>
      )}
    </group>
  );
}

function buildRotationMarkers(
  basePosition: ScenePoint3,
  radius: number,
): Record<'rx' | 'ry' | 'rz', ScenePoint3[]> {
  return {
    rx: createCirclePoints(basePosition, radius, 'yz'),
    ry: createCirclePoints(basePosition, radius, 'xz'),
    rz: createCirclePoints(basePosition, radius, 'xy'),
  };
}

function createCirclePoints(
  center: ScenePoint3,
  radius: number,
  plane: 'xy' | 'yz' | 'xz',
  segments = 24,
): ScenePoint3[] {
  const points: ScenePoint3[] = [];

  for (let step = 0; step <= segments; step += 1) {
    const angle = (Math.PI * 2 * step) / segments;
    const cos = Math.cos(angle) * radius;
    const sin = Math.sin(angle) * radius;

    switch (plane) {
      case 'xy':
        points.push([center[0] + cos, center[1] + sin, center[2]]);
        break;
      case 'yz':
        points.push([center[0], center[1] + cos, center[2] + sin]);
        break;
      case 'xz':
        points.push([center[0] + cos, center[1], center[2] + sin]);
        break;
      default:
        break;
    }
  }

  return points;
}

function formatActiveRestraintLabel(restraint: Restraint): string {
  const active = [
    restraint.ux && 'UX',
    restraint.uy && 'UY',
    restraint.uz && 'UZ',
    restraint.rx && 'RX',
    restraint.ry && 'RY',
    restraint.rz && 'RZ',
  ].filter(Boolean);

  return active.length > 0 ? active.join(' ') : 'FREE';
}
