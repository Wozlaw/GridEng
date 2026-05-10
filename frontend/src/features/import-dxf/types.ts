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
  profileId?: Id;
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

export interface DxfToGridEngModelResult {
  model: GridEngModel | null;
  preview: DxfImportPreview;
}
