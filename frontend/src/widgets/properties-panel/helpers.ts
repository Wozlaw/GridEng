import type { RestraintPreset } from '../../app/store';
import type { Load, Vec3 } from '../../entities/model';
import type { useI18n } from '../../shared/i18n';
import { EMPTY_RESTRAINT_STATE, type LoadEditorDraft, type RestraintState } from './types';

export function createLoadDraft(load: Load): LoadEditorDraft {
  if (load.type === 'nodal_concentrated') {
    return {
      name: load.name,
      comment: load.comment ?? '',
      type: load.type,
      kind: load.kind,
      direction: {
        x: String(load.direction.x),
        y: String(load.direction.y),
        z: String(load.direction.z),
      },
      targetNodeId: load.target.nodeId,
      targetMemberId: '',
      magnitude: String(load.magnitude),
      qStart: '',
      qEnd: '',
      xStartRel: '0',
      xEndRel: '1',
      distributionType: 'linear',
    };
  }

  if (load.distribution.type === 'linear') {
    return {
      name: load.name,
      comment: load.comment ?? '',
      type: load.type,
      kind: load.kind,
      direction: {
        x: String(load.direction.x),
        y: String(load.direction.y),
        z: String(load.direction.z),
      },
      targetNodeId: '',
      targetMemberId: load.target.memberId,
      magnitude: '0',
      qStart: String(load.distribution.qStart),
      qEnd: String(load.distribution.qEnd),
      xStartRel: String(load.distribution.xStartRel ?? 0),
      xEndRel: String(load.distribution.xEndRel ?? 1),
      distributionType: 'linear',
    };
  }

  return {
    name: load.name,
    comment: load.comment ?? '',
    type: load.type,
    kind: load.kind,
    direction: {
      x: String(load.direction.x),
      y: String(load.direction.y),
      z: String(load.direction.z),
    },
    targetNodeId: '',
    targetMemberId: load.target.memberId,
    magnitude: '0',
    qStart: '',
    qEnd: '',
    xStartRel: '0',
    xEndRel: '1',
    distributionType: 'function',
  };
}

export function parseVec3Draft(
  draft: Record<'x' | 'y' | 'z', string>,
  t: ReturnType<typeof useI18n>['t'],
): Vec3 | string {
  const x = parseNumberDraft(draft.x, t('properties.axis.x'), t);
  if (typeof x === 'string') {
    return x;
  }

  const y = parseNumberDraft(draft.y, t('properties.axis.y'), t);
  if (typeof y === 'string') {
    return y;
  }

  const z = parseNumberDraft(draft.z, t('properties.axis.z'), t);
  if (typeof z === 'string') {
    return z;
  }

  return { x, y, z };
}

export function parseNumberDraft(
  value: string,
  fieldLabel: string,
  t: ReturnType<typeof useI18n>['t'],
): number | string {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return t('properties.messages.invalidNumber', { field: fieldLabel });
  }

  return parsed;
}

export function getActiveRestraintAxes(restraint: RestraintState) {
  return (Object.keys(EMPTY_RESTRAINT_STATE) as Array<keyof typeof EMPTY_RESTRAINT_STATE>)
    .filter((axis) => restraint[axis]);
}

export function resolveRestraintPreset(restraint: RestraintState): RestraintPreset {
  if (isRestraintStateEmpty(restraint)) {
    return 'free';
  }

  if (restraint.ux && restraint.uy && restraint.uz && !restraint.rx && !restraint.ry && !restraint.rz) {
    return 'hinge';
  }

  if (restraint.ux && restraint.uy && restraint.uz && restraint.rx && restraint.ry && restraint.rz) {
    return 'fixed';
  }

  return 'custom';
}

export function isRestraintStateEmpty(restraint: RestraintState) {
  return !restraint.ux && !restraint.uy && !restraint.uz && !restraint.rx && !restraint.ry && !restraint.rz;
}

export type { RestraintState };
