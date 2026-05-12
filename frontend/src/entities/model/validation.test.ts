import { describe, expect, it } from 'vitest';

import { createSampleTowerSegmentModel } from './sample';
import { validateGridEngModelIntegrity } from './validation';

describe('validateGridEngModelIntegrity', () => {
  it('reports isolated nodes as warnings', () => {
    const model = createSampleTowerSegmentModel();
    model.nodes = [
      ...model.nodes,
      {
        id: 'n-isolated',
        position: { x: 9999, y: 9999, z: 9999 },
      },
    ];

    const report = validateGridEngModelIntegrity(model);

    expect(report.ok).toBe(true);
    expect(report.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'isolated_node',
          entityId: 'n-isolated',
        }),
      ]),
    );
  });

  it('flags reserved function distributions as unsupported placeholders', () => {
    const model = createSampleTowerSegmentModel();
    model.loadCases[0].loads.push({
      id: 'load-placeholder',
      type: 'member_distributed',
      kind: 'force',
      name: 'Function placeholder',
      coordinateSystem: 'global',
      direction: { x: 0, y: 1, z: 0 },
      target: { type: 'member', memberId: model.members[0].id },
      distribution: {
        type: 'function',
        expression: 'legacy_placeholder(x)',
      },
    });

    const report = validateGridEngModelIntegrity(model);

    expect(report.ok).toBe(true);
    expect(report.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'unsupported_load_placeholder',
          entityId: 'load-placeholder',
        }),
      ]),
    );
  });
});
