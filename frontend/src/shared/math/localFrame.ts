import type { Vec3 } from '../../entities/model';

const GLOBAL_Z: Vec3 = { x: 0, y: 0, z: 1 };
const GLOBAL_Y: Vec3 = { x: 0, y: 1, z: 0 };
const PARALLEL_TOLERANCE = 0.985;

interface MemberLocalFrame {
  xAxis: Vec3;
  yAxis: Vec3;
  zAxis: Vec3;
}

/**
 * Computes the orthonormal local frame of a member.
 *
 * - local X is aligned with the member axis from start to end;
 * - local Y/Z are built from a stable global reference vector;
 * - localAxisRotationDeg applies a right-handed rotation around local X.
 *
 * This matches the semantic meaning of backend Beam.alpha:
 * the profile rotates around its own longitudinal axis.
 */
export function computeMemberLocalFrame(
  start: Vec3,
  end: Vec3,
  localAxisRotationDeg: number,
): MemberLocalFrame {
  const memberVector = subtractVec3(end, start);
  const xAxis = normalizeVec3(memberVector);

  if (xAxis == null) {
    throw new Error('Cannot compute a local frame for a zero-length member.');
  }

  // Prefer global Z as the reference up vector. When the member is close to
  // vertical, switch to global Y to avoid a degenerate cross product.
  const referenceUp = Math.abs(dotVec3(xAxis, GLOBAL_Z)) < PARALLEL_TOLERANCE
    ? GLOBAL_Z
    : GLOBAL_Y;

  const baseYAxis = normalizeVec3(crossVec3(referenceUp, xAxis));

  if (baseYAxis == null) {
    throw new Error('Cannot compute a stable transverse axis for the member.');
  }

  const baseZAxis = normalizeVec3(crossVec3(xAxis, baseYAxis));

  if (baseZAxis == null) {
    throw new Error('Cannot compute a stable binormal axis for the member.');
  }

  const angleRad = (localAxisRotationDeg * Math.PI) / 180;
  const cosAngle = Math.cos(angleRad);
  const sinAngle = Math.sin(angleRad);

  return {
    xAxis,
    yAxis: normalizeVec3(addVec3(scaleVec3(baseYAxis, cosAngle), scaleVec3(baseZAxis, sinAngle))) ?? baseYAxis,
    zAxis: normalizeVec3(addVec3(scaleVec3(baseZAxis, cosAngle), scaleVec3(baseYAxis, -sinAngle))) ?? baseZAxis,
  };
}

function addVec3(left: Vec3, right: Vec3): Vec3 {
  return {
    x: left.x + right.x,
    y: left.y + right.y,
    z: left.z + right.z,
  };
}

function subtractVec3(left: Vec3, right: Vec3): Vec3 {
  return {
    x: left.x - right.x,
    y: left.y - right.y,
    z: left.z - right.z,
  };
}

function scaleVec3(vector: Vec3, factor: number): Vec3 {
  return {
    x: vector.x * factor,
    y: vector.y * factor,
    z: vector.z * factor,
  };
}

function dotVec3(left: Vec3, right: Vec3): number {
  return left.x * right.x + left.y * right.y + left.z * right.z;
}

function crossVec3(left: Vec3, right: Vec3): Vec3 {
  return {
    x: left.y * right.z - left.z * right.y,
    y: left.z * right.x - left.x * right.z,
    z: left.x * right.y - left.y * right.x,
  };
}

function normalizeVec3(vector: Vec3): Vec3 | null {
  const length = Math.hypot(vector.x, vector.y, vector.z);

  if (length <= 1e-9) {
    return null;
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  };
}
