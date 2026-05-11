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

const FORCE_COLOR = '#ffd166';
const SELECTED_FORCE_COLOR = '#f4bf61';
const ARROW_UP = new Vector3(0, 1, 0);
const MIN_FORCE_RATIO = 0.22;

interface LoadVectorsProps {
  loadCase?: GridEngModel['loadCases'][number];
  nodesById: Map<string, GridEngModel['nodes'][number]>;
  membersById: Map<string, GridEngModel['members'][number]>;
  visible: boolean;
  sceneLongestSide: number;
}

interface ForceGlyph {
  id: string;
  loadCaseId: string;
  shaftPoints: [ScenePoint3, ScenePoint3];
  headPosition: ScenePoint3;
  headQuaternion: Quaternion;
  headRadius: number;
  headLength: number;
}

export function LoadVectors({
  loadCase,
  nodesById,
  membersById,
  visible,
  sceneLongestSide,
}: LoadVectorsProps) {
  const selectedEntity = useModelStore((state) => state.selectedEntity);
  const selectLoad = useModelStore((state) => state.selectLoad);
  const glyphs = useMemo(
    () => buildForceGlyphs(loadCase, nodesById, membersById, sceneLongestSide),
    [loadCase, membersById, nodesById, sceneLongestSide],
  );

  if (!visible || glyphs.length === 0) {
    return null;
  }

  return (
    <>
      {glyphs.map((glyph) => {
        const color = isSelectedLoad(selectedEntity, glyph.loadCaseId, glyph.id)
          ? SELECTED_FORCE_COLOR
          : FORCE_COLOR;

        return (
          <group
            key={glyph.id}
            onClick={(event) => {
              event.stopPropagation();
              selectLoad(glyph.loadCaseId, glyph.id);
            }}
          >
            <Line points={glyph.shaftPoints} color={color} lineWidth={2.8} />
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

function buildForceGlyphs(
  loadCase: GridEngModel['loadCases'][number] | undefined,
  nodesById: Map<string, GridEngModel['nodes'][number]>,
  membersById: Map<string, GridEngModel['members'][number]>,
  sceneLongestSide: number,
): ForceGlyph[] {
  const loads = loadCase?.loads ?? [];
  const candidateLoads = loads
    .map((load) => {
      const vector = load.kind === 'force' ? resolveRepresentativeLoadVector(load) : null;
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
  const maxArrowLength = Math.max(sceneLongestSide * 0.24, 0.55);

  return candidateLoads.map(({ load, magnitude, anchor, vector }) => {
    const direction = new Vector3(vector.x, vector.y, vector.z).normalize();
    const normalizedMagnitude = maxMagnitude > 0 ? magnitude / maxMagnitude : 0;
    // Keep weaker non-zero loads visible without breaking max-based normalization.
    const arrowLength = maxArrowLength * Math.max(normalizedMagnitude, MIN_FORCE_RATIO);
    const headLength = Math.min(Math.max(arrowLength * 0.22, 0.08), maxArrowLength * 0.28);
    const headRadius = Math.max(headLength * 0.3, 0.03);

    const origin = new Vector3(...modelPositionToScene(anchor));
    const tip = origin.clone().addScaledVector(direction, arrowLength);
    const shaftEnd = tip.clone().addScaledVector(direction, -headLength * 0.72);
    const headCenter = tip.clone().addScaledVector(direction, -headLength / 2);

    return {
      id: load.id,
      loadCaseId: loadCase?.id ?? '',
      shaftPoints: [
        [origin.x, origin.y, origin.z],
        [shaftEnd.x, shaftEnd.y, shaftEnd.z],
      ],
      headPosition: [headCenter.x, headCenter.y, headCenter.z],
      headQuaternion: new Quaternion().setFromUnitVectors(ARROW_UP, direction),
      headRadius,
      headLength,
    };
  });
}
