import { Line } from '@react-three/drei';
import { Quaternion, Vector3 } from 'three';

import { useModelStore } from '../../app/store';
import type { GridEngModel } from '../../entities/model';
import { getMemberSceneSegment } from './modelToScene';

const DEFAULT_MEMBER_COLOR = '#87d0ff';
const SELECTED_MEMBER_COLOR = '#f4bf61';
const SELECTED_MEMBER_HALO_COLOR = '#ffffff';
const CYLINDER_UP = new Vector3(0, 1, 0);

interface MemberLinesProps {
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

export function MemberLines({
  members,
  nodesById,
  profilesById,
  visible,
  pickRadius,
  resolveMemberColor,
}: MemberLinesProps) {
  const selectedEntity = useModelStore((state) => state.selectedEntity);
  const selectedLoad = useModelStore((state) => state.getSelectedLoad());
  const selectEntity = useModelStore((state) => state.selectEntity);

  if (!visible) {
    return null;
  }

  return (
    <>
      {members.map((member) => {
        const segment = getMemberSceneSegment(member, nodesById);

        if (segment == null) {
          return null;
        }

        const profile = profilesById.get(member.profileId);
        const isSelected = (selectedEntity.type === 'member' && selectedEntity.id === member.id)
          || (
            selectedLoad?.type === 'member_distributed'
            && selectedLoad.target.memberId === member.id
          );
        const memberColor = isSelected
          ? SELECTED_MEMBER_COLOR
          : resolveMemberColor?.(member, profile) ?? profile?.color ?? DEFAULT_MEMBER_COLOR;
        const segmentDirection = new Vector3(
          segment.direction[0],
          segment.direction[1],
          segment.direction[2],
        );
        const pickQuaternion = new Quaternion().setFromUnitVectors(CYLINDER_UP, segmentDirection);

        return (
          <group key={member.id} renderOrder={isSelected ? 20 : 0}>
            <mesh
              position={segment.midpoint}
              quaternion={pickQuaternion}
              onClick={(event) => {
                event.stopPropagation();
                selectEntity({ type: 'member', id: member.id });
              }}
            >
              <cylinderGeometry args={[pickRadius, pickRadius, segment.length, 12]} />
              <meshBasicMaterial transparent opacity={0.01} depthWrite={false} />
            </mesh>

            {isSelected && (
              <Line
                points={[segment.start, segment.end]}
                color={SELECTED_MEMBER_HALO_COLOR}
                lineWidth={7.2}
                renderOrder={21}
              />
            )}

            <Line
              points={[segment.start, segment.end]}
              color={memberColor}
              lineWidth={isSelected ? 3.8 : 2.2}
              renderOrder={isSelected ? 22 : 1}
            />
          </group>
        );
      })}
    </>
  );
}
