import {
  calculateBoundingBox,
  type BoundingBox3D,
  type GridEngModel,
  type Load,
  type Member,
  type Vec3,
} from '../../entities/model';

export const MODEL_TO_SCENE_SCALE = 0.001;

export type ScenePoint3 = [number, number, number];

export interface SceneSegment3 {
  start: ScenePoint3;
  end: ScenePoint3;
  midpoint: ScenePoint3;
  direction: ScenePoint3;
  length: number;
}

export interface ViewportSceneMetrics {
  modelBounds: BoundingBox3D | null;
  modelLongestSideMm: number;
  sceneCenter: ScenePoint3;
  sceneLongestSide: number;
  sceneBoundingRadius: number;
  sceneGridSize: number;
  sceneAxesSize: number;
  sceneNodeRadius: number;
  sceneCameraDistance: number;
  sceneFarPlane: number;
}

export function scaleModelLengthMm(valueMm: number): number {
  return valueMm * MODEL_TO_SCENE_SCALE;
}

export function modelPositionToScene(position: Vec3): ScenePoint3 {
  return [
    scaleModelLengthMm(position.x),
    scaleModelLengthMm(position.y),
    scaleModelLengthMm(position.z),
  ];
}

export function interpolateModelPosition(start: Vec3, end: Vec3, t: number): Vec3 {
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
    z: start.z + (end.z - start.z) * t,
  };
}

export function interpolateScenePoint(start: ScenePoint3, end: ScenePoint3, t: number): ScenePoint3 {
  return [
    start[0] + (end[0] - start[0]) * t,
    start[1] + (end[1] - start[1]) * t,
    start[2] + (end[2] - start[2]) * t,
  ];
}

export function clampRelativePosition(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

export function getMemberSceneSegment(
  member: Member,
  nodesById: Map<string, GridEngModel['nodes'][number]>,
): SceneSegment3 | null {
  const startNode = nodesById.get(member.startNodeId);
  const endNode = nodesById.get(member.endNodeId);

  if (startNode == null || endNode == null) {
    return null;
  }

  const start = modelPositionToScene(startNode.position);
  const end = modelPositionToScene(endNode.position);
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const dz = end[2] - start[2];
  const length = Math.hypot(dx, dy, dz);

  if (length <= 1e-9) {
    return null;
  }

  return {
    start,
    end,
    midpoint: interpolateScenePoint(start, end, 0.5),
    direction: [dx / length, dy / length, dz / length],
    length,
  };
}

export function getLoadAnchorPosition(
  load: Load,
  nodesById: Map<string, GridEngModel['nodes'][number]>,
  membersById: Map<string, GridEngModel['members'][number]>,
): Vec3 | null {
  if (load.target.type === 'node') {
    return nodesById.get(load.target.nodeId)?.position ?? null;
  }

  const member = membersById.get(load.target.memberId);
  if (member == null) {
    return null;
  }

  const startNode = nodesById.get(member.startNodeId);
  const endNode = nodesById.get(member.endNodeId);
  if (startNode == null || endNode == null) {
    return null;
  }

  if (load.type === 'member_distributed' && load.distribution.type === 'linear') {
    const xStartRel = clampRelativePosition(load.distribution.xStartRel ?? 0);
    const xEndRel = clampRelativePosition(load.distribution.xEndRel ?? 1);
    const anchorRel = (xStartRel + xEndRel) / 2;

    return interpolateModelPosition(startNode.position, endNode.position, anchorRel);
  }

  return {
    x: (startNode.position.x + endNode.position.x) / 2,
    y: (startNode.position.y + endNode.position.y) / 2,
    z: (startNode.position.z + endNode.position.z) / 2,
  };
}

export function getSceneBoundingRadius(bounds: BoundingBox3D | null): number {
  if (!bounds) {
    return 0;
  }

  return scaleModelLengthMm(Math.hypot(bounds.size.x, bounds.size.y, bounds.size.z) / 2);
}

export function getFitCameraDistance(
  boundingRadius: number,
  verticalFovDeg: number,
  aspectRatio: number,
  paddingFactor = 1.18,
): number {
  if (boundingRadius <= 0) {
    return 0;
  }

  const verticalFovRad = (verticalFovDeg * Math.PI) / 180;
  const horizontalFovRad = 2 * Math.atan(Math.tan(verticalFovRad / 2) * Math.max(aspectRatio, 1e-3));
  const verticalDistance = boundingRadius / Math.sin(verticalFovRad / 2);
  const horizontalDistance = boundingRadius / Math.sin(horizontalFovRad / 2);

  return Math.max(verticalDistance, horizontalDistance) * paddingFactor;
}

export function getViewportSceneMetrics(nodes: GridEngModel['nodes']): ViewportSceneMetrics {
  const modelBounds = calculateBoundingBox(nodes.map((node) => node.position));
  const modelLongestSideMm = Math.max(
    modelBounds?.size.x ?? 3000,
    modelBounds?.size.y ?? 3000,
    modelBounds?.size.z ?? 3000,
  );
  const sceneLongestSide = Math.max(scaleModelLengthMm(modelLongestSideMm), 3);
  const sceneBoundingRadius = getSceneBoundingRadius(modelBounds);

  return {
    modelBounds,
    modelLongestSideMm,
    sceneCenter: modelBounds ? modelPositionToScene(modelBounds.center) : [0, 0, 0],
    sceneLongestSide,
    sceneBoundingRadius,
    sceneGridSize: Math.max(sceneLongestSide * 3.2, 12),
    sceneAxesSize: Math.max(sceneLongestSide * 0.8, 1.8),
    sceneNodeRadius: Math.max(sceneLongestSide * 0.018, 0.035),
    sceneCameraDistance: Math.max(sceneBoundingRadius * 2.8, sceneLongestSide * 1.9, 5.7),
    sceneFarPlane: Math.max(sceneLongestSide * 60, 200),
  };
}
