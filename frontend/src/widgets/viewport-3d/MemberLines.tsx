import { Line } from '@react-three/drei';

import { useModelStore } from '../../app/store';
import type { GridEngModel } from '../../entities/model';
import { modelPositionToScene } from './modelToScene';

const DEFAULT_MEMBER_COLOR = '#87d0ff';
const SELECTED_MEMBER_COLOR = '#f4bf61';

interface MemberLinesProps {
  members: GridEngModel['members'];
  nodesById: Map<string, GridEngModel['nodes'][number]>;
  profilesById: Map<string, GridEngModel['profiles'][number]>;
  visible: boolean;
}

export function MemberLines({
  members,
  nodesById,
  profilesById,
  visible,
}: MemberLinesProps) {
  const selectedEntity = useModelStore((state) => state.selectedEntity);
  const selectEntity = useModelStore((state) => state.selectEntity);

  if (!visible) {
    return null;
  }

  return (
    <>
      {members.map((member) => {
        const startNode = nodesById.get(member.startNodeId);
        const endNode = nodesById.get(member.endNodeId);

        if (!startNode || !endNode) {
          return null;
        }

        const profile = profilesById.get(member.profileId);
        const isSelected = selectedEntity.type === 'member' && selectedEntity.id === member.id;
        const memberColor = isSelected
          ? SELECTED_MEMBER_COLOR
          : profile?.color ?? DEFAULT_MEMBER_COLOR;

        return (
          <Line
            key={member.id}
            points={[
              modelPositionToScene(startNode.position),
              modelPositionToScene(endNode.position),
            ]}
            color={memberColor}
            lineWidth={isSelected ? 3.2 : 2.2}
            onClick={(event) => {
              event.stopPropagation();
              selectEntity({ type: 'member', id: member.id });
            }}
          />
        );
      })}
    </>
  );
}
