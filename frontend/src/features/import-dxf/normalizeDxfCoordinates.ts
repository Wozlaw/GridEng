import { calculateBoundingBox, type Vec3 } from '../../entities/model';

import type { DxfImportSettings, DxfLineEntity } from './types';

export interface DxfNormalizationDiagnostics {
  is3D: boolean;
  zRange: { min: number; max: number } | null;
  xyCenterShift: { x: number; y: number };
}

export interface NormalizeDxfCoordinatesResult {
  lines: DxfLineEntity[];
  diagnostics: DxfNormalizationDiagnostics;
}

export function normalizeDxfCoordinates(
  lines: DxfLineEntity[],
  settings: DxfImportSettings,
): NormalizeDxfCoordinatesResult {
  const points = lines.flatMap((line) => [line.start, line.end]);
  const boundingBox = calculateBoundingBox(points);
  const zRange = boundingBox == null
    ? null
    : {
        min: boundingBox.min.z,
        max: boundingBox.max.z,
      };
  const is3D = zRange != null && zRange.max - zRange.min > settings.toleranceMm;

  let normalizedLines = lines.map(cloneLineEntity);

  if (!is3D && settings.force2DToXY) {
    normalizedLines = normalizedLines.map((line) => ({
      ...line,
      start: { ...line.start, z: 0 },
      end: { ...line.end, z: 0 },
    }));
  }

  const xyCenterShift = settings.centerOnXY ? getXYCenterShift(normalizedLines) : { x: 0, y: 0 };
  if (settings.centerOnXY && (xyCenterShift.x !== 0 || xyCenterShift.y !== 0)) {
    normalizedLines = normalizedLines.map((line) => ({
      ...line,
      start: shiftPointXY(line.start, xyCenterShift),
      end: shiftPointXY(line.end, xyCenterShift),
    }));
  }

  return {
    lines: normalizedLines,
    diagnostics: {
      is3D,
      zRange,
      xyCenterShift,
    },
  };
}

function getXYCenterShift(lines: DxfLineEntity[]): { x: number; y: number } {
  const boundingBox = calculateBoundingBox(lines.flatMap((line) => [line.start, line.end]));
  if (boundingBox == null) {
    return { x: 0, y: 0 };
  }

  return {
    x: boundingBox.center.x,
    y: boundingBox.center.y,
  };
}

function shiftPointXY(point: Vec3, shift: { x: number; y: number }): Vec3 {
  return {
    x: point.x - shift.x,
    y: point.y - shift.y,
    z: point.z,
  };
}

function cloneLineEntity(line: DxfLineEntity): DxfLineEntity {
  return {
    ...line,
    start: { ...line.start },
    end: { ...line.end },
  };
}
