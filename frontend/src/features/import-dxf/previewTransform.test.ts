import { describe, expect, it } from 'vitest';

import type { GridEngModel } from '../../entities/model';
import {
  applyDxfPreviewDisplayStateToModel,
  buildDxfPreviewDisplayState,
  type DxfPreviewRotationDeg,
} from './previewTransform';
import type { DxfImportPreview } from './types';

const BASE_PREVIEW: DxfImportPreview = {
  linesCount: 1,
  ignoredEntitiesCount: 0,
  is3D: true,
  zRange: { min: -5, max: 15 },
  nodesCount: 2,
  membersCount: 1,
  mergedNodesCount: 0,
  danglingMembersCount: 0,
  colorGroups: [],
  diagnostics: {
    summary: [],
    lines: [
      {
        lineIndex: 0,
        start: { x: 10, y: 20, z: -5 },
        end: { x: 20, y: 40, z: 15 },
        status: 'ok',
        diagnostics: [],
      },
    ],
    members: [],
    nodes: [],
    groups: [],
  },
  warnings: [],
  errors: [],
};

const BASE_MODEL: GridEngModel = {
  schemaVersion: '0.2',
  name: 'DXF preview model',
  units: {
    length: 'mm',
    force: 'N',
    moment: 'Nmm',
    stress: 'MPa',
    pressure: 'Pa',
    mass: 'kg',
  },
  settings: {
    nodeMergeToleranceMm: 1,
    centerModelByXYProjection: false,
    verticalAxis: 'Z',
  },
  nodes: [
    { id: 'N1', position: { x: 10, y: 20, z: -5 } },
    { id: 'N2', position: { x: 20, y: 40, z: 15 } },
  ],
  members: [
    { id: 'M1', startNodeId: 'N1', endNodeId: 'N2', profileId: 'P1', materialId: 'MAT1' },
  ],
  profiles: [],
  materials: [],
  restraints: [],
  loadCases: [],
};

describe('dxf preview transform', () => {
  it('normalizes preview lines to Z >= 0 and XY-centered display state', () => {
    const displayState = buildDxfPreviewDisplayState(BASE_PREVIEW, { x: 0, y: 0, z: 0 });

    expect(displayState).not.toBeNull();
    expect(displayState?.bounds?.min.z).toBe(0);
    expect(displayState?.bounds?.center.x).toBe(0);
    expect(displayState?.bounds?.center.y).toBe(0);
  });

  it('rotates preview lines around Z before normalization', () => {
    const rotationDeg: DxfPreviewRotationDeg = { x: 0, y: 0, z: 90 };
    const displayState = buildDxfPreviewDisplayState(BASE_PREVIEW, rotationDeg);

    expect(displayState).not.toBeNull();
    expect(displayState?.rotationDeg.z).toBe(90);
    expect(displayState?.lines[0]?.start.x).toBeCloseTo(10, 6);
    expect(displayState?.lines[0]?.end.x).toBeCloseTo(-10, 6);
  });

  it('applies the same display transform to the imported model nodes', () => {
    const displayState = buildDxfPreviewDisplayState(BASE_PREVIEW, { x: 90, y: 0, z: 0 });
    const nextModel = applyDxfPreviewDisplayStateToModel(BASE_MODEL, displayState);
    const zValues = nextModel.nodes.map((node) => node.position.z);
    const xCenter = (nextModel.nodes[0].position.x + nextModel.nodes[1].position.x) / 2;
    const yCenter = (nextModel.nodes[0].position.y + nextModel.nodes[1].position.y) / 2;

    expect(Math.min(...zValues)).toBeCloseTo(0, 6);
    expect(xCenter).toBeCloseTo(0, 6);
    expect(yCenter).toBeCloseTo(0, 6);
  });
});
