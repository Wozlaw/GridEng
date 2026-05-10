import type { Id, ProfileKind } from '../model';

export interface SectionCalculateRequest {
  profileKind: ProfileKind;
  name?: string;
  params: Record<string, number>;
  axis: 'YZ';
  materialId?: Id;
}

export interface SectionCalculateResponse {
  profileKind: ProfileKind;
  name?: string;
  params: Record<string, number>;
  areaMm2: number;
  IyMm4: number;
  IzMm4: number;
  JxMm4: number;
  WyMm3: number;
  WzMm3: number;
  WxMm3: number;
  massKgPerM: number;
  warnings?: string[];
}
