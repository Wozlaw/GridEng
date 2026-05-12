import { DEFAULT_STEEL, NO_WIND, createEmptyModel } from './defaults';
import type { AnalysisResults } from './results';
import type { GridEngModel, Profile } from './types';

const SAMPLE_PROFILES: Profile[] = [
  {
    id: 'profile-leg-L90x6',
    name: 'L90x6 leg',
    kind: 'L_equal',
    params: { b: 90, t: 6 },
    comment: 'Primary leg profile used in the tower shaft.',
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
      comment: 'Default construction steel for sample members.',
    },
  ];

  model.nodes = [
    { id: 'n-1', position: { x: -1000, y: -1000, z: 0 }, label: 'Base A', comment: 'Reference base corner.' },
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
    comment: index === 8 ? 'Main tower leg used in load sample.' : undefined,
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
      comment: 'Sample v0.2 load case with nodal and distributed loads.',
      wind: NO_WIND,
      loads: [
        {
          id: 'load-1',
          type: 'nodal_concentrated',
          kind: 'force',
          name: 'Top vertical force',
          comment: 'Vertical service force',
          coordinateSystem: 'global',
          direction: { x: 0, y: 0, z: -1 },
          target: { type: 'node', nodeId: 'n-7' },
          magnitude: 12000,
        },
        {
          id: 'load-2',
          type: 'nodal_concentrated',
          kind: 'moment',
          name: 'Top torsional moment',
          comment: 'Torsional test moment',
          coordinateSystem: 'global',
          direction: { x: 1, y: 0, z: 0 },
          target: { type: 'node', nodeId: 'n-6' },
          magnitude: 2500000,
        },
        {
          id: 'load-3',
          type: 'member_distributed',
          kind: 'force',
          name: 'Leg line load',
          comment: 'Temporary distributed force on the first leg.',
          coordinateSystem: 'global',
          direction: { x: 0, y: -1, z: 0 },
          target: { type: 'member', memberId: 'm-9' },
          distribution: {
            type: 'linear',
            qStart: 3,
            qEnd: 5.5,
            xStartRel: 0.15,
            xEndRel: 1,
          },
        },
      ],
    },
  ];

  const mockAnalysisResults: AnalysisResults = {
    loadCaseId: 'lc-1',
    nodeDisplacements: {
      'n-5': { ux: 1.2, uy: -0.6, uz: -3.1, rx: 0.0008, ry: -0.0011, rz: 0.0004 },
      'n-6': { ux: 1.5, uy: -0.4, uz: -3.4, rx: 0.0007, ry: -0.001, rz: 0.0005 },
      'n-7': { ux: 1.8, uy: -0.9, uz: -4.2, rx: 0.0012, ry: -0.0014, rz: 0.0007 },
      'n-8': { ux: 1.1, uy: -1.2, uz: -3.6, rx: 0.001, ry: -0.0012, rz: 0.0006 },
    },
    memberForces: {
      'm-9': { n: -118000, qy: 3200, qz: 700, my: 4200000, mz: 860000 },
      'm-10': { n: -109500, qy: 2800, qz: 900, my: 3970000, mz: 920000 },
      'm-13': { n: 46200, qy: -1900, qz: 600, mx: 210000, my: 760000 },
      'm-19': { n: 43800, qy: -1500, qz: 540, mx: 195000, my: 702000 },
    },
    memberStresses: {
      'm-9': { sigmaMaxMPa: 132, utilization: 0.54 },
      'm-10': { sigmaMaxMPa: 148, utilization: 0.6 },
      'm-11': { sigmaMaxMPa: 157, utilization: 0.64 },
      'm-12': { sigmaMaxMPa: 141, utilization: 0.58 },
      'm-13': { sigmaMaxMPa: 96, utilization: 0.39 },
      'm-15': { sigmaMaxMPa: 118, utilization: 0.48 },
      'm-17': { sigmaMaxMPa: 173, utilization: 0.71 },
      'm-19': { sigmaMaxMPa: 162, utilization: 0.66 },
    },
  };

  model.results = [mockAnalysisResults];
  model.importMeta = { source: 'manual' };

  return model;
}
