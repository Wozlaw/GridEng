import { DEFAULT_STEEL, NO_WIND, createEmptyModel } from './defaults';
import type { GridEngModel, Profile } from './types';

const SAMPLE_PROFILES: Profile[] = [
  {
    id: 'profile-leg-L90x6',
    name: 'L90x6 leg',
    kind: 'L_equal',
    params: { b: 90, t: 6 },
    defaultLocalAxisRotationDeg: 0,
    defaultOffsetYmm: 0,
    defaultOffsetZmm: 0,
    massKgPerM: 8.1,
    section: {
      areaMm2: 1030,
      IyMm4: 789000,
      IzMm4: 312000,
      JxMm4: 13800,
      WyMm3: 17600,
      WzMm3: 7000,
      WxMm3: 2300,
    },
    color: '#5ec7f8',
  },
  {
    id: 'profile-brace-pipe57x4',
    name: 'Pipe 57x4 brace',
    kind: 'pipe',
    params: { d: 57, t: 4 },
    defaultLocalAxisRotationDeg: 0,
    defaultOffsetYmm: 0,
    defaultOffsetZmm: 0,
    massKgPerM: 5.1,
    section: {
      areaMm2: 666,
      IyMm4: 244000,
      IzMm4: 244000,
      JxMm4: 488000,
      WyMm3: 8600,
      WzMm3: 8600,
      WxMm3: 17100,
    },
    color: '#63d9b6',
  },
  {
    id: 'profile-ring-flat80x8',
    name: 'Flat 80x8 ring',
    kind: 'flat_bar',
    params: { b: 80, t: 8 },
    defaultLocalAxisRotationDeg: 90,
    defaultOffsetYmm: 0,
    defaultOffsetZmm: 0,
    massKgPerM: 5.0,
    section: {
      areaMm2: 640,
      IyMm4: 341000,
      IzMm4: 27300,
      JxMm4: 1560,
      WyMm3: 8500,
      WzMm3: 680,
      WxMm3: 390,
    },
    color: '#f0b35b',
  },
];

export function createSampleTowerSegmentModel(): GridEngModel {
  const model = createEmptyModel('Sample tower segment');

  model.profiles = SAMPLE_PROFILES;
  model.materials = [
    {
      ...DEFAULT_STEEL,
      id: 'mat-steel-c245',
      name: 'Steel C245',
    },
  ];

  model.nodes = [
    { id: 'n-1', position: { x: -1000, y: -1000, z: 0 }, label: 'Base A' },
    { id: 'n-2', position: { x: 1000, y: -1000, z: 0 }, label: 'Base B' },
    { id: 'n-3', position: { x: 1000, y: 1000, z: 0 }, label: 'Base C' },
    { id: 'n-4', position: { x: -1000, y: 1000, z: 0 }, label: 'Base D' },
    { id: 'n-5', position: { x: -600, y: -600, z: 3000 }, label: 'Top A' },
    { id: 'n-6', position: { x: 600, y: -600, z: 3000 }, label: 'Top B' },
    { id: 'n-7', position: { x: 600, y: 600, z: 3000 }, label: 'Top C' },
    { id: 'n-8', position: { x: -600, y: 600, z: 3000 }, label: 'Top D' },
  ];

  model.members = [
    ['n-1', 'n-2', 'profile-ring-flat80x8'],
    ['n-2', 'n-3', 'profile-ring-flat80x8'],
    ['n-3', 'n-4', 'profile-ring-flat80x8'],
    ['n-4', 'n-1', 'profile-ring-flat80x8'],
    ['n-5', 'n-6', 'profile-ring-flat80x8'],
    ['n-6', 'n-7', 'profile-ring-flat80x8'],
    ['n-7', 'n-8', 'profile-ring-flat80x8'],
    ['n-8', 'n-5', 'profile-ring-flat80x8'],
    ['n-1', 'n-5', 'profile-leg-L90x6'],
    ['n-2', 'n-6', 'profile-leg-L90x6'],
    ['n-3', 'n-7', 'profile-leg-L90x6'],
    ['n-4', 'n-8', 'profile-leg-L90x6'],
    ['n-1', 'n-6', 'profile-brace-pipe57x4'],
    ['n-2', 'n-5', 'profile-brace-pipe57x4'],
    ['n-2', 'n-7', 'profile-brace-pipe57x4'],
    ['n-3', 'n-6', 'profile-brace-pipe57x4'],
    ['n-3', 'n-8', 'profile-brace-pipe57x4'],
    ['n-4', 'n-7', 'profile-brace-pipe57x4'],
    ['n-4', 'n-5', 'profile-brace-pipe57x4'],
    ['n-1', 'n-8', 'profile-brace-pipe57x4'],
  ].map(([startNodeId, endNodeId, profileId], index) => ({
    id: `m-${index + 1}`,
    startNodeId,
    endNodeId,
    profileId,
    materialId: model.materials[0].id,
    groupId: profileId,
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

  model.loadCases = [
    {
      id: 'lc-1',
      name: 'Assembly load case',
      wind: NO_WIND,
      loads: [
        {
          id: 'load-1',
          target: { type: 'node', nodeId: 'n-7' },
          vector: {
            force: { x: 0, y: 0, z: -12000 },
            moment: { x: 0, y: 0, z: 0 },
          },
          description: 'Vertical service force',
        },
        {
          id: 'load-2',
          target: { type: 'node', nodeId: 'n-6' },
          vector: {
            force: { x: 0, y: 0, z: 0 },
            moment: { x: 2500000, y: 0, z: 0 },
          },
          description: 'Torsional test moment',
        },
      ],
    },
  ];

  model.importMeta = { source: 'manual' };

  return model;
}
