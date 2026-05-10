import { createEmptyModel } from './defaults';
import type { GridEngModel } from './types';

export function createSampleTowerSegmentModel(): GridEngModel {
  const model = createEmptyModel('Sample tower segment');

  model.nodes = [
    { id: 'n-1', position: { x: -1000, y: -1000, z: 0 } },
    { id: 'n-2', position: { x: 1000, y: -1000, z: 0 } },
    { id: 'n-3', position: { x: 1000, y: 1000, z: 0 } },
    { id: 'n-4', position: { x: -1000, y: 1000, z: 0 } },
    { id: 'n-5', position: { x: -600, y: -600, z: 3000 } },
    { id: 'n-6', position: { x: 600, y: -600, z: 3000 } },
    { id: 'n-7', position: { x: 600, y: 600, z: 3000 } },
    { id: 'n-8', position: { x: -600, y: 600, z: 3000 } },
  ];

  model.members = [
    ['n-1', 'n-2'], ['n-2', 'n-3'], ['n-3', 'n-4'], ['n-4', 'n-1'],
    ['n-5', 'n-6'], ['n-6', 'n-7'], ['n-7', 'n-8'], ['n-8', 'n-5'],
    ['n-1', 'n-5'], ['n-2', 'n-6'], ['n-3', 'n-7'], ['n-4', 'n-8'],
    ['n-1', 'n-6'], ['n-2', 'n-5'], ['n-2', 'n-7'], ['n-3', 'n-6'],
    ['n-3', 'n-8'], ['n-4', 'n-7'], ['n-4', 'n-5'], ['n-1', 'n-8'],
  ].map(([startNodeId, endNodeId], index) => ({
    id: `m-${index + 1}`,
    startNodeId,
    endNodeId,
    profileId: model.profiles[0].id,
    materialId: model.materials[0].id,
  }));

  model.restraints = ['n-1', 'n-2', 'n-3', 'n-4'].map((nodeId, index) => ({
    id: `r-${index + 1}`,
    nodeId,
    ux: true,
    uy: true,
    uz: true,
    rx: true,
    ry: true,
    rz: true,
  }));

  model.loadCases[0].wind = {
    direction: { x: 1, y: 0, z: 0 },
    nominalPressureKPa: 0.38,
  };

  return model;
}
