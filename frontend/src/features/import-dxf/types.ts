import type { DxfColorValue, GridEngModel, Id, Vec3 } from '../../entities/model';

export interface DxfImportSettings {
  toleranceMm: number;
  centerOnXY: boolean;
  force2DToXY: boolean;
}

export interface DxfLineEntity {
  start: Vec3;
  end: Vec3;
  color?: DxfColorValue;
  colorIndex?: number;
  trueColor?: DxfColorValue;
  layer?: string;
  handle?: string;
}

export interface DxfColorGroup {
  key: string;
  color?: DxfColorValue;
  colorIndex?: number;
  trueColor?: DxfColorValue;
  layer?: string;
  membersCount: number;
  memberIds: Id[];
  profileId?: Id;
  temporaryProfileName?: string;
}

export type DxfPreviewDiagnosticStatus = 'ok' | 'info' | 'warning' | 'error';

export type DxfPreviewDiagnosticCode =
  | 'file_read_error'
  | 'unexpected_import_error'
  | 'no_line_entities'
  | 'ignored_entities_present'
  | 'recognized_as_2d'
  | 'recognized_as_2d_projected'
  | 'line_node_mapping_failed'
  | 'line_zero_length_after_merge'
  | 'member_hanging'
  | 'node_isolated'
  | 'group_profile_unassigned'
  | 'group_material_unassigned';

export interface DxfPreviewDiagnostic {
  status: DxfPreviewDiagnosticStatus;
  code: DxfPreviewDiagnosticCode;
  message: string;
}

export interface DxfLinePreviewDiagnostics {
  lineIndex: number;
  start: Vec3;
  end: Vec3;
  handle?: string;
  layer?: string;
  groupKey?: string;
  memberId?: Id;
  displayColor?: string;
  status: DxfPreviewDiagnosticStatus;
  diagnostics: DxfPreviewDiagnostic[];
}

export interface DxfMemberPreviewDiagnostics {
  memberId: Id;
  lineIndex: number;
  startNodeId: Id;
  endNodeId: Id;
  handle?: string;
  layer?: string;
  groupKey: string;
  status: DxfPreviewDiagnosticStatus;
  diagnostics: DxfPreviewDiagnostic[];
}

export interface DxfNodePreviewDiagnostics {
  nodeId: Id;
  status: DxfPreviewDiagnosticStatus;
  diagnostics: DxfPreviewDiagnostic[];
}

export interface DxfGroupPreviewDiagnostics {
  groupKey: string;
  profileId?: Id;
  temporaryProfileName?: string;
  layer?: string;
  memberIds: Id[];
  status: DxfPreviewDiagnosticStatus;
  diagnostics: DxfPreviewDiagnostic[];
}

export interface DxfPreviewDiagnostics {
  summary: DxfPreviewDiagnostic[];
  lines: DxfLinePreviewDiagnostics[];
  members: DxfMemberPreviewDiagnostics[];
  nodes: DxfNodePreviewDiagnostics[];
  groups: DxfGroupPreviewDiagnostics[];
}

export interface DxfImportPreview {
  linesCount: number;
  ignoredEntitiesCount: number;
  is3D: boolean;
  zRange: { min: number; max: number } | null;
  nodesCount: number;
  membersCount: number;
  mergedNodesCount: number;
  danglingMembersCount: number;
  colorGroups: DxfColorGroup[];
  diagnostics: DxfPreviewDiagnostics;
  warnings: string[];
  errors: string[];
}

export type DxfPreviewColorMode = 'diagnostics' | 'profiles';

export interface DxfToGridEngModelOptions extends DxfImportSettings {
  fileName: string;
}

export type DxfLineInput = DxfLineEntity;
export type DxfImportOptions = DxfToGridEngModelOptions;
export type DxfProfileAssignments = Partial<Record<string, Id>>;
export type DxfMaterialAssignments = Partial<Record<string, Id>>;
export type DxfGroupDisplayColors = Partial<Record<string, string>>;

export interface DxfToGridEngModelResult {
  model: GridEngModel | null;
  preview: DxfImportPreview;
}
