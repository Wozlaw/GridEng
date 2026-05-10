import type { Id, Node, Vec3 } from '../../entities/model';

import type { DxfLineEntity } from './types';

export interface DxfLineNodeMapping {
  startNodeId: Id;
  endNodeId: Id;
}

export interface MergeDxfNodesResult {
  nodes: Node[];
  endpointNodeIds: DxfLineNodeMapping[];
  mergedNodesCount: number;
}

interface BucketCoords {
  x: number;
  y: number;
  z: number;
}

export function mergeDxfNodes(lines: DxfLineEntity[], toleranceMm: number): MergeDxfNodesResult {
  if (!Number.isFinite(toleranceMm) || toleranceMm <= 0) {
    throw new Error('DXF node merge tolerance must be a positive finite number.');
  }

  const nodeGrid = new SpatialNodeGrid(toleranceMm);
  const endpointNodeIds = lines.map((line) => ({
    startNodeId: nodeGrid.getOrCreateNodeId(line.start),
    endNodeId: nodeGrid.getOrCreateNodeId(line.end),
  }));

  return {
    nodes: nodeGrid.nodes,
    endpointNodeIds,
    mergedNodesCount: lines.length * 2 - nodeGrid.nodes.length,
  };
}

class SpatialNodeGrid {
  private readonly buckets = new Map<string, Node[]>();
  private readonly toleranceMm: number;

  readonly nodes: Node[] = [];

  constructor(toleranceMm: number) {
    this.toleranceMm = toleranceMm;
  }

  getOrCreateNodeId(position: Vec3): Id {
    const existing = this.findExistingNode(position);
    if (existing != null) {
      return existing.id;
    }

    // Keep the first accepted endpoint as the canonical node position.
    // This makes node ids and coordinates deterministic for a stable DXF line order.
    const node: Node = {
      id: `N${this.nodes.length + 1}`,
      position: { ...position },
    };
    this.nodes.push(node);

    const bucketKey = this.getBucketKey(position);
    const bucket = this.buckets.get(bucketKey) ?? [];
    bucket.push(node);
    this.buckets.set(bucketKey, bucket);

    return node.id;
  }

  private findExistingNode(position: Vec3): Node | undefined {
    // Spatial hashing limits the search to the current bucket and its 26 neighbors.
    // That keeps lookup close to O(1) on large models instead of a full O(n^2) scan.
    for (const bucketKey of this.getNeighborBucketKeys(position)) {
      const candidates = this.buckets.get(bucketKey) ?? [];
      const match = candidates.find((node) => distanceMm(node.position, position) <= this.toleranceMm);
      if (match != null) {
        return match;
      }
    }

    return undefined;
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

  private getBucketCoords(position: Vec3): BucketCoords {
    return {
      x: Math.floor(position.x / this.toleranceMm),
      y: Math.floor(position.y / this.toleranceMm),
      z: Math.floor(position.z / this.toleranceMm),
    };
  }
}

function distanceMm(start: Vec3, end: Vec3): number {
  return Math.hypot(end.x - start.x, end.y - start.y, end.z - start.z);
}
