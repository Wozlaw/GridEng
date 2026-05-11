import { useMemo } from 'react';

import { Line } from '@react-three/drei';
import { Quaternion, Vector3 } from 'three';

import { useModelStore } from '../../app/store';
import {
  resolveRepresentativeLoadVector,
  vec3Length,
  type GridEngModel,
} from '../../entities/model';
import { isSelectedLoad } from '../../features/selection';
import {
  getLoadAnchorPosition,
  modelPositionToScene,
  type ScenePoint3,
} from './modelToScene';

const MOMENT_COLOR = '#ff7ab6';
const SELECTED_MOMENT_COLOR = '#f4bf61';
const ARROW_UP = new Vector3(0, 1, 0);
const ARC_SEGMENTS = 28;
const ARC_SWEEP_RAD = Math.PI * 1.55;
const ARC_START_RAD = -Math.PI * 0.2;
const MIN_MOMENT_RATIO = 0.28;

interface MomentVectorsProps {
  loadCase?: GridEngModel['loadCases'][number];
  nodesById: Map<string, GridEngModel['nodes'][number]>;
  membersById: Map<string, GridEngModel['members'][number]>;
  visible: boolean;
  sceneLongestSide: number;
}

interface MomentGlyph {
  id: string;
  loadCaseId: string;
  arcPoints: ScenePoint3[];
  headPosition: ScenePoint3;
  headQuaternion: Quaternion;
  headRadius: number;
  headLength: number;
}

export function MomentVectors({
  loadCase,
  nodesById,
  membersById,
  visible,
  sceneLongestSide,
}: MomentVectorsProps) {
  const selectedEntity = useModelStore((state) => state.selectedEntity);
  const selectLoad = useModelStore((state) => state.selectLoad);
  const glyphs = useMemo(
    () => buildMomentGlyphs(loadCase, nodesById, membersById, sceneLongestSide),
    [loadCase, membersById, nodesById, sceneLongestSide],
  );

  if (!visible || glyphs.length === 0) {
    return null;
  }

  return (
    <>
      {glyphs.map((glyph) => {
        const color = isSelectedLoad(selectedEntity, glyph.loadCaseId, glyph.id)
          ? SELECTED_MOMENT_COLOR
          : MOMENT_COLOR;

        return (
          <group
            key={glyph.id}
            onClick={(event) => {
              event.stopPropagation();
              selectLoad(glyph.loadCaseId, glyph.id);
            }}
          >
            <Line points={glyph.arcPoints} color={color} lineWidth={2.8} />
            <mesh position={glyph.headPosition} quaternion={glyph.headQuaternion}>
            <coneGeometry args={[glyph.headRadius, glyph.headLength, 14]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function buildMomentGlyphs(
  loadCase: GridEngModel['loadCases'][number] | undefined,
  nodesById: Map<string, GridEngModel['nodes'][number]>,
  membersById: Map<string, GridEngModel['members'][number]>,
  sceneLongestSide: number,
): MomentGlyph[] {
  const loads = loadCase?.loads ?? [];
  const candidateLoads = loads
    .map((load) => {
      const vector = load.kind === 'moment' ? resolveRepresentativeLoadVector(load) : null;
      const magnitude = vector == null ? 0 : vec3Length(vector);
      const anchor = getLoadAnchorPosition(load, nodesById, membersById);

      return magnitude > 0 && anchor != null && vector != null
        ? { load, magnitude, anchor, vector }
        : null;
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate != null);

  if (candidateLoads.length === 0) {
    return [];
  }

  const maxMagnitude = Math.max(...candidateLoads.map((candidate) => candidate.magnitude));
  const maxRadius = Math.max(sceneLongestSide * 0.14, 0.34);

  return candidateLoads.map(({ load, magnitude, anchor, vector }) => {
    const axis = new Vector3(vector.x, vector.y, vector.z).normalize();
    const normalizedMagnitude = maxMagnitude > 0 ? magnitude / maxMagnitude : 0;
    const radius = maxRadius * Math.max(normalizedMagnitude, MIN_MOMENT_RATIO);
    const headLength = Math.min(Math.max(radius * 0.48, 0.08), maxRadius * 0.56);
    const headRadius = Math.max(headLength * 0.28, 0.03);

    const origin = new Vector3(...modelPositionToScene(anchor));
    const radial = getPerpendicularUnitVector(axis);
    const tangent = new Vector3().crossVectors(axis, radial).normalize();

    const arcPoints = createArcPoints(origin, radial, tangent, radius);
    const endAngle = ARC_START_RAD + ARC_SWEEP_RAD;
    const endPoint = pointOnArc(origin, radial, tangent, radius, endAngle);
    const tangentDirection = radial
      .clone()
      .multiplyScalar(-Math.sin(endAngle))
      .add(tangent.clone().multiplyScalar(Math.cos(endAngle)))
      .normalize();
    const headCenter = endPoint.clone().addScaledVector(tangentDirection, -headLength / 2);

    return {
      id: load.id,
      loadCaseId: loadCase?.id ?? '',
      arcPoints,
      headPosition: [headCenter.x, headCenter.y, headCenter.z],
      headQuaternion: new Quaternion().setFromUnitVectors(ARROW_UP, tangentDirection),
      headRadius,
      headLength,
    };
  });
}

function createArcPoints(
  origin: Vector3,
  radial: Vector3,
  tangent: Vector3,
  radius: number,
): ScenePoint3[] {
  const points: ScenePoint3[] = [];

  for (let step = 0; step <= ARC_SEGMENTS; step += 1) {
    const angle = ARC_START_RAD + (ARC_SWEEP_RAD * step) / ARC_SEGMENTS;
    const point = pointOnArc(origin, radial, tangent, radius, angle);
    points.push([point.x, point.y, point.z]);
  }

  return points;
}

function pointOnArc(
  origin: Vector3,
  radial: Vector3,
  tangent: Vector3,
  radius: number,
  angle: number,
): Vector3 {
  return origin
    .clone()
    .add(radial.clone().multiplyScalar(Math.cos(angle) * radius))
    .add(tangent.clone().multiplyScalar(Math.sin(angle) * radius));
}

function getPerpendicularUnitVector(axis: Vector3): Vector3 {
  const reference = Math.abs(axis.z) < 0.9
    ? new Vector3(0, 0, 1)
    : new Vector3(1, 0, 0);

  return new Vector3().crossVectors(axis, reference).normalize();
}
