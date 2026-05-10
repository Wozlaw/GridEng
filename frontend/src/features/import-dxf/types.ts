import type { Id, Vec3 } from '../../entities/model';

export interface DxfLineInput {
  start: Vec3;
  end: Vec3;
  layer?: string;
  colorIndex?: number;
  trueColor?: string;
  handle?: string;
}

export interface DxfImportOptions {
  fileName: string;
  nodeMergeToleranceMm: number;
  centerModelByXYProjection: boolean;
  defaultProfileId: Id;
  defaultMaterialId: Id;
  /** Treat all near-zero Z coordinates as a 2D XY model with Z=0. */
  assumeXYWhen2D: boolean;
}

export interface DxfImportDiagnostics {
  importedLineCount: number;
  skippedEntityCount: number;
  createdNodeCount: number;
  createdMemberCount: number;
  hasNonZeroZ: boolean;
  warnings: string[];
}
