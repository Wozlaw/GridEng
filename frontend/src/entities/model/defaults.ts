import type {
  ForceMomentVector,
  GridEngModel,
  Material,
  Profile,
  UnitSystem,
  Vec3,
  WindCalculationMode,
  WindLoadDefinition,
  WindTerrainType,
} from './types';

export const ZERO_VEC3: Vec3 = Object.freeze({ x: 0, y: 0, z: 0 });

export const ZERO_FORCE_MOMENT: ForceMomentVector = Object.freeze({
  force: ZERO_VEC3,
  moment: ZERO_VEC3,
});

export const DEFAULT_WIND_TERRAIN_TYPE: WindTerrainType = 'B';
export const DEFAULT_WIND_CALCULATION_MODE: WindCalculationMode = 'simple';
export const DEFAULT_WIND_GAMMA_F_BY_MODE: Readonly<Record<WindCalculationMode, number>> = Object.freeze({
  simple: 1.0,
  sp20: 1.4,
  pue: 1.2,
});

export const NO_WIND: WindLoadDefinition = Object.freeze({
  direction: ZERO_VEC3,
  nominalPressurePa: 0,
  terrainType: DEFAULT_WIND_TERRAIN_TYPE,
  gammaF: DEFAULT_WIND_GAMMA_F_BY_MODE.simple,
  calculationMode: DEFAULT_WIND_CALCULATION_MODE,
});

export const DEFAULT_UNITS: UnitSystem = Object.freeze({
  length: 'mm',
  force: 'N',
  moment: 'Nmm',
  stress: 'MPa',
  pressure: 'Pa',
  mass: 'kg',
});

export const DEFAULT_STEEL: Material = Object.freeze({
  id: 'mat-steel-c245',
  name: 'Steel C245',
  elasticModulusMPa: 206000,
  poissonRatio: 0.3,
  densityKgPerM3: 7850,
  yieldStrengthMPa: 245,
});

export const DEFAULT_PROFILE: Profile = Object.freeze({
  id: 'profile-default-L50x5',
  name: 'L50x5 placeholder',
  kind: 'L_equal',
  params: { b: 50, t: 5 },
  defaultLocalAxisRotationDeg: 0,
  defaultOffsetYmm: 0,
  defaultOffsetZmm: 0,
  section: {},
  color: '#1976d2',
});

export function createEmptyModel(name = 'Untitled GridEng model'): GridEngModel {
  return {
    schemaVersion: '0.2',
    name,
    units: DEFAULT_UNITS,
    settings: {
      nodeMergeToleranceMm: 1,
      centerModelByXYProjection: true,
      verticalAxis: 'Z',
    },
    nodes: [],
    members: [],
    profiles: [DEFAULT_PROFILE],
    materials: [DEFAULT_STEEL],
    restraints: [],
    loadCases: [
      {
        id: 'lc-1',
        name: 'LC1',
        loads: [],
        wind: NO_WIND,
      },
    ],
    importMeta: { source: 'manual' },
  };
}
