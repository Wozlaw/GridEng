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
          memberIds: ['M1', 'M2'],
        }),
      ]),
    );
    expect(result.preview.diagnostics.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          memberId: 'M1',
          groupKey: 'ACI_1',
          status: 'warning',
        }),
        expect.objectContaining({
          memberId: 'M2',
          groupKey: 'ACI_1',
          status: 'warning',
        }),
      ]),
    );
    expect(result.preview.diagnostics.lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lineIndex: 0,
          memberId: 'M1',
          displayColor: undefined,
          status: 'warning',
        }),
        expect.objectContaining({
          lineIndex: 1,
          memberId: 'M2',
          status: 'warning',
        }),
      ]),
    );
    expect(result.preview.diagnostics.groups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          groupKey: 'ACI_1',
          status: 'warning',
          diagnostics: expect.arrayContaining([
            expect.objectContaining({
              code: 'group_profile_unassigned',
            }),
          ]),
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

  it('reports zero-length lines after merge as structured line diagnostics', () => {
    const lines: DxfLineEntity[] = [
      {
        start: { x: 0, y: 0, z: 0 },
        end: { x: 0.2, y: 0, z: 0 },
        colorIndex: 3,
        layer: 'ERR',
        handle: 'ZZ',
      },
    ];

    const result = createModelFromDxfLines(lines, {
      fileName: 'bad.dxf',
      toleranceMm: 1,
      centerOnXY: false,
      force2DToXY: true,
    });

    expect(result.model).toBeNull();
    expect(result.preview.diagnostics.lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lineIndex: 0,
          status: 'error',
          diagnostics: expect.arrayContaining([
            expect.objectContaining({
              code: 'line_zero_length_after_merge',
            }),
          ]),
        }),
      ]),
    );
  });
});
