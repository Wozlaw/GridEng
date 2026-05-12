import type { Restraint } from '../../entities/model';

export const EMPTY_RESTRAINT_STATE = {
  ux: false,
  uy: false,
  uz: false,
  rx: false,
  ry: false,
  rz: false,
};

export type RestraintState = Pick<Restraint, keyof typeof EMPTY_RESTRAINT_STATE>;

export interface LoadEditorDraft {
  name: string;
  comment: string;
  type: 'nodal_concentrated' | 'member_distributed';
  kind: 'force' | 'moment';
  direction: Record<'x' | 'y' | 'z', string>;
  targetNodeId: string;
  targetMemberId: string;
  magnitude: string;
  qStart: string;
  qEnd: string;
  xStartRel: string;
  xEndRel: string;
  distributionType: 'linear' | 'function';
}
