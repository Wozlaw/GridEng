import { calculateBoundingBox, type BoundingBox3D, type GridEngModel, type Vec3 } from '../../entities/model';

export const MODEL_TO_SCENE_SCALE = 0.001;

export type ScenePoint3 = [number, number, number];

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
