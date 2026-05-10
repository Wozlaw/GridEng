import { centerByXYProjection, hasNonZeroZ, type GridEngModel, type Id, type Node, type SourceRef, type Vec3 } from '../../entities/model';
import { createEmptyModel } from '../../entities/model/defaults';
import type { DxfImportDiagnostics, DxfImportOptions, DxfLineInput } from './types';

interface NodeIndexResult {
  node: Node;
  isCreated: boolean;
}

export function createModelFromDxfLines(lines: DxfLineInput[], options: DxfImportOptions): {
  model: GridEngModel;
  diagnostics: DxfImportDiagnostics;
} {
  const warnings: string[] = [];
  const allPoints = lines.flatMap((line) => [line.start, line.end]);
  const modelHasNonZeroZ = hasNonZeroZ(allPoints);

  let normalizedLines = lines.map((line) => ({ ...line }));

  if (!modelHasNonZeroZ && options.assumeXYWhen2D) {
    normalizedLines = normalizedLines.map((line) => ({
      ...line,
      start: { ...line.start, z: 0 },
      end: { ...line.end, z: 0 },
    }));
    warnings.push('DXF geometry is 2D. Imported as XY plane model with Z=0 and global Z axis upward.');
  }

  if (options.centerModelByXYProjection) {
    const centeredPoints = centerByXYProjection(normalizedLines.flatMap((line) => [line.start, line.end]));
    normalizedLines = normalizedLines.map((line, index) => ({
      ...line,
      start: centeredPoints[index * 2],
      end: centeredPoints[index * 2 + 1],
    }));
  }

  const model = createEmptyModel(stripDxfExtension(options.fileName));
  model.settings.nodeMergeToleranceMm = options.nodeMergeToleranceMm;
  model.settings.centerModelByXYProjection = options.centerModelByXYProjection;

  const nodeIndex = new SpatialNodeIndex(options.nodeMergeToleranceMm);
  const members = [];
  const colorProfileMap: Record<string, Id> = {};
  const layerMap: Record<string, string> = {};

  for (const [lineIndex, line] of normalizedLines.entries()) {
    const length = distance(line.start, line.end);
    if (length <= options.nodeMergeToleranceMm * 1e-3) {
      warnings.push(`Skipped near-zero length LINE at index ${lineIndex}.`);
      continue;
    }

    const start = nodeIndex.getOrCreate(line.start, buildSourceRef(line));
    const end = nodeIndex.getOrCreate(line.end, buildSourceRef(line));

    const colorKey = getColorKey(line);
    if (!colorProfileMap[colorKey]) {
      colorProfileMap[colorKey] = options.defaultProfileId;
    }
    if (line.layer && !layerMap[line.layer]) {
      layerMap[line.layer] = line.layer;
    }

    members.push({
      id: `m-${members.length + 1}`,
      startNodeId: start.node.id,
      endNodeId: end.node.id,
      profileId: colorProfileMap[colorKey],
      materialId: options.defaultMaterialId,
      groupId: colorKey,
      source: buildSourceRef(line),
    });
  }

  model.nodes = nodeIndex.nodes;
  model.members = members;
  model.importMeta = {
    source: 'dxf',
    dxf: {
      fileName: options.fileName,
      importedLineCount: members.length,
      skippedEntityCount: Math.max(0, lines.length - members.length),
      hasNonZeroZ: modelHasNonZeroZ,
      assumedOrientation: modelHasNonZeroZ ? undefined : 'XY_Z_UP',
      toleranceMm: options.nodeMergeToleranceMm,
      colorProfileMap,
      layerMap,
      warnings,
    },
  };

  return {
    model,
    diagnostics: {
      importedLineCount: members.length,
      skippedEntityCount: Math.max(0, lines.length - members.length),
      createdNodeCount: model.nodes.length,
      createdMemberCount: model.members.length,
      hasNonZeroZ: modelHasNonZeroZ,
      warnings,
    },
  };
}

class SpatialNodeIndex {
  private readonly buckets = new Map<string, Node[]>();
  readonly nodes: Node[] = [];

  constructor(private readonly toleranceMm: number) {}

  getOrCreate(position: Vec3, source?: SourceRef): NodeIndexResult {
    const bucketKeys = this.getNeighborBucketKeys(position);

    for (const key of bucketKeys) {
      const candidates = this.buckets.get(key) ?? [];
      const existing = candidates.find((node) => distance(node.position, position) <= this.toleranceMm);
      if (existing) {
        return { node: existing, isCreated: false };
      }
    }

    const node: Node = {
      id: `n-${this.nodes.length + 1}`,
      position,
      source,
    };
    this.nodes.push(node);

    const ownKey = this.getBucketKey(position);
    const bucket = this.buckets.get(ownKey) ?? [];
    bucket.push(node);
    this.buckets.set(ownKey, bucket);

    return { node, isCreated: true };
  }

  private getNeighborBucketKeys(position: Vec3): string[] {
    const base = this.getBucketCoords(position);
    const keys: string[] = [];
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dz = -1; dz <= 1; dz += 1) {
          keys.push(`${base.x + dx}:${base.y + dy}:${base.z + dz}`);
        }
      }
    }
    return keys;
  }

  private getBucketKey(position: Vec3): string {
    const coords = this.getBucketCoords(position);
    return `${coords.x}:${coords.y}:${coords.z}`;
  }

  private getBucketCoords(position: Vec3): Vec3 {
    const cell = this.toleranceMm;
    return {
      x: Math.floor(position.x / cell),
      y: Math.floor(position.y / cell),
      z: Math.floor(position.z / cell),
    };
  }
}

function buildSourceRef(line: DxfLineInput): SourceRef {
  return {
    source: 'dxf',
    layer: line.layer,
    colorIndex: line.colorIndex,
    trueColor: line.trueColor,
    entityHandle: line.handle,
  };
}

function getColorKey(line: DxfLineInput): string {
  if (line.trueColor) {
    return `trueColor:${line.trueColor}`;
  }
  if (typeof line.colorIndex === 'number') {
    return `aci:${line.colorIndex}`;
  }
  return 'aci:default';
}

function distance(start: Vec3, end: Vec3): number {
  return Math.hypot(end.x - start.x, end.y - start.y, end.z - start.z);
}

function stripDxfExtension(fileName: string): string {
  return fileName.replace(/\.dxf$/i, '');
}
