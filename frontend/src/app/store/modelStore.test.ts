import { beforeEach, describe, expect, it } from 'vitest';

import { createSampleTowerSegmentModel } from '../../entities/model';
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
      nominalPressurePa: 850,
      terrainType: 'C',
      gammaF: 1.4,
      calculationMode: 'sp20',
      comment: '  test wind  ',
    });

    expect(firstUpdate.ok).toBe(true);
    expect(useModelStore.getState().model.loadCases[0].wind).toEqual({
      direction: { x: 0, y: 1, z: 0 },
      nominalPressurePa: 850,
      terrainType: 'C',
      gammaF: 1.4,
      calculationMode: 'sp20',
      comment: 'test wind',
    });

    const secondUpdate = useModelStore.getState().updateLoadCaseWind('lc-1', {
      direction: { x: 0, y: 0, z: 0 },
    });

    expect(secondUpdate.ok).toBe(true);
    expect(useModelStore.getState().model.loadCases[0].wind).toEqual({
      direction: { x: 0, y: 0, z: 0 },
      nominalPressurePa: 850,
      terrainType: 'C',
      gammaF: 1.4,
      calculationMode: 'sp20',
      comment: 'test wind',
    });
  });

  it('tracks active load case and falls back to the first existing one on model replace', () => {
    const model = createSampleTowerSegmentModel();
    const secondLoadCase = {
      ...model.loadCases[0],
      id: 'lc-2',
      name: 'Secondary',
      loads: model.loadCases[0].loads.map((load, index) => ({
        ...load,
        id: `lc2-load-${index + 1}`,
        name: `${load.name} LC2`,
      })),
    };

    useModelStore.getState().setModel({
      ...model,
      loadCases: [model.loadCases[0], secondLoadCase],
    });

    expect(useModelStore.getState().activeLoadCaseId).toBe('lc-1');

    useModelStore.getState().setActiveLoadCaseId('lc-2');
    expect(useModelStore.getState().activeLoadCaseId).toBe('lc-2');

    useModelStore.getState().setModel({
      ...model,
      loadCases: [model.loadCases[0]],
    });

    expect(useModelStore.getState().activeLoadCaseId).toBe('lc-1');
  });

  it('synchronizes active load case with load case and load selection', () => {
    const model = createSampleTowerSegmentModel();
    const secondLoadCase = {
      ...model.loadCases[0],
      id: 'lc-2',
      name: 'Secondary',
      loads: model.loadCases[0].loads.map((load, index) => ({
        ...load,
        id: `lc2-load-${index + 1}`,
        name: `${load.name} LC2`,
      })),
    };

    useModelStore.getState().setModel({
      ...model,
      loadCases: [model.loadCases[0], secondLoadCase],
    });

    useModelStore.getState().selectEntity({ type: 'loadCase', id: 'lc-2' });
    expect(useModelStore.getState().activeLoadCaseId).toBe('lc-2');

    useModelStore.getState().selectLoad('lc-1', model.loadCases[0].loads[0].id);
    expect(useModelStore.getState().activeLoadCaseId).toBe('lc-1');
  });

  it('adds and removes scene selections in additive mode', () => {
    const state = useModelStore.getState();
    const nodeId = state.model.nodes[0].id;
    const memberId = state.model.members[0].id;

    state.selectEntity({ type: 'node', id: nodeId });
    expect(useModelStore.getState().selectedEntities).toEqual([{ type: 'node', id: nodeId }]);

    state.selectEntity({ type: 'member', id: memberId }, { additive: true });
    expect(useModelStore.getState().selectedEntities).toEqual([
      { type: 'node', id: nodeId },
      { type: 'member', id: memberId },
    ]);
    expect(useModelStore.getState().selectedEntity).toEqual({ type: 'member', id: memberId });

    state.selectEntity({ type: 'node', id: nodeId }, { additive: true });
    expect(useModelStore.getState().selectedEntities).toEqual([{ type: 'member', id: memberId }]);
    expect(useModelStore.getState().selectedEntity).toEqual({ type: 'member', id: memberId });
  });

  it('clears the additive load selection set when the active load case changes', () => {
    const model = createSampleTowerSegmentModel();
    const secondLoadCase = {
      ...model.loadCases[0],
      id: 'lc-2',
      name: 'Secondary',
      loads: model.loadCases[0].loads.map((load, index) => ({
        ...load,
        id: `lc2-load-${index + 1}`,
        name: `${load.name} LC2`,
      })),
    };

    useModelStore.getState().setModel({
      ...model,
      loadCases: [model.loadCases[0], secondLoadCase],
    });

    useModelStore.getState().selectLoad('lc-1', model.loadCases[0].loads[0].id);
    expect(useModelStore.getState().selectedEntities).toHaveLength(1);

    useModelStore.getState().setActiveLoadCaseId('lc-2');
    expect(useModelStore.getState().selectedEntities).toEqual([{ type: 'loadCase', id: 'lc-2' }]);
    expect(useModelStore.getState().selectedEntity).toEqual({ type: 'loadCase', id: 'lc-2' });
  });
});
