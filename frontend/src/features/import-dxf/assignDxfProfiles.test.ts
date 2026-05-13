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
