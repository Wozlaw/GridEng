import { useMemo, useState } from 'react';

import { Line } from '@react-three/drei';
import { amber, blue, cyan, red } from '@mui/material/colors';
import { Quaternion, Vector3 } from 'three';

import { useModelStore } from '../../app/store';
import type { GridEngModel, Restraint } from '../../entities/model';
import { isSelectedEntity, isSelectedRestraint } from '../../features/selection';
import { modelPositionToScene, type ScenePoint3 } from './modelToScene';
import { SCENE_LABEL_FONT_SIZE, SceneUprightLabel } from './SceneUprightLabel';

const SELECTED_RESTRAINT_COLOR = amber[300];
const HOVER_RESTRAINT_COLOR = amber[200];
const AXIS_COLORS = {
  X: red[300],
  Y: cyan[300],
  Z: blue[300],
} as const;
const CYLINDER_UP = new Vector3(0, 1, 0);

type RestraintAxisLabel = 'X' | 'Y' | 'Z';
type RestraintAxisMode = 'cube' | 'sphere' | 'cylinder';

interface RestraintMarkersProps {
  restraints: GridEngModel['restraints'];
  nodesById: Map<string, GridEngModel['nodes'][number]>;
  sceneCenter: ScenePoint3;
  visible: boolean;
  showLabels: boolean;
  nodeRadius: number;
}

interface RestraintAxisGlyph {
  axis: RestraintAxisLabel;
  mode: RestraintAxisMode;
  color: string;
  position: ScenePoint3;
  label: string;
  labelPosition: ScenePoint3;
  connectorPoints: [ScenePoint3, ScenePoint3];
  quaternion: Quaternion;
  size: number;
}

const RESTRAINT_AXES = [
  {
    axis: 'X' as const,
    translationKey: 'ux' as const,
    rotationKey: 'rx' as const,
    direction: new Vector3(1, 0, 0),
  },
  {
    axis: 'Y' as const,
    translationKey: 'uy' as const,
    rotationKey: 'ry' as const,
    direction: new Vector3(0, 1, 0),
  },
  {
    axis: 'Z' as const,
    translationKey: 'uz' as const,
    rotationKey: 'rz' as const,
    direction: new Vector3(0, 0, 1),
  },
] as const;

export function RestraintMarkers({
  restraints,
  nodesById,
  sceneCenter,
  visible,
  showLabels,
  nodeRadius,
}: RestraintMarkersProps) {
  const selectedEntities = useModelStore((state) => state.selectedEntities);

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

        const isSelected = isSelectedRestraint(selectedEntities, restraint.id)
          || isSelectedEntity(selectedEntities, 'node', restraint.nodeId);

        return (
          <RestraintMarkerGroup
            key={restraint.id}
            restraint={restraint}
            nodePosition={modelPositionToScene(node.position)}
            sceneCenter={sceneCenter}
            nodeRadius={nodeRadius}
            isSelected={isSelected}
            showLabels={showLabels}
          />
        );
      })}
    </>
  );
}

interface RestraintMarkerGroupProps {
  restraint: Restraint;
  nodePosition: ScenePoint3;
  sceneCenter: ScenePoint3;
  nodeRadius: number;
  isSelected: boolean;
  showLabels: boolean;
}

function RestraintMarkerGroup({
  restraint,
  nodePosition,
  sceneCenter,
  nodeRadius,
  isSelected,
  showLabels,
}: RestraintMarkerGroupProps) {
  const selectRestraint = useModelStore((state) => state.selectRestraint);
  const [isHovered, setIsHovered] = useState(false);
  const markerColor = isSelected
    ? SELECTED_RESTRAINT_COLOR
    : isHovered
      ? HOVER_RESTRAINT_COLOR
      : null;

  const axisGlyphs = useMemo(
    () => buildRestraintAxisGlyphs(restraint, nodePosition, sceneCenter, nodeRadius, markerColor),
    [markerColor, nodePosition, nodeRadius, restraint, sceneCenter],
  );

  if (axisGlyphs.length === 0) {
    return null;
  }

  return (
    <group
      onClick={(event) => {
        event.stopPropagation();
        selectRestraint(restraint.id, {
          additive: event.nativeEvent.shiftKey,
        });
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
      <mesh position={nodePosition}>
        <sphereGeometry args={[Math.max(nodeRadius * 1.9, 0.1), 14, 14]} />
        <meshBasicMaterial transparent opacity={0.01} depthWrite={false} />
      </mesh>

      {axisGlyphs.map((glyph) => (
        <group key={`${restraint.id}-${glyph.axis}`}>
          <Line
            points={glyph.connectorPoints}
            color={glyph.color}
            lineWidth={2.1}
            renderOrder={30}
          />

          <mesh position={glyph.position} quaternion={glyph.quaternion} renderOrder={31}>
            {glyph.mode === 'cube' && (
              <boxGeometry args={[glyph.size, glyph.size, glyph.size]} />
            )}
            {glyph.mode === 'sphere' && (
              <sphereGeometry args={[glyph.size * 0.34, 16, 16]} />
            )}
            {glyph.mode === 'cylinder' && (
              <cylinderGeometry args={[glyph.size * 0.18, glyph.size * 0.18, glyph.size * 0.92, 16]} />
            )}
            <meshStandardMaterial
              color={glyph.color}
              emissive={glyph.color}
              emissiveIntensity={0.12}
              metalness={0.08}
              roughness={0.72}
            />
          </mesh>

          {showLabels && (
            <SceneUprightLabel
              position={glyph.labelPosition}
              text={glyph.label}
              color={glyph.color}
              fontSize={SCENE_LABEL_FONT_SIZE}
            />
          )}
        </group>
      ))}
    </group>
  );
}

function buildRestraintAxisGlyphs(
  restraint: Restraint,
  nodePosition: ScenePoint3,
  sceneCenter: ScenePoint3,
  nodeRadius: number,
  overrideColor: string | null,
): RestraintAxisGlyph[] {
  const markerSize = Math.max(nodeRadius * 2.8, 0.13);
  const axisOffset = markerSize * 1.65;
  const nodeVector = new Vector3(...nodePosition);
  const centerVector = new Vector3(...sceneCenter);

  return RESTRAINT_AXES.flatMap((axisConfig) => {
    const translationFixed = restraint[axisConfig.translationKey];
    const rotationFixed = restraint[axisConfig.rotationKey];
    const mode = resolveAxisMode(translationFixed, rotationFixed);

    if (mode == null) {
      return [];
    }

    const axisColor = overrideColor ?? AXIS_COLORS[axisConfig.axis];
    const axisDirection = resolveRestraintAxisDirection(axisConfig.axis, nodeVector, centerVector);
    const symbolCenter = nodeVector.clone().addScaledVector(axisDirection, axisOffset);
    const labelOffsetDistance = markerSize * 0.5 + SCENE_LABEL_FONT_SIZE * 0.8;
    const labelPosition = symbolCenter.clone().addScaledVector(
      axisConfig.axis === 'Z' ? axisDirection : new Vector3(0, 0, 1),
      labelOffsetDistance,
    );

    return [{
      axis: axisConfig.axis,
      mode,
      color: axisColor,
      position: [symbolCenter.x, symbolCenter.y, symbolCenter.z] as ScenePoint3,
      label: formatAxisRestraintLabel(axisConfig.axis, translationFixed, rotationFixed) ?? '',
      labelPosition: [labelPosition.x, labelPosition.y, labelPosition.z] as ScenePoint3,
      connectorPoints: [
        nodePosition,
        [symbolCenter.x, symbolCenter.y, symbolCenter.z],
      ],
      quaternion: new Quaternion().setFromUnitVectors(CYLINDER_UP, axisDirection),
      size: markerSize,
    }];
  });
}

function resolveAxisMode(
  translationFixed: boolean,
  rotationFixed: boolean,
): RestraintAxisMode | null {
  if (translationFixed && rotationFixed) {
    return 'cube';
  }

  if (translationFixed) {
    return 'sphere';
  }

  if (rotationFixed) {
    return 'cylinder';
  }

  return null;
}

function resolveRestraintAxisDirection(
  axis: RestraintAxisLabel,
  nodePosition: Vector3,
  sceneCenter: Vector3,
): Vector3 {
  if (axis === 'Z') {
    return new Vector3(0, 0, -1);
  }

  if (axis === 'X') {
    return new Vector3(nodePosition.x >= sceneCenter.x ? 1 : -1, 0, 0);
  }

  return new Vector3(0, nodePosition.y >= sceneCenter.y ? 1 : -1, 0);
}

function formatAxisRestraintLabel(
  axis: RestraintAxisLabel,
  translationFixed: boolean,
  rotationFixed: boolean,
): string | null {
  const activeDofs = [
    translationFixed ? `U${axis}` : null,
    rotationFixed ? `R${axis}` : null,
  ].filter((value): value is string => value != null);

  if (activeDofs.length === 0) {
    return null;
  }

  return `${axis}: ${activeDofs.join('|')}`;
}
