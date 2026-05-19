import { useEffect, useMemo, useRef } from 'react';

import { Line } from '@react-three/drei';
import { Quaternion, Vector3 } from 'three';

import { useModelStore, useUiStore } from '../../app/store';
import {
  getLoadUnits,
  type GridEngModel,
  type NodalConcentratedLoad,
  type UnitSystem,
} from '../../entities/model';
import { isSelectedLoad } from '../../features/selection';
import { translate } from '../../shared/i18n';
import { notifyWarning } from '../../shared/ui';
import { formatNumber } from '../../shared/utils/format';
import {
  getLoadAnchorPosition,
  modelPositionToScene,
  type ScenePoint3,
} from './modelToScene';
import { SCENE_LABEL_FONT_SIZE, SceneUprightLabel } from './SceneUprightLabel';

const MOMENT_COLOR = '#ff7ab6';
const SELECTED_MOMENT_COLOR = '#f4bf61';
const MOMENT_HALO_COLOR = '#ffffff';
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
  showLabels: boolean;
  units: UnitSystem;
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
  label: string;
  labelPosition: ScenePoint3;
}

export function MomentVectors({
  loadCase,
  nodesById,
  membersById,
  visible,
  showLabels,
  units,
  sceneLongestSide,
}: MomentVectorsProps) {
  const selectedEntities = useModelStore((state) => state.selectedEntities);
  const selectLoad = useModelStore((state) => state.selectLoad);
  const language = useUiStore((state) => state.language);
  const warningRef = useRef<Set<string>>(new Set());
  const glyphs = useMemo(
    () => buildMomentGlyphs(loadCase, nodesById, membersById, units, sceneLongestSide),
    [loadCase, membersById, nodesById, sceneLongestSide, units],
  );
  const unsupportedDistributedMoments = useMemo(
    () => (loadCase?.loads ?? []).filter(
      (load) => load.type === 'member_distributed' && load.kind === 'moment',
    ),
    [loadCase],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    for (const load of unsupportedDistributedMoments) {
      if (warningRef.current.has(load.id)) {
        continue;
      }

      warningRef.current.add(load.id);
      notifyWarning({
        title: translate(language, 'notifications.viewport.unsupportedLoad.title'),
        details: [
          translate(language, 'notifications.viewport.distributedMoment.detail', {
            loadId: load.id,
          }),
        ],
      });
    }
  }, [language, unsupportedDistributedMoments, visible]);

  if (!visible || glyphs.length === 0) {
    return null;
  }

  return (
    <>
      {glyphs.map((glyph) => {
        const isSelected = isSelectedLoad(selectedEntities, glyph.loadCaseId, glyph.id);
        const color = isSelected ? SELECTED_MOMENT_COLOR : MOMENT_COLOR;

        return (
          <group
            key={glyph.id}
            onClick={(event) => {
              event.stopPropagation();
              selectLoad(glyph.loadCaseId, glyph.id, {
                additive: event.nativeEvent.shiftKey,
              });
            }}
          >
            {isSelected && (
              <Line
                points={glyph.arcPoints}
                color={MOMENT_HALO_COLOR}
                lineWidth={5.8}
                renderOrder={40}
              />
            )}
            <Line points={glyph.arcPoints} color={color} lineWidth={3} renderOrder={41} />
            <mesh position={glyph.headPosition} quaternion={glyph.headQuaternion}>
              <coneGeometry args={[glyph.headRadius, glyph.headLength, 14]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
            </mesh>
            {showLabels && (
              <SceneUprightLabel
                position={glyph.labelPosition}
                text={glyph.label}
                color={color}
                fontSize={SCENE_LABEL_FONT_SIZE}
              />
            )}
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
  units: UnitSystem,
  sceneLongestSide: number,
): MomentGlyph[] {
  const loads = (loadCase?.loads ?? []).filter(
    (load): load is NodalConcentratedLoad =>
      load.type === 'nodal_concentrated' && load.kind === 'moment',
  );

  if (loads.length === 0) {
    return [];
  }

  const maxMagnitude = Math.max(...loads.map((load) => Math.abs(load.magnitude)));
  const maxRadius = Math.max(sceneLongestSide * 0.14, 0.34);

  return loads
    .map((load) => {
      const anchor = getLoadAnchorPosition(load, nodesById, membersById);

      if (anchor == null || Math.abs(load.magnitude) <= 1e-9) {
        return null;
      }

      const sign = load.magnitude >= 0 ? 1 : -1;
      const axis = new Vector3(
        load.direction.x * sign,
        load.direction.y * sign,
        load.direction.z * sign,
      ).normalize();
      const normalizedMagnitude = maxMagnitude > 0 ? Math.abs(load.magnitude) / maxMagnitude : 0;
      const radius = maxRadius * Math.max(normalizedMagnitude, MIN_MOMENT_RATIO);
      const arcRadius = radius * 0.7;
      const headLength = Math.min(Math.max(arcRadius * 0.48, 0.08), maxRadius * 0.56);
      const headRadius = Math.max(headLength * 0.28, 0.03);
      const unitsLabel = getLoadUnits(load, units);

      const origin = new Vector3(...modelPositionToScene(anchor));
      const radial = getPerpendicularUnitVector(axis);
      const tangent = new Vector3().crossVectors(axis, radial).normalize();

      const arcPoints = createArcPoints(origin, radial, tangent, arcRadius);
      const endAngle = ARC_START_RAD + ARC_SWEEP_RAD;
      const endPoint = pointOnArc(origin, radial, tangent, arcRadius, endAngle);
      const labelPoint = origin.clone().add(new Vector3(0, 0, -(arcRadius + SCENE_LABEL_FONT_SIZE * 0.8)));
      const tangentDirection = radial
        .clone()
        .multiplyScalar(-Math.sin(endAngle))
        .add(tangent.clone().multiplyScalar(Math.cos(endAngle)))
        .normalize();
      const headCenter = endPoint.clone().addScaledVector(tangentDirection, headLength / 2);

      return {
        id: load.id,
        loadCaseId: loadCase?.id ?? '',
        arcPoints,
        headPosition: [headCenter.x, headCenter.y, headCenter.z],
        headQuaternion: new Quaternion().setFromUnitVectors(ARROW_UP, tangentDirection),
        headRadius,
        headLength,
        label: `${formatNumber(load.magnitude, 2)} ${unitsLabel}`,
        labelPosition: [labelPoint.x, labelPoint.y, labelPoint.z],
      };
    })
    .filter((glyph): glyph is MomentGlyph => glyph != null);
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
