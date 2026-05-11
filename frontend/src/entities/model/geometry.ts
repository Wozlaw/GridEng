import type {
  ForceMomentVector,
  Load,
  MemberDistributedLoad,
  UnitSystem,
  Vec3,
} from './types';

export interface BoundingBox3D {
  min: Vec3;
  max: Vec3;
  center: Vec3;
  size: Vec3;
}

export function isZeroVector(vector: Vec3, tolerance = 1e-9): boolean {
  return Math.abs(vector.x) <= tolerance && Math.abs(vector.y) <= tolerance && Math.abs(vector.z) <= tolerance;
}

export function vec3Length(vector: Vec3): number {
  return Math.hypot(vector.x, vector.y, vector.z);
}

export function scaleVec3(vector: Vec3, factor: number): Vec3 {
  return {
    x: vector.x * factor,
    y: vector.y * factor,
    z: vector.z * factor,
  };
}

export function normalizeVec3(vector: Vec3, tolerance = 1e-9): Vec3 | null {
  const length = vec3Length(vector);
  if (length <= tolerance) {
    return null;
  }

  return scaleVec3(vector, 1 / length);
}

export function normalizeVector(vector: Vec3): Vec3 {
  const normalized = normalizeVec3(vector, Number.EPSILON);
  if (normalized == null) {
    return { x: 0, y: 0, z: 0 };
  }

  return normalized;
}

export function resolveConcentratedLoadVector(load: Load): ForceMomentVector {
  if (load.type !== 'nodal_concentrated') {
    return {
      force: { x: 0, y: 0, z: 0 },
      moment: { x: 0, y: 0, z: 0 },
    };
  }

  const resolved = scaleVec3(load.direction, load.magnitude);

  return load.kind === 'force'
    ? {
      force: resolved,
      moment: { x: 0, y: 0, z: 0 },
    }
    : {
      force: { x: 0, y: 0, z: 0 },
      moment: resolved,
    };
}

export function resolveDistributedLoadVectors(load: MemberDistributedLoad): { start: Vec3; end: Vec3 } {
  if (load.distribution.type !== 'linear') {
    return {
      start: { x: 0, y: 0, z: 0 },
      end: { x: 0, y: 0, z: 0 },
    };
  }

  return {
    start: scaleVec3(load.direction, load.distribution.qStart),
    end: scaleVec3(load.direction, load.distribution.qEnd),
  };
}

export function resolveRepresentativeLoadVector(load: Load): Vec3 | null {
  if (load.type === 'nodal_concentrated') {
    const resolved = resolveConcentratedLoadVector(load);
    const vector = load.kind === 'force' ? resolved.force : resolved.moment;
    return vec3Length(vector) > 0 ? vector : null;
  }

  if (load.distribution.type !== 'linear') {
    return null;
  }

  const { start, end } = resolveDistributedLoadVectors(load);
  return averageOrDominantVec3(start, end);
}

export function getLoadUnits(load: Load, units: UnitSystem): string {
  if (load.type === 'nodal_concentrated') {
    return load.kind === 'force' ? units.force : units.moment;
  }

  if (load.kind === 'force') {
    return `${units.force}/${units.length}`;
  }

  return `${units.moment}/${units.length}`;
}

function averageOrDominantVec3(start: Vec3, end: Vec3): Vec3 | null {
  const average: Vec3 = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
    z: (start.z + end.z) / 2,
  };

  if (vec3Length(average) > 0) {
    return average;
  }

  const startLength = vec3Length(start);
  const endLength = vec3Length(end);
  if (startLength === 0 && endLength === 0) {
    return null;
  }

  return startLength >= endLength ? start : end;
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
