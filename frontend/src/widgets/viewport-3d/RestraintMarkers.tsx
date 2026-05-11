import { Line } from '@react-three/drei';

import type { GridEngModel, Restraint } from '../../entities/model';
import { modelPositionToScene, type ScenePoint3 } from './modelToScene';

const FULL_RESTRAINT_COLOR = '#7fd6ff';
const PARTIAL_RESTRAINT_COLOR = '#f6c36d';

interface RestraintMarkersProps {
  restraints: GridEngModel['restraints'];
  nodesById: Map<string, GridEngModel['nodes'][number]>;
  visible: boolean;
  nodeRadius: number;
}

export function RestraintMarkers({
  restraints,
  nodesById,
  visible,
  nodeRadius,
}: RestraintMarkersProps) {
  if (!visible || restraints.length === 0) {
    return null;
  }

  const markerSize = Math.max(nodeRadius * 2.6, 0.1);
  const stemLength = markerSize * 0.78;
  const fullPlateThickness = markerSize * 0.4;

  return (
    <>
      {restraints.map((restraint) => {
        const node = nodesById.get(restraint.nodeId);
        if (node == null) {
          return null;
        }

        const nodePosition = modelPositionToScene(node.position);
        const stemEnd: ScenePoint3 = [
          nodePosition[0],
          nodePosition[1],
          nodePosition[2] - stemLength,
        ];
        const isFullyFixed = isFullyFixedRestraint(restraint);

        return isFullyFixed ? (
          <group key={restraint.id}>
            <Line
              points={[nodePosition, stemEnd]}
              color={FULL_RESTRAINT_COLOR}
              lineWidth={2.4}
            />
            <mesh
              position={[
                stemEnd[0],
                stemEnd[1],
                stemEnd[2] - fullPlateThickness / 2,
              ]}
            >
              <boxGeometry args={[markerSize, markerSize, fullPlateThickness]} />
              <meshStandardMaterial
                color={FULL_RESTRAINT_COLOR}
                emissive={FULL_RESTRAINT_COLOR}
                emissiveIntensity={0.16}
                roughness={0.42}
              />
            </mesh>
          </group>
        ) : (
          <PartialRestraintMarker
            key={restraint.id}
            restraint={restraint}
            nodePosition={nodePosition}
            markerSize={markerSize}
            stemLength={stemLength}
          />
        );
      })}
    </>
  );
}

interface PartialRestraintMarkerProps {
  restraint: Restraint;
  nodePosition: ScenePoint3;
  markerSize: number;
  stemLength: number;
}

function PartialRestraintMarker({
  restraint,
  nodePosition,
  markerSize,
  stemLength,
}: PartialRestraintMarkerProps) {
  const baseZ = nodePosition[2] - stemLength;
  const half = markerSize * 0.5;
  const translationalHalf = markerSize * 0.3;
  const rotationalCrossHalf = markerSize * 0.2;
  const rotationalCrossZ = baseZ - markerSize * 0.22;

  return (
    <group>
      <Line
        points={[
          nodePosition,
          [nodePosition[0], nodePosition[1], baseZ],
        ]}
        color={PARTIAL_RESTRAINT_COLOR}
        lineWidth={2.2}
      />
      <Line
        points={[
          [nodePosition[0] - half, nodePosition[1] - half, baseZ],
          [nodePosition[0] + half, nodePosition[1] + half, baseZ],
        ]}
        color={PARTIAL_RESTRAINT_COLOR}
        lineWidth={2.2}
      />
      <Line
        points={[
          [nodePosition[0] - half, nodePosition[1] + half, baseZ],
          [nodePosition[0] + half, nodePosition[1] - half, baseZ],
        ]}
        color={PARTIAL_RESTRAINT_COLOR}
        lineWidth={2.2}
      />

      {restraint.ux && (
        <Line
          points={[
            [nodePosition[0] - translationalHalf, nodePosition[1], baseZ],
            [nodePosition[0] + translationalHalf, nodePosition[1], baseZ],
          ]}
          color={PARTIAL_RESTRAINT_COLOR}
          lineWidth={2.2}
        />
      )}

      {restraint.uy && (
        <Line
          points={[
            [nodePosition[0], nodePosition[1] - translationalHalf, baseZ],
            [nodePosition[0], nodePosition[1] + translationalHalf, baseZ],
          ]}
          color={PARTIAL_RESTRAINT_COLOR}
          lineWidth={2.2}
        />
      )}

      {restraint.uz && (
        <Line
          points={[
            [nodePosition[0], nodePosition[1], baseZ],
            [nodePosition[0], nodePosition[1], baseZ + translationalHalf],
          ]}
          color={PARTIAL_RESTRAINT_COLOR}
          lineWidth={2.2}
        />
      )}

      {(restraint.rx || restraint.ry || restraint.rz) && (
        <>
          <Line
            points={[
              [nodePosition[0] - rotationalCrossHalf, nodePosition[1], rotationalCrossZ],
              [nodePosition[0] + rotationalCrossHalf, nodePosition[1], rotationalCrossZ],
            ]}
            color={PARTIAL_RESTRAINT_COLOR}
            lineWidth={2}
          />
          <Line
            points={[
              [nodePosition[0], nodePosition[1] - rotationalCrossHalf, rotationalCrossZ],
              [nodePosition[0], nodePosition[1] + rotationalCrossHalf, rotationalCrossZ],
            ]}
            color={PARTIAL_RESTRAINT_COLOR}
            lineWidth={2}
          />
        </>
      )}
    </group>
  );
}

function isFullyFixedRestraint(restraint: Restraint): boolean {
  return restraint.ux
    && restraint.uy
    && restraint.uz
    && restraint.rx
    && restraint.ry
    && restraint.rz;
}
