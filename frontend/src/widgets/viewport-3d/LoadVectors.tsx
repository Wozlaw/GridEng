import { Suspense, useEffect, useMemo, useRef } from 'react';

import { Line, Text } from '@react-three/drei';
import { Quaternion, Vector3 } from 'three';

import { useModelStore, useUiStore } from '../../app/store';
import {
  getLoadUnits,
  type GridEngModel,
  type MemberDistributedLoad,
  type NodalConcentratedLoad,
  type UnitSystem,
} from '../../entities/model';
import { isSelectedLoad } from '../../features/selection';
import { translate } from '../../shared/i18n';
import { notifyWarning } from '../../shared/ui';
import { formatNumber } from '../../shared/utils';
import {
  clampRelativePosition,
  getLoadAnchorPosition,
  getMemberSceneSegment,
  interpolateScenePoint,
  modelPositionToScene,
  scaleModelLengthMm,
  type ScenePoint3,
} from './modelToScene';

const FORCE_COLOR = '#ffd166';
const SELECTED_FORCE_COLOR = '#f4bf61';
const FORCE_HALO_COLOR = '#ffffff';
const ARROW_UP = new Vector3(0, 1, 0);
const PICK_UP = new Vector3(0, 1, 0);
const MIN_FORCE_RATIO = 0.22;
const MIN_DISTRIBUTED_RATIO = 0.18;

type LinearDistributedForceLoad = MemberDistributedLoad & {
  kind: 'force';
  distribution: Extract<MemberDistributedLoad['distribution'], { type: 'linear' }>;
};

interface LoadVectorsProps {
  loadCase?: GridEngModel['loadCases'][number];
  nodesById: Map<string, GridEngModel['nodes'][number]>;
  membersById: Map<string, GridEngModel['members'][number]>;
  visible: boolean;
  sceneLongestSide: number;
  units: UnitSystem;
}

interface ForceArrowGlyph {
  id: string;
  loadCaseId: string;
  shaftPoints: [ScenePoint3, ScenePoint3];
  headPosition: ScenePoint3;
  headQuaternion: Quaternion;
  headRadius: number;
  headLength: number;
  anchorPosition: ScenePoint3;
}

interface DistributedArrowGlyph {
  shaftPoints: [ScenePoint3, ScenePoint3];
  headPosition: ScenePoint3;
  headQuaternion: Quaternion;
  headRadius: number;
  headLength: number;
}

interface DistributedLoadGlyph {
  id: string;
  loadCaseId: string;
  segmentPoints: [ScenePoint3, ScenePoint3];
  pickPosition: ScenePoint3;
  pickQuaternion: Quaternion;
  pickLength: number;
  arrows: DistributedArrowGlyph[];
  startLabel: string;
  endLabel: string;
  startLabelPosition: ScenePoint3;
  endLabelPosition: ScenePoint3;
}

export function LoadVectors({
  loadCase,
  nodesById,
  membersById,
  visible,
  sceneLongestSide,
  units,
}: LoadVectorsProps) {
  const selectedEntity = useModelStore((state) => state.selectedEntity);
  const selectLoad = useModelStore((state) => state.selectLoad);
  const language = useUiStore((state) => state.language);
  const warningRef = useRef<Set<string>>(new Set());
  const nodalForceGlyphs = useMemo(
    () => buildNodalForceGlyphs(loadCase, nodesById, membersById, sceneLongestSide),
    [loadCase, membersById, nodesById, sceneLongestSide],
  );
  const distributedForceGlyphs = useMemo(
    () => buildDistributedForceGlyphs(loadCase, nodesById, membersById, sceneLongestSide, units),
    [loadCase, membersById, nodesById, sceneLongestSide, units],
  );
  const unsupportedFunctionLoads = useMemo(
    () => (loadCase?.loads ?? []).filter(
      (load) => load.type === 'member_distributed' && load.distribution.type === 'function',
    ),
    [loadCase],
  );
  useEffect(() => {
    if (!visible) {
      return;
    }

    for (const load of unsupportedFunctionLoads) {
      if (warningRef.current.has(load.id)) {
        continue;
      }

      warningRef.current.add(load.id);
      notifyWarning({
        title: translate(language, 'notifications.viewport.unsupportedLoad.title'),
        details: [
          translate(language, 'notifications.viewport.functionLoad.detail', {
            loadId: load.id,
          }),
        ],
      });
    }
  }, [language, unsupportedFunctionLoads, visible]);

  if (!visible || (nodalForceGlyphs.length === 0 && distributedForceGlyphs.length === 0)) {
    return null;
  }

  return (
    <>
      {nodalForceGlyphs.map((glyph) => {
        const isSelected = isSelectedLoad(selectedEntity, glyph.loadCaseId, glyph.id);
        const color = isSelected ? SELECTED_FORCE_COLOR : FORCE_COLOR;

        return (
          <group
            key={glyph.id}
            onClick={(event) => {
              event.stopPropagation();
              selectLoad(glyph.loadCaseId, glyph.id);
            }}
          >
            {isSelected && (
              <Line
                points={glyph.shaftPoints}
                color={FORCE_HALO_COLOR}
                lineWidth={6.2}
                renderOrder={35}
              />
            )}
            <Line points={glyph.shaftPoints} color={color} lineWidth={3} renderOrder={36} />
            <mesh position={glyph.headPosition} quaternion={glyph.headQuaternion}>
              <coneGeometry args={[glyph.headRadius, glyph.headLength, 14]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
            </mesh>
            {isSelected && (
              <mesh position={glyph.anchorPosition} renderOrder={37}>
                <sphereGeometry args={[glyph.headRadius * 0.8, 12, 12]} />
                <meshBasicMaterial
                  color={FORCE_HALO_COLOR}
                  transparent
                  opacity={0.3}
                  depthWrite={false}
                />
              </mesh>
            )}
          </group>
        );
      })}

      {distributedForceGlyphs.map((glyph) => {
        const isSelected = isSelectedLoad(selectedEntity, glyph.loadCaseId, glyph.id);
        const color = isSelected ? SELECTED_FORCE_COLOR : FORCE_COLOR;

        return (
          <group
            key={glyph.id}
            onClick={(event) => {
              event.stopPropagation();
              selectLoad(glyph.loadCaseId, glyph.id);
            }}
          >
            <mesh position={glyph.pickPosition} quaternion={glyph.pickQuaternion}>
              <cylinderGeometry args={[0.08, 0.08, glyph.pickLength, 10]} />
              <meshBasicMaterial transparent opacity={0.01} depthWrite={false} />
            </mesh>

            {isSelected && (
              <Line
                points={glyph.segmentPoints}
                color={FORCE_HALO_COLOR}
                lineWidth={5.8}
                renderOrder={35}
              />
            )}
            <Line
              points={glyph.segmentPoints}
              color={color}
              lineWidth={isSelected ? 3.2 : 2.4}
              renderOrder={36}
            />

            {glyph.arrows.map((arrow, index) => (
              <group key={`${glyph.id}-arrow-${index}`}>
                {isSelected && (
                  <Line
                    points={arrow.shaftPoints}
                    color={FORCE_HALO_COLOR}
                    lineWidth={5}
                    renderOrder={37}
                  />
                )}
                <Line
                  points={arrow.shaftPoints}
                  color={color}
                  lineWidth={2.8}
                  renderOrder={38}
                />
                <mesh position={arrow.headPosition} quaternion={arrow.headQuaternion}>
                  <coneGeometry args={[arrow.headRadius, arrow.headLength, 12]} />
                  <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} />
                </mesh>
              </group>
            ))}

            <Suspense fallback={null}>
              <Text
                position={glyph.startLabelPosition}
                fontSize={0.11}
                color={color}
                anchorX="center"
                anchorY="middle"
              >
                {glyph.startLabel}
              </Text>
              <Text
                position={glyph.endLabelPosition}
                fontSize={0.11}
                color={color}
                anchorX="center"
                anchorY="middle"
              >
                {glyph.endLabel}
              </Text>
            </Suspense>
          </group>
        );
      })}
    </>
  );
}

function buildNodalForceGlyphs(
  loadCase: GridEngModel['loadCases'][number] | undefined,
  nodesById: Map<string, GridEngModel['nodes'][number]>,
  membersById: Map<string, GridEngModel['members'][number]>,
  sceneLongestSide: number,
): ForceArrowGlyph[] {
  const loads = (loadCase?.loads ?? []).filter(
    (load): load is NodalConcentratedLoad =>
      load.type === 'nodal_concentrated' && load.kind === 'force',
  );

  if (loads.length === 0) {
    return [];
  }

  const maxMagnitude = Math.max(...loads.map((load) => Math.abs(load.magnitude)));
  const maxArrowLength = Math.max(sceneLongestSide * 0.24, 0.55);

  return loads
    .map((load) => {
      const anchor = getLoadAnchorPosition(load, nodesById, membersById);

      if (anchor == null || Math.abs(load.magnitude) <= 1e-9) {
        return null;
      }

      const sign = load.magnitude >= 0 ? 1 : -1;
      const direction = new Vector3(
        load.direction.x * sign,
        load.direction.y * sign,
        load.direction.z * sign,
      ).normalize();
      const normalizedMagnitude = maxMagnitude > 0 ? Math.abs(load.magnitude) / maxMagnitude : 0;
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
        anchorPosition: [origin.x, origin.y, origin.z],
      };
    })
    .filter((glyph): glyph is ForceArrowGlyph => glyph != null);
}

function buildDistributedForceGlyphs(
  loadCase: GridEngModel['loadCases'][number] | undefined,
  nodesById: Map<string, GridEngModel['nodes'][number]>,
  membersById: Map<string, GridEngModel['members'][number]>,
  sceneLongestSide: number,
  units: UnitSystem,
): DistributedLoadGlyph[] {
  const loads = (loadCase?.loads ?? []).filter(
    (load): load is LinearDistributedForceLoad =>
      load.type === 'member_distributed'
      && load.kind === 'force'
      && load.distribution.type === 'linear',
  );

  if (loads.length === 0) {
    return [];
  }

  const maxDistributedMagnitude = Math.max(
    ...loads.flatMap((load) => [
      Math.abs(load.distribution.qStart),
      Math.abs(load.distribution.qEnd),
    ]),
  );
  const maxArrowLength = Math.max(sceneLongestSide * 0.18, 0.42);

  return loads
    .map((load) => {
      const member = membersById.get(load.target.memberId);

      if (member == null) {
        return null;
      }

      const memberSegment = getMemberSceneSegment(member, nodesById);
      if (memberSegment == null) {
        return null;
      }

      const xStartRel = clampRelativePosition(load.distribution.xStartRel ?? 0);
      const xEndRel = clampRelativePosition(load.distribution.xEndRel ?? 1);
      const segmentStart = interpolateScenePoint(memberSegment.start, memberSegment.end, xStartRel);
      const segmentEnd = interpolateScenePoint(memberSegment.start, memberSegment.end, xEndRel);
      const segmentDx = segmentEnd[0] - segmentStart[0];
      const segmentDy = segmentEnd[1] - segmentStart[1];
      const segmentDz = segmentEnd[2] - segmentStart[2];
      const segmentLength = Math.hypot(segmentDx, segmentDy, segmentDz);

      if (segmentLength <= 1e-6) {
        return null;
      }

      const segmentDirection = new Vector3(
        segmentDx / segmentLength,
        segmentDy / segmentLength,
        segmentDz / segmentLength,
      );
      const directionVector = new Vector3(load.direction.x, load.direction.y, load.direction.z).normalize();
      const arrowCount = Math.max(3, Math.min(6, Math.round(segmentLength / 0.35) + 1));
      const arrows = Array.from({ length: arrowCount }, (_unused, index) => {
        const ratio = arrowCount === 1 ? 0.5 : index / (arrowCount - 1);
        const anchor = interpolateScenePoint(segmentStart, segmentEnd, ratio);
        const qValue = load.distribution.qStart + (load.distribution.qEnd - load.distribution.qStart) * ratio;

        if (Math.abs(qValue) <= 1e-9) {
          return null;
        }

        const sign = qValue >= 0 ? 1 : -1;
        const glyphDirection = directionVector.clone().multiplyScalar(sign);
        const normalizedMagnitude = maxDistributedMagnitude > 0
          ? Math.abs(qValue) / maxDistributedMagnitude
          : 0;
        const arrowLength = maxArrowLength * Math.max(normalizedMagnitude, MIN_DISTRIBUTED_RATIO);
        const headLength = Math.min(Math.max(arrowLength * 0.2, 0.07), maxArrowLength * 0.24);
        const headRadius = Math.max(headLength * 0.28, 0.028);
        const origin = new Vector3(...anchor);
        const tip = origin.clone().addScaledVector(glyphDirection, arrowLength);
        const shaftEnd = tip.clone().addScaledVector(glyphDirection, -headLength * 0.72);
        const headCenter = tip.clone().addScaledVector(glyphDirection, -headLength / 2);

        return {
          shaftPoints: [
            [origin.x, origin.y, origin.z],
            [shaftEnd.x, shaftEnd.y, shaftEnd.z],
          ] as [ScenePoint3, ScenePoint3],
          headPosition: [headCenter.x, headCenter.y, headCenter.z] as ScenePoint3,
          headQuaternion: new Quaternion().setFromUnitVectors(ARROW_UP, glyphDirection),
          headRadius,
          headLength,
        };
      }).filter((arrow): arrow is DistributedArrowGlyph => arrow != null);

      const startLabelDirection = directionVector
        .clone()
        .multiplyScalar(load.distribution.qStart >= 0 ? 1 : -1);
      const endLabelDirection = directionVector
        .clone()
        .multiplyScalar(load.distribution.qEnd >= 0 ? 1 : -1);
      const startArrowLength = maxArrowLength * Math.max(
        maxDistributedMagnitude > 0 ? Math.abs(load.distribution.qStart) / maxDistributedMagnitude : 0,
        MIN_DISTRIBUTED_RATIO,
      );
      const endArrowLength = maxArrowLength * Math.max(
        maxDistributedMagnitude > 0 ? Math.abs(load.distribution.qEnd) / maxDistributedMagnitude : 0,
        MIN_DISTRIBUTED_RATIO,
      );
      const labelOffset = scaleModelLengthMm(90);
      const startLabelAnchor = new Vector3(...segmentStart).addScaledVector(
        startLabelDirection,
        startArrowLength + labelOffset,
      );
      const endLabelAnchor = new Vector3(...segmentEnd).addScaledVector(
        endLabelDirection,
        endArrowLength + labelOffset,
      );

      return {
        id: load.id,
        loadCaseId: loadCase?.id ?? '',
        segmentPoints: [segmentStart, segmentEnd],
        pickPosition: interpolateScenePoint(segmentStart, segmentEnd, 0.5),
        pickQuaternion: new Quaternion().setFromUnitVectors(PICK_UP, segmentDirection),
        pickLength: segmentLength,
        arrows,
        startLabel: `${formatNumber(load.distribution.qStart, 2)} ${getLoadUnits(load, units)}`,
        endLabel: `${formatNumber(load.distribution.qEnd, 2)} ${getLoadUnits(load, units)}`,
        startLabelPosition: [startLabelAnchor.x, startLabelAnchor.y, startLabelAnchor.z],
        endLabelPosition: [endLabelAnchor.x, endLabelAnchor.y, endLabelAnchor.z],
      };
    })
    .filter((glyph): glyph is DistributedLoadGlyph => glyph != null);
}
