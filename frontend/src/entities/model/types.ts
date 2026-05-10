export type Id = string;

export type LengthUnit = 'mm' | 'm';
export type ForceUnit = 'N' | 'kN';
export type MomentUnit = 'Nmm' | 'kNm';
export type StressUnit = 'MPa';
export type PressureUnit = 'kPa';
export type MassUnit = 'kg';

export interface UnitSystem {
  length: LengthUnit;
  force: ForceUnit;
  moment: MomentUnit;
  stress: StressUnit;
  pressure: PressureUnit;
  mass: MassUnit;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Force vector components in model.units.force. */
export type ForceVector = Vec3;

/** Moment vector components in model.units.moment. */
export type MomentVector = Vec3;

export interface ForceMomentVector {
  force: ForceVector;
  moment: MomentVector;
}

export interface WindLoadDefinition {
  /** Direction vector. Zero vector means wind is disabled for this model/load case. */
  direction: Vec3;
  /** Nominal wind pressure in kPa. Zero means wind pressure is not specified. */
  nominalPressureKPa: number;
  /** Optional human-readable note for imported or hand-authored wind data. */
  comment?: string;
}

export interface Node {
  id: Id;
  position: Vec3;
  label?: string;
  source?: SourceRef;
}

export interface Member {
  id: Id;
  startNodeId: Id;
  endNodeId: Id;
  profileId: Id;
  materialId: Id;

  /** Override for profile.defaultLocalAxisRotationDeg around member local X axis, degrees. */
  localAxisRotationDeg?: number;

  /** Eccentricity / offset in member local Y axis, mm. */
  offsetYmm?: number;

  /** Eccentricity / offset in member local Z axis, mm. */
  offsetZmm?: number;

  groupId?: Id;
  label?: string;
  source?: SourceRef;
}

export type ProfileKind =
  | 'L_equal'
  | 'L_unequal'
  | 'U'
  | 'I'
  | 'pipe'
  | 'rect_pipe'
  | 'round_bar'
  | 'flat_bar'
  | 'custom';

export interface SectionProperties {
  /** Cross-section area, mm2. */
  areaMm2?: number;
  /** Moment of inertia about local X / torsional axis, mm4. */
  JxMm4?: number;
  /** Moment of inertia about local Y axis, mm4. */
  IyMm4?: number;
  /** Moment of inertia about local Z axis, mm4. */
  IzMm4?: number;
  /** Section modulus about local X axis, mm3. */
  WxMm3?: number;
  /** Section modulus about local Y axis, mm3. */
  WyMm3?: number;
  /** Section modulus about local Z axis, mm3. */
  WzMm3?: number;
}

export interface Profile {
  id: Id;
  name: string;
  kind: ProfileKind;
  params: Record<string, number>;

  /** Default rotation of the profile around member local X axis, degrees. */
  defaultLocalAxisRotationDeg: number;

  /** Default offset in member local Y axis, mm. */
  defaultOffsetYmm: number;

  /** Default offset in member local Z axis, mm. */
  defaultOffsetZmm: number;

  /** Linear mass, kg/m. */
  massKgPerM?: number;

  section: SectionProperties;
  color?: string;
}

export interface Material {
  id: Id;
  name: string;
  elasticModulusMPa?: number;
  shearModulusMPa?: number;
  poissonRatio?: number;
  densityKgPerM3?: number;
  yieldStrengthMPa?: number;
}

export interface Restraint {
  id: Id;
  nodeId: Id;
  /** Translations along global X/Y/Z. */
  ux: boolean;
  uy: boolean;
  uz: boolean;
  /** Rotations around global X/Y/Z. */
  rx: boolean;
  ry: boolean;
  rz: boolean;
}

export type LoadTarget =
  | { type: 'node'; nodeId: Id }
  | { type: 'member'; memberId: Id };

export interface ConcentratedLoad {
  id: Id;
  target: LoadTarget;
  vector: ForceMomentVector;
  description?: string;
}

export interface LoadCase {
  id: Id;
  name: string;
  loads: ConcentratedLoad[];
  wind: WindLoadDefinition;
}

export interface ModelSettings {
  /** Tolerance for merging DXF endpoints into structural nodes, mm. */
  nodeMergeToleranceMm: number;
  /** If true, imported coordinates are centered by the XY projection bounding box. */
  centerModelByXYProjection: boolean;
  /** Global vertical axis. For this project Z is always up. */
  verticalAxis: 'Z';
}

export type DxfColorValue = string | number;

export interface SourceRef {
  source: 'dxf' | 'json' | 'manual';
  entityType?: 'LINE';
  color?: DxfColorValue;
  layer?: string;
  colorIndex?: number;
  trueColor?: DxfColorValue;
  handle?: string;
}

export type DxfEntitySource = SourceRef & {
  source: 'dxf';
  entityType: 'LINE';
};

export interface DxfImportMeta {
  fileName: string;
  importedLineCount: number;
  skippedEntityCount: number;
  hasNonZeroZ: boolean;
  assumedOrientation?: 'XY_Z_UP';
  toleranceMm: number;
  colorProfileMap: Record<string, Id>;
  layerMap: Record<string, string>;
  warnings: string[];
}

export interface AnalysisResults {
  loadCaseId: Id;
  nodeDisplacements: Record<Id, {
    ux: number;
    uy: number;
    uz: number;
    rx: number;
    ry: number;
    rz: number;
  }>;
  memberForces: Record<Id, {
    n?: number;
    qy?: number;
    qz?: number;
    mx?: number;
    my?: number;
    mz?: number;
  }>;
  memberStresses: Record<Id, {
    sigmaMaxMPa: number;
    utilization?: number;
  }>;
}

export interface GridEngModel {
  schemaVersion: '0.1';
  name: string;
  units: UnitSystem;
  settings: ModelSettings;

  nodes: Node[];
  members: Member[];
  profiles: Profile[];
  materials: Material[];
  restraints: Restraint[];
  loadCases: LoadCase[];

  importMeta?: {
    source: 'dxf' | 'json' | 'manual';
    dxf?: DxfImportMeta;
  };

  results?: AnalysisResults;
}
