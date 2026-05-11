import { useModelStore } from '../../app/store';
import type { GridEngModel } from '../../entities/model';
import { modelPositionToScene } from './modelToScene';

const DEFAULT_NODE_COLOR = '#89d3ff';
const SELECTED_NODE_COLOR = '#f4bf61';

interface NodePointsProps {
  nodes: GridEngModel['nodes'];
  nodeRadius: number;
  visible: boolean;
}

export function NodePoints({ nodes, nodeRadius, visible }: NodePointsProps) {
  const selectedEntity = useModelStore((state) => state.selectedEntity);
  const selectedLoad = useModelStore((state) => state.getSelectedLoad());
  const selectedRestraint = useModelStore((state) => state.getSelectedRestraint());
  const selectEntity = useModelStore((state) => state.selectEntity);

  if (!visible) {
    return null;
  }

  return (
    <>
      {nodes.map((node) => {
        const isSelected = (selectedEntity.type === 'node' && selectedEntity.id === node.id)
          || selectedRestraint?.nodeId === node.id
          || (
            selectedLoad?.type === 'nodal_concentrated'
            && selectedLoad.target.nodeId === node.id
          );
        const scenePosition = modelPositionToScene(node.position);

        return (
          <mesh
            key={node.id}
            position={scenePosition}
            onClick={(event) => {
              event.stopPropagation();
              selectEntity({ type: 'node', id: node.id });
            }}
          >
            <sphereGeometry args={[isSelected ? nodeRadius * 1.3 : nodeRadius, 14, 14]} />
            <meshStandardMaterial color={isSelected ? SELECTED_NODE_COLOR : DEFAULT_NODE_COLOR} />
          </mesh>
        );
      })}
    </>
  );
}
