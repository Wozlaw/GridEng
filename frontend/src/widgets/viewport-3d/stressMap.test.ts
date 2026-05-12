import { describe, expect, it } from 'vitest';

import { createSampleTowerSegmentModel } from '../../entities/model';
import type { AnalysisResults } from '../../entities/model';
import {
  formatStressLegendValue,
  getMemberStressColor,
  resolveStressMapState,
} from './stressMap';

describe('stressMap helpers', () => {
  it('prefers utilization when it is available', () => {
    const model = createSampleTowerSegmentModel();
    const state = resolveStressMapState(model.results, 'lc-1');

    expect(state).not.toBeNull();
    expect(state?.range).toEqual({
      kind: 'utilization',
      min: 0.39,
      max: 0.71,
    });
    expect(getMemberStressColor(model.members[8], state)).toMatch(/^#[0-9a-f]{6}$/);
    expect(formatStressLegendValue(0.64, 'utilization')).toBe('64%');
  });

  it('falls back to sigmaMaxMPa when utilization is missing', () => {
    const sigmaOnlyResults: AnalysisResults[] = [
      {
        loadCaseId: 'lc-sigma',
        nodeDisplacements: {},
        memberForces: {},
        memberStresses: {
          'm-1': { sigmaMaxMPa: 85 },
          'm-2': { sigmaMaxMPa: 140 },
        },
      },
    ];

    const state = resolveStressMapState(sigmaOnlyResults, 'lc-sigma');

    expect(state).not.toBeNull();
    expect(state?.range).toEqual({
      kind: 'sigmaMaxMPa',
      min: 85,
      max: 140,
    });
    expect(formatStressLegendValue(140, 'sigmaMaxMPa')).toBe('140 MPa');
  });
});
