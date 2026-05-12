import { useMemo } from 'react';

import { Line } from '@react-three/drei';
import {
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Matrix4,
  Quaternion,
  Shape,
  Vector2,
  Vector3,
} from 'three';

import { useModelStore } from '../../app/store';
import type { GridEngModel, Member, Profile, Vec3 } from '../../entities/model';
import { getSectionOutline, type Vec2 } from '../../entities/section';
import { computeMemberLocalFrame } from '../../shared/math';
import { modelPositionToScene, scaleModelLengthMm } from './modelToScene';

const DEFAULT_MEMBER_COLOR = '#87d0ff';
const SELECTED_MEMBER_COLOR = '#f4bf61';
const SELECTED_MEMBER_HALO_COLOR = '#ffffff';
const CYLINDER_UP = new Vector3(0, 1, 0);

interface MemberRealMeshesProps {
  members: GridEngModel['members'];
  nodesById: Map<string, GridEngModel['nodes'][number]>;
  profilesById: Map<string, GridEngModel['profiles'][number]>;
  visible: boolean;
  pickRadius: number;
  resolveMemberColor?: (
    member: GridEngModel['members'][number],
    profile: GridEngModel['profiles'][number] | undefined,
  ) => string | undefined;
}

interface MemberVisualPlacement {
  startScene: [number, number, number];
  endScene: [number, number, number];
  midpointScene: [number, number, number];
  directionScene: [number, number, number];
  lengthScene: number;
  xAxis: Vec3;
  yAxis: Vec3;
  zAxis: Vec3;
}

export function MemberRealMeshes({
  members,
  nodesById,
  profilesById,
  visible,
  pickRadius,
  resolveMemberColor,
}: MemberRealMeshesProps) {
  const selectedEntity = useModelStore((state) => state.selectedEntity);
  const selectedLoad = useModelStore((state) => state.getSelectedLoad());
  const selectEntity = useModelStore((state) => state.selectEntity);

  if (!visible) {
    return null;
  }

  return (
    <>
      {members.map((member) => {
        const profile = profilesById.get(member.profileId);
        const isSelected = (selectedEntity.type === 'member' && selectedEntity.id === member.id)
          || (
            selectedLoad?.type === 'member_distributed'
            && selectedLoad.target.memberId === member.id
          );

        return (
          <MemberRealMeshItem
            key={member.id}
            member={member}
            profile={profile}
            nodesById={nodesById}
            isSelected={isSelected}
            pickRadius={pickRadius}
            resolveMemberColor={resolveMemberColor}
            onSelect={() => {
              selectEntity({ type: 'member', id: member.id });
            }}
          />
        );
      })}
    </>
  );
}

interface MemberRealMeshItemProps {
  member: Member;
  profile?: Profile;
  nodesById: Map<string, GridEngModel['nodes'][number]>;
  isSelected: boolean;
  pickRadius: number;
  resolveMemberColor?: (
    member: GridEngModel['members'][number],
    profile: GridEngModel['profiles'][number] | undefined,
  ) => string | undefined;
  onSelect: () => void;
}

function MemberRealMeshItem({
  member,
  profile,
  nodesById,
  isSelected,
  pickRadius,
  resolveMemberColor,
  onSelect,
}: MemberRealMeshItemProps) {
  const placement = useMemo(
    () => getMemberVisualPlacement(member, profile, nodesById),
    [member, nodesById, profile],
  );
  const geometry = useMemo(
    () => (placement == null ? null : createMemberGeometry(profile, placement)),
    [placement, profile],
  );
  const memberColor = isSelected
    ? SELECTED_MEMBER_COLOR
    : resolveMemberColor?.(member, profile) ?? profile?.color ?? DEFAULT_MEMBER_COLOR;

  if (placement == null || geometry == null) {
    return null;
  }

  const pickQuaternion = new Quaternion().setFromUnitVectors(
    CYLINDER_UP,
    new Vector3(...placement.directionScene),
  );

  return (
    <group renderOrder={isSelected ? 20 : 0}>
      <mesh
        position={placement.midpointScene}
        quaternion={pickQuaternion}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      >
        <cylinderGeometry args={[pickRadius, pickRadius, placement.lengthScene, 12]} />
        <meshBasicMaterial transparent opacity={0.01} depthWrite={false} />
      </mesh>

      <mesh
        geometry={geometry}
        renderOrder={isSelected ? 22 : 1}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      >
        <meshStandardMaterial
          color={memberColor}
          metalness={0.12}
          roughness={0.72}
          emissive={isSelected ? memberColor : '#000000'}
          emissiveIntensity={isSelected ? 0.18 : 0}
          side={DoubleSide}
        />
      </mesh>

      {isSelected && (
        <Line
          points={[placement.startScene, placement.endScene]}
          color={SELECTED_MEMBER_HALO_COLOR}
          lineWidth={7.2}
          renderOrder={23}
        />
      )}
    </group>
  );
}

function getMemberVisualPlacement(
  member: Member,
  profile: Profile | undefined,
  nodesById: Map<string, GridEngModel['nodes'][number]>,
): MemberVisualPlacement | null {
  const startNode = nodesById.get(member.startNodeId);
  const endNode = nodesById.get(member.endNodeId);

  if (startNode == null || endNode == null) {
    return null;
  }

  const localAxisRotationDeg = member.localAxisRotationDeg ?? profile?.defaultLocalAxisRotationDeg ?? 0;
  const offsetYmm = member.offsetYmm ?? profile?.defaultOffsetYmm ?? 0;
  const offsetZmm = member.offsetZmm ?? profile?.defaultOffsetZmm ?? 0;
  const frame = computeMemberLocalFrame(startNode.position, endNode.position, localAxisRotationDeg);
  const visualStartModel = addOffset(startNode.position, frame.yAxis, frame.zAxis, offsetYmm, offsetZmm);
  const visualEndModel = addOffset(endNode.position, frame.yAxis, frame.zAxis, offsetYmm, offsetZmm);
  const startScene = modelPositionToScene(visualStartModel);
  const endScene = modelPositionToScene(visualEndModel);
  const dx = endScene[0] - startScene[0];
  const dy = endScene[1] - startScene[1];
  const dz = endScene[2] - startScene[2];
  const lengthScene = Math.hypot(dx, dy, dz);

  if (lengthScene <= 1e-9) {
    return null;
  }

  return {
    startScene,
    endScene,
    midpointScene: [
      (startScene[0] + endScene[0]) / 2,
      (startScene[1] + endScene[1]) / 2,
      (startScene[2] + endScene[2]) / 2,
    ],
    directionScene: [dx / lengthScene, dy / lengthScene, dz / lengthScene],
    lengthScene,
    xAxis: frame.xAxis,
    yAxis: frame.yAxis,
    zAxis: frame.zAxis,
  };
}

function createMemberGeometry(
  profile: Profile | undefined,
  placement: MemberVisualPlacement,
) {
  try {
    const outline = profile == null ? [] : getSectionOutline(profile);

    if (outline.length >= 3) {
      const shape = createShapeFromOutline(outline);
      const geometry = new ExtrudeGeometry(shape, {
        depth: placement.lengthScene,
        bevelEnabled: false,
        steps: 1,
        curveSegments: 20,
      });

      geometry.applyMatrix4(createPlacementMatrix(placement));
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();

      return geometry;
    }
  } catch {
    // Fall through to a visual fallback.
  }

  return createFallbackGeometry(profile, placement);
}

function createFallbackGeometry(
  profile: Profile | undefined,
  placement: MemberVisualPlacement,
) {
  const fallbackSizeMm = getFallbackSectionSizeMm(profile);
  const widthScene = scaleModelLengthMm(fallbackSizeMm.widthMm);
  const heightScene = scaleModelLengthMm(fallbackSizeMm.heightMm);
  const radiusScene = scaleModelLengthMm(fallbackSizeMm.radiusMm);

  const geometry = profile?.kind === 'pipe' || profile?.kind === 'round_bar'
    ? createCylinderFallbackGeometry(radiusScene, placement.lengthScene)
    : createBoxFallbackGeometry(widthScene, heightScene, placement.lengthScene);

  geometry.applyMatrix4(createPlacementMatrix(placement));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return geometry;
}

function createShapeFromOutline(outline: Vec2[]): Shape {
  const shape = new Shape();
  const [firstPoint, ...restPoints] = outline.map((point) =>
    new Vector2(scaleModelLengthMm(point.x), scaleModelLengthMm(point.y))
  );

  shape.moveTo(firstPoint.x, firstPoint.y);

  for (const point of restPoints) {
    shape.lineTo(point.x, point.y);
  }

  shape.closePath();
  return shape;
}

function createBoxFallbackGeometry(widthScene: number, heightScene: number, lengthScene: number) {
  const geometry = new BoxGeometry(
    Math.max(widthScene, 0.02),
    Math.max(heightScene, 0.02),
    Math.max(lengthScene, 0.02),
  );

  geometry.translate(0, 0, lengthScene / 2);
  return geometry;
}

function createCylinderFallbackGeometry(radiusScene: number, lengthScene: number) {
  const geometry = new CylinderGeometry(
    Math.max(radiusScene, 0.01),
    Math.max(radiusScene, 0.01),
    Math.max(lengthScene, 0.02),
    20,
  );

  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, 0, lengthScene / 2);
  return geometry;
}

function createPlacementMatrix(placement: MemberVisualPlacement) {
  const matrix = new Matrix4().makeBasis(
    new Vector3(placement.yAxis.x, placement.yAxis.y, placement.yAxis.z),
    new Vector3(placement.zAxis.x, placement.zAxis.y, placement.zAxis.z),
    new Vector3(placement.xAxis.x, placement.xAxis.y, placement.xAxis.z),
  );

  matrix.setPosition(
    placement.startScene[0],
    placement.startScene[1],
    placement.startScene[2],
  );

  return matrix;
}

function addOffset(
  point: Vec3,
  yAxis: Vec3,
  zAxis: Vec3,
  offsetYmm: number,
  offsetZmm: number,
): Vec3 {
  return {
    x: point.x + yAxis.x * offsetYmm + zAxis.x * offsetZmm,
    y: point.y + yAxis.y * offsetYmm + zAxis.y * offsetZmm,
    z: point.z + yAxis.z * offsetYmm + zAxis.z * offsetZmm,
  };
}

function getFallbackSectionSizeMm(profile: Profile | undefined) {
  if (profile == null) {
    return {
      widthMm: 80,
      heightMm: 80,
      radiusMm: 40,
    };
  }

  if (profile.kind === 'pipe' || profile.kind === 'round_bar') {
    const diameter = getProfileParam(profile, ['d', 'diameter'], Math.sqrt((profile.section.areaMm2 ?? 5000) / Math.PI) * 2);

    return {
      widthMm: diameter,
      heightMm: diameter,
      radiusMm: diameter / 2,
    };
  }

  const widthMm = getProfileParam(profile, ['b', 'width'], Math.sqrt(profile.section.areaMm2 ?? 6400));
  const heightMm = getProfileParam(profile, ['h', 'height', 't', 'thickness'], widthMm);

  return {
    widthMm: Math.max(widthMm, 20),
    heightMm: Math.max(heightMm, 20),
    radiusMm: Math.max(Math.min(widthMm, heightMm) / 2, 10),
  };
}

function getProfileParam(profile: Profile, keys: string[], fallback: number): number {
  for (const key of keys) {
    const value = profile.params[key];

    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return fallback;
}
