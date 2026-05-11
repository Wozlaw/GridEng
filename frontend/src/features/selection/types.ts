import type { Id } from '../../entities/model';

export type SelectableEntityType = 'node' | 'member' | 'profile' | 'material' | 'loadCase';

export interface EntitySelection {
  type: SelectableEntityType;
  id: Id;
}

export interface LoadSelection {
  type: 'load';
  loadCaseId: Id;
  loadId: Id;
}

export interface RestraintSelection {
  type: 'restraint';
  restraintId: Id;
  nodeId?: Id;
}

export interface EmptySelection {
  type: null;
  id: null;
}

export type SelectedEntity =
  | EntitySelection
  | LoadSelection
  | RestraintSelection
  | EmptySelection;

export const EMPTY_SELECTION: SelectedEntity = { type: null, id: null };

export function isSelectedEntity(
  selectedEntity: SelectedEntity,
  entityType: SelectableEntityType,
  entityId: Id,
): boolean {
  return selectedEntity.type === entityType && selectedEntity.id === entityId;
}

export function isSelectedLoad(
  selectedEntity: SelectedEntity,
  loadCaseId: Id,
  loadId: Id,
): boolean {
  return selectedEntity.type === 'load'
    && selectedEntity.loadCaseId === loadCaseId
    && selectedEntity.loadId === loadId;
}

export function isSelectedRestraint(
  selectedEntity: SelectedEntity,
  restraintId: Id,
): boolean {
  return selectedEntity.type === 'restraint' && selectedEntity.restraintId === restraintId;
}

export function getSelectedEntityLabel(selectedEntity: SelectedEntity): string | null {
  switch (selectedEntity.type) {
    case 'node':
    case 'member':
    case 'profile':
    case 'material':
    case 'loadCase':
      return `${selectedEntity.type} ${selectedEntity.id}`;
    case 'load':
      return `load ${selectedEntity.loadId} @ ${selectedEntity.loadCaseId}`;
    case 'restraint':
      return selectedEntity.nodeId != null
        ? `restraint ${selectedEntity.restraintId} @ node ${selectedEntity.nodeId}`
        : `restraint ${selectedEntity.restraintId}`;
    default:
      return null;
  }
}
