import type { DxfColorValue, GridEngModel, Id, Vec3 } from '../../entities/model';

export const KEEP_DXF_CUSTOM_PROFILE_ID = '__custom__';

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
  profileId?: Id;
  temporaryProfileName?: string;
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
  warnings: string[];
  errors: string[];
}

export interface DxfToGridEngModelOptions extends DxfImportSettings {
  fileName: string;
}

export type DxfLineInput = DxfLineEntity;
export type DxfImportOptions = DxfToGridEngModelOptions;
export type DxfAssignedProfileId = Id | typeof KEEP_DXF_CUSTOM_PROFILE_ID;
export type DxfProfileAssignments = Record<string, DxfAssignedProfileId>;

export interface DxfToGridEngModelResult {
  model: GridEngModel | null;
  preview: DxfImportPreview;
}
