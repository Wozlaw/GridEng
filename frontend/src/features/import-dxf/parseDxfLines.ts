import AutoCadColorIndex from 'dxf-parser/dist/AutoCadColorIndex';
import { DxfParser, type IDxf, type IEntity, type ILineEntity, type IPoint } from 'dxf-parser';

import type { DxfLineEntity } from './types';

export interface ParseDxfLinesResult {
  lines: DxfLineEntity[];
  ignoredEntitiesCount: number;
}

export function parseDxfLines(dxfText: string): ParseDxfLinesResult {
  const parser = new DxfParser();
  const document = parser.parseSync(dxfText);

  if (document == null) {
    throw new Error('Failed to parse DXF.');
  }

  return extractLineEntities(document);
}

function extractLineEntities(document: IDxf): ParseDxfLinesResult {
  const lines: DxfLineEntity[] = [];
  let ignoredEntitiesCount = 0;

  for (const entity of document.entities ?? []) {
    if (!isLineEntity(entity)) {
      ignoredEntitiesCount += 1;
      continue;
    }

    const line = mapLineEntity(entity);
    if (line == null) {
      ignoredEntitiesCount += 1;
      continue;
    }

    lines.push(line);
  }

  return {
    lines,
    ignoredEntitiesCount,
  };
}

function isLineEntity(entity: IEntity): entity is ILineEntity {
  return entity.type === 'LINE' && Array.isArray((entity as ILineEntity).vertices);
}

function mapLineEntity(entity: ILineEntity): DxfLineEntity | null {
  if (entity.vertices.length < 2) {
    return null;
  }

  const start = toVec3(entity.vertices[0]);
  const end = toVec3(entity.vertices[1]);
  const color = toFiniteNumber(entity.color);
  const colorIndex = toFiniteInteger(entity.colorIndex);

  return {
    start,
    end,
    color,
    colorIndex,
    trueColor: resolveTrueColor(colorIndex, color),
    layer: typeof entity.layer === 'string' && entity.layer.length > 0 ? entity.layer : undefined,
    handle: entity.handle != null ? String(entity.handle) : undefined,
  };
}

function resolveTrueColor(colorIndex: number | undefined, color: number | undefined): number | undefined {
  if (color == null) {
    return undefined;
  }

  if (colorIndex == null) {
    return color;
  }

  const indexedColor = AutoCadColorIndex[Math.abs(colorIndex)];
  return indexedColor === color ? undefined : color;
}

function toVec3(point: IPoint): DxfLineEntity['start'] {
  return {
    x: toFiniteNumber(point.x) ?? 0,
    y: toFiniteNumber(point.y) ?? 0,
    z: toFiniteNumber(point.z) ?? 0,
  };
}

function toFiniteInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : undefined;
}

function toFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
