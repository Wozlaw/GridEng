import type { ProfileKind, SectionProperties } from '../model';

export interface SectionCalculationRequestV1 {
  schemaVersion: 'sections.calculate.v1';
  profile: {
    kind: ProfileKind;
    name?: string;
    params: Record<string, number>;
    /** Rotation around profile/member local X axis, degrees. */
    localAxisRotationDeg?: number;
    /** Offset in local Y axis, mm. */
    offsetYmm?: number;
    /** Offset in local Z axis, mm. */
    offsetZmm?: number;
  };
  material?: {
    densityKgPerM3?: number;
  };
}

export interface SectionCalculationResponseV1 {
  schemaVersion: 'sections.calculate.v1';
  profile: {
    name: string;
    kind: ProfileKind;
    params: Record<string, number>;
  };
  section: SectionProperties;
  massKgPerM?: number;
  warnings: string[];
}

export const SECTION_CALCULATION_ENDPOINT = '/api/sections/calculate';
