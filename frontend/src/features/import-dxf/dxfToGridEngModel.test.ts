import { describe, expect, it } from 'vitest';

import { createModelFromDxfLines } from './dxfToGridEngModel';
import type { DxfLineEntity } from './types';

describe('createModelFromDxfLines', () => {
  it('builds a model preview and preserves DXF source metadata', () => {
    const lines: DxfLineEntity[] = [
      {
        start: { x: 0, y: 0, z: 0 },
        end: { x: 1000, y: 0, z: 0 },
        colorIndex: 1,
        layer: 'LEG',
        handle: 'AA',
      },
      {
        start: { x: 1000.2, y: 0, z: 0 },
        end: { x: 2000, y: 0, z: 0 },
        colorIndex: 1,
        layer: 'LEG',
        handle: 'AB',
      },
    ];

    const result = createModelFromDxfLines(lines, {
      fileName: 'tower.dxf',
      toleranceMm: 1,
      centerOnXY: false,
      force2DToXY: true,
    });

    expect(result.model).not.toBeNull();
    expect(result.preview.linesCount).toBe(2);
    expect(result.preview.nodesCount).toBe(3);
    expect(result.preview.membersCount).toBe(2);
    expect(result.preview.mergedNodesCount).toBe(1);
    expect(result.preview.colorGroups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'ACI_1',
          layer: 'LEG',
          membersCount: 2,
        }),
      ]),
    );

    expect(result.model?.name).toBe('tower');
    expect(result.model?.members[0].source).toEqual(
      expect.objectContaining({
        source: 'dxf',
        entityType: 'LINE',
        colorIndex: 1,
        layer: 'LEG',
        handle: 'AA',
      }),
    );
    expect(result.model?.importMeta?.dxf?.colorProfileMap).toEqual({
      ACI_1: 'P_COLOR_ACI_1',
    });
  });
});
