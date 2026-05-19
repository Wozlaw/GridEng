import { Euler, Vector3 } from 'three';

import { calculateBoundingBox, type BoundingBox3D } from '../../entities/model';
import type { GridEngModel, Vec3 } from '../../entities/model';
import type { DxfImportPreview, DxfLinePreviewDiagnostics } from './types';

export interface DxfPreviewRotationDeg {
  x: number;
  y: number;
  z: number;
}

export type DxfPreviewRotationAxis = keyof DxfPreviewRotationDeg;

export interface DxfPreviewDisplayState {
  rotationDeg: DxfPreviewRotationDeg;
  normalizationShiftMm: Vec3;
  bounds: BoundingBox3D | null;
  lines: DxfLinePreviewDiagnostics[];
}

export const ZERO_DXF_PREVIEW_ROTATION: DxfPreviewRotationDeg = {
  x: 0,
  y: 0,
  z: 0,
};

export function normalizePreviewRotationDeg(rotationDeg: DxfPreviewRotationDeg): DxfPreviewRotationDeg {
  return {
    x: wrapDegrees(rotationDeg.x),
    y: wrapDegrees(rotationDeg.y),
    z: wrapDegrees(rotationDeg.z),
  };
}

export function rotatePreviewAroundAxis(
  rotationDeg: DxfPreviewRotationDeg,
  axis: DxfPreviewRotationAxis,
  stepDeg = 90,
): DxfPreviewRotationDeg {
  return normalizePreviewRotationDeg({
    ...rotationDeg,
    [axis]: rotationDeg[axis] + stepDeg,
  });
}

export function buildDxfPreviewDisplayState(
  preview: DxfImportPreview | null,
  rotationDeg: DxfPreviewRotationDeg,
): DxfPreviewDisplayState | null {
  if (preview == null || preview.diagnostics.lines.length === 0) {
    return null;
  }

  const normalizedRotationDeg = normalizePreviewRotationDeg(rotationDeg);
  const rotatedLines = preview.diagnostics.lines.map((line) => ({
    ...line,
    start: rotateVec3(line.start, normalizedRotationDeg),
    end: rotateVec3(line.end, normalizedRotationDeg),
  }));
  const rotatedBounds = calculateBoundingBox(rotatedLines.flatMap((line) => [line.start, line.end]));
  const normalizationShiftMm = rotatedBounds == null
    ? { x: 0, y: 0, z: 0 }
    : {
      x: -rotatedBounds.center.x,
      y: -rotatedBounds.center.y,
      z: -rotatedBounds.min.z,
    };
  const normalizedLines = rotatedLines.map((line) => ({
    ...line,
    start: shiftVec3(line.start, normalizationShiftMm),
    end: shiftVec3(line.end, normalizationShiftMm),
  }));
  const bounds = calculateBoundingBox(normalizedLines.flatMap((line) => [line.start, line.end]));

  return {
    rotationDeg: normalizedRotationDeg,
    normalizationShiftMm,
    bounds,
    lines: normalizedLines,
  };
}

export function applyDxfPreviewDisplayStateToModel(
  model: GridEngModel,
  displayState: DxfPreviewDisplayState | null,
): GridEngModel {
  if (displayState == null) {
    return model;
  }

  const { rotationDeg, normalizationShiftMm } = displayState;

  return {
    ...model,
    nodes: model.nodes.map((node) => ({
      ...node,
      position: shiftVec3(rotateVec3(node.position, rotationDeg), normalizationShiftMm),
    })),
  };
}

function rotateVec3(point: Vec3, rotationDeg: DxfPreviewRotationDeg): Vec3 {
  const euler = new Euler(
    toRadians(rotationDeg.x),
    toRadians(rotationDeg.y),
    toRadians(rotationDeg.z),
    'XYZ',
  );
  const rotated = new Vector3(point.x, point.y, point.z).applyEuler(euler);

  return {
    x: sanitizeNearZero(rotated.x),
    y: sanitizeNearZero(rotated.y),
    z: sanitizeNearZero(rotated.z),
  };
}

function shiftVec3(point: Vec3, shift: Vec3): Vec3 {
  return {
    x: sanitizeNearZero(point.x + shift.x),
    y: sanitizeNearZero(point.y + shift.y),
    z: sanitizeNearZero(point.z + shift.z),
  };
}

function wrapDegrees(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  let wrapped = value % 360;
  if (wrapped <= -180) {
    wrapped += 360;
  } else if (wrapped > 180) {
    wrapped -= 360;
  }

  return sanitizeNearZero(wrapped);
}

function sanitizeNearZero(value: number): number {
  return Math.abs(value) < 1e-9 ? 0 : value;
}

function toRadians(value: number): number {
  return value * (Math.PI / 180);
}
