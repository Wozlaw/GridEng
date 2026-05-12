import { useModelStore } from '../../app/store';
import type { GridEngModel } from '../../entities/model';
import { modelPositionToScene } from './modelToScene';

const DEFAULT_NODE_COLOR = '#89d3ff';
const SELECTED_NODE_COLOR = '#f4bf61';
const SELECTED_NODE_HALO_COLOR = '#ffffff';

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

  const pickRadius = nodeRadius * 2.4;

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
          <group key={node.id}>
            <mesh
              position={scenePosition}
              onClick={(event) => {
                event.stopPropagation();
                selectEntity({ type: 'node', id: node.id });
              }}
            >
              <sphereGeometry args={[pickRadius, 12, 12]} />
              <meshBasicMaterial transparent opacity={0.01} depthWrite={false} />
            </mesh>

            {isSelected && (
              <mesh position={scenePosition} renderOrder={30}>
                <sphereGeometry args={[nodeRadius * 2.05, 18, 18]} />
                <meshBasicMaterial
                  color={SELECTED_NODE_HALO_COLOR}
                  transparent
                  opacity={0.22}
                  depthWrite={false}
                />
              </mesh>
            )}

            <mesh
              position={scenePosition}
              onClick={(event) => {
                event.stopPropagation();
                selectEntity({ type: 'node', id: node.id });
              }}
            >
              <sphereGeometry args={[isSelected ? nodeRadius * 1.35 : nodeRadius, 16, 16]} />
              <meshStandardMaterial color={isSelected ? SELECTED_NODE_COLOR : DEFAULT_NODE_COLOR} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}
