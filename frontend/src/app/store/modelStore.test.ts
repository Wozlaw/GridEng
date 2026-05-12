import { beforeEach, describe, expect, it } from 'vitest';

import { useModelStore } from './modelStore';

describe('modelStore', () => {
  beforeEach(() => {
    useModelStore.getState().resetToSampleModel();
    useModelStore.getState().clearSelection();
  });

  it('normalizes unsupported deformed view mode to wireframe', () => {
    useModelStore.getState().setViewMode('deformed');

    expect(useModelStore.getState().viewMode).toBe('wireframe');
  });

  it('normalizes wind direction and keeps zero vector as disabled wind', () => {
    const firstUpdate = useModelStore.getState().updateLoadCaseWind('lc-1', {
      direction: { x: 0, y: 12, z: 0 },
      nominalPressureKPa: 0.85,
      comment: '  test wind  ',
    });

    expect(firstUpdate.ok).toBe(true);
    expect(useModelStore.getState().model.loadCases[0].wind).toEqual({
      direction: { x: 0, y: 1, z: 0 },
      nominalPressureKPa: 0.85,
      comment: 'test wind',
    });

    const secondUpdate = useModelStore.getState().updateLoadCaseWind('lc-1', {
      direction: { x: 0, y: 0, z: 0 },
    });

    expect(secondUpdate.ok).toBe(true);
    expect(useModelStore.getState().model.loadCases[0].wind.direction).toEqual({
      x: 0,
      y: 0,
      z: 0,
    });
  });
});
