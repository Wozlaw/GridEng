import { describe, expect, it } from 'vitest';

import type { DxfImportPreview } from './types';
import {
  applyDxfProfileAssignments,
  applyDxfProfileAssignmentsToPreview,
} from './assignDxfProfiles';
import { createModelFromDxfLines } from './dxfToGridEngModel';

describe('applyDxfProfileAssignments', () => {
  it('rebinds imported members to catalog profiles and updates DXF mapping', () => {
    const result = createModelFromDxfLines(
      [
        {
          start: { x: 0, y: 0, z: 0 },
          end: { x: 1000, y: 0, z: 0 },
          colorIndex: 1,
          layer: 'LEG',
          handle: 'AA',
        },
      ],
      {
        fileName: 'tower.dxf',
        toleranceMm: 1,
        centerOnXY: false,
        force2DToXY: true,
      },
    );

    expect(result.model).not.toBeNull();

    const nextModel = applyDxfProfileAssignments(result.model!, {
      ACI_1: 'catalog-L63x5',
    });

    expect(nextModel.members[0]?.profileId).toBe('catalog-L63x5');
    expect(nextModel.profiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'catalog-L63x5',
          kind: 'L_equal',
        }),
      ]),
    );
    expect(nextModel.importMeta?.dxf?.colorProfileMap).toEqual({
      ACI_1: 'catalog-L63x5',
    });
  });

  it('uses resolved catalog profiles when assignment ids are absent in the local fixture catalog', () => {
    const result = createModelFromDxfLines(
      [
        {
          start: { x: 0, y: 0, z: 0 },
          end: { x: 1000, y: 0, z: 0 },
          colorIndex: 1,
        },
      ],
      {
        fileName: 'tower.dxf',
        toleranceMm: 1,
        centerOnXY: false,
        force2DToXY: true,
      },
    );

    const resolvedProfilesById = new Map([
      [
        'api-profile-1',
        {
          id: 'api-profile-1',
          name: 'API Angle 75x6',
          kind: 'L_equal' as const,
          params: { b: 75, h: 75, t: 6 },
          defaultLocalAxisRotationDeg: 0,
          defaultOffsetYmm: 0,
          defaultOffsetZmm: 0,
          massKgPerM: 6.8,
          section: {
            areaMm2: 865,
            IyMm4: 433000,
            IzMm4: 170000,
            JxMm4: 9800,
            WyMm3: 11500,
            WzMm3: 4500,
            WxMm3: 1900,
          },
          color: '#4cc9f0',
        },
      ],
    ]);

    const nextModel = applyDxfProfileAssignments(
      result.model!,
      {
        ACI_1: 'api-profile-1',
      },
      resolvedProfilesById,
    );

    expect(nextModel.members[0]?.profileId).toBe('api-profile-1');
    expect(nextModel.profiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'api-profile-1',
          name: 'API Angle 75x6',
        }),
      ]),
    );
  });

  it('clears group-level unassigned diagnostics after catalog profile selection', () => {
    const preview: DxfImportPreview = {
      linesCount: 1,
      ignoredEntitiesCount: 0,
      is3D: false,
      zRange: null,
      nodesCount: 2,
      membersCount: 1,
      mergedNodesCount: 0,
      danglingMembersCount: 0,
      colorGroups: [
        {
          key: 'ACI_1',
          colorIndex: 1,
          membersCount: 1,
          memberIds: ['M1'],
          profileId: 'P_COLOR_ACI_1',
          temporaryProfileName: 'DXF ACI_1',
        },
      ],
      diagnostics: {
        summary: [],
        lines: [
          {
            lineIndex: 0,
            start: { x: 0, y: 0, z: 0 },
            end: { x: 1000, y: 0, z: 0 },
            memberId: 'M1',
            groupKey: 'ACI_1',
            status: 'warning',
            diagnostics: [],
          },
        ],
        members: [
          {
            memberId: 'M1',
            lineIndex: 0,
            startNodeId: 'N1',
            endNodeId: 'N2',
            groupKey: 'ACI_1',
            status: 'ok',
            diagnostics: [],
          },
        ],
        nodes: [],
        groups: [
          {
            groupKey: 'ACI_1',
            profileId: 'P_COLOR_ACI_1',
            memberIds: ['M1'],
            status: 'warning',
            diagnostics: [
              {
                status: 'warning',
                code: 'group_profile_unassigned',
                message: 'Group ACI_1 still uses temporary DXF profile.',
              },
            ],
          },
        ],
      },
      warnings: [],
      errors: [],
    };

    const nextPreview = applyDxfProfileAssignmentsToPreview(preview, {
      ACI_1: 'catalog-L63x5',
    });

    expect(nextPreview.colorGroups[0]?.profileId).toBe('catalog-L63x5');
    expect(nextPreview.diagnostics.groups[0]?.profileId).toBe('catalog-L63x5');
    expect(nextPreview.diagnostics.groups[0]?.status).toBe('ok');
    expect(nextPreview.diagnostics.groups[0]?.diagnostics).toHaveLength(0);
    expect(nextPreview.diagnostics.lines[0]?.status).toBe('ok');
  });
});
