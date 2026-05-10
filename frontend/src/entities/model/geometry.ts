import type { Vec3 } from './types';

export interface BoundingBox3D {
  min: Vec3;
  max: Vec3;
  center: Vec3;
  size: Vec3;
}

export function isZeroVector(vector: Vec3, tolerance = 1e-9): boolean {
  return Math.abs(vector.x) <= tolerance && Math.abs(vector.y) <= tolerance && Math.abs(vector.z) <= tolerance;
}

export function normalizeVector(vector: Vec3): Vec3 {
  const length = Math.hypot(vector.x, vector.y, vector.z);
  if (length <= Number.EPSILON) {
    return { x: 0, y: 0, z: 0 };
  }
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  };
}

export function calculateBoundingBox(points: Vec3[]): BoundingBox3D | null {
  if (points.length === 0) {
    return null;
  }

  const min: Vec3 = { ...points[0] };
  const max: Vec3 = { ...points[0] };

  for (const point of points) {
    min.x = Math.min(min.x, point.x);
    min.y = Math.min(min.y, point.y);
    min.z = Math.min(min.z, point.z);
    max.x = Math.max(max.x, point.x);
    max.y = Math.max(max.y, point.y);
    max.z = Math.max(max.z, point.z);
  }

  const center: Vec3 = {
    x: (min.x + max.x) / 2,
    y: (min.y + max.y) / 2,
    z: (min.z + max.z) / 2,
  };

  return {
    min,
    max,
    center,
    size: {
      x: max.x - min.x,
      y: max.y - min.y,
      z: max.z - min.z,
    },
  };
}

export function centerByXYProjection(points: Vec3[]): Vec3[] {
  const box = calculateBoundingBox(points);
  if (!box) {
    return points;
  }

  return points.map((point) => ({
    x: point.x - box.center.x,
    y: point.y - box.center.y,
    z: point.z,
  }));
}

export function hasNonZeroZ(points: Vec3[], tolerance = 1e-9): boolean {
  return points.some((point) => Math.abs(point.z) > tolerance);
}
