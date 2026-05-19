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

export type SelectionCollection = SelectedEntity[];

export const EMPTY_SELECTION: SelectedEntity = { type: null, id: null };

export function isEmptySelection(selectedEntity: SelectedEntity): selectedEntity is EmptySelection {
  return selectedEntity.type == null;
}

export function isSameSelection(a: SelectedEntity, b: SelectedEntity): boolean {
  if (a.type !== b.type) {
    return false;
  }

  switch (a.type) {
    case 'node':
    case 'member':
    case 'profile':
    case 'material':
    case 'loadCase':
      return a.id === (b as EntitySelection).id;
    case 'load':
      return a.loadCaseId === (b as LoadSelection).loadCaseId
        && a.loadId === (b as LoadSelection).loadId;
    case 'restraint':
      return a.restraintId === (b as RestraintSelection).restraintId;
    default:
      return true;
  }
}

export function compactSelections(selectedEntities: SelectionCollection): SelectionCollection {
  const nextSelections: SelectionCollection = [];

  for (const selectedEntity of selectedEntities) {
    if (isEmptySelection(selectedEntity)) {
      continue;
    }

    if (!nextSelections.some((candidate) => isSameSelection(candidate, selectedEntity))) {
      nextSelections.push(selectedEntity);
    }
  }

  return nextSelections;
}

function toSelectionCollection(
  selectedEntityOrCollection: SelectedEntity | SelectionCollection,
): SelectionCollection {
  return Array.isArray(selectedEntityOrCollection)
    ? selectedEntityOrCollection
    : isEmptySelection(selectedEntityOrCollection)
      ? []
      : [selectedEntityOrCollection];
}

export function isSelectedEntity(
  selectedEntityOrCollection: SelectedEntity | SelectionCollection,
  entityType: SelectableEntityType,
  entityId: Id,
): boolean {
  return toSelectionCollection(selectedEntityOrCollection).some((selectedEntity) =>
    selectedEntity.type === entityType && selectedEntity.id === entityId
  );
}

export function isSelectedLoad(
  selectedEntityOrCollection: SelectedEntity | SelectionCollection,
  loadCaseId: Id,
  loadId: Id,
): boolean {
  return toSelectionCollection(selectedEntityOrCollection).some((selectedEntity) =>
    selectedEntity.type === 'load'
    && selectedEntity.loadCaseId === loadCaseId
    && selectedEntity.loadId === loadId
  );
}

export function isSelectedRestraint(
  selectedEntityOrCollection: SelectedEntity | SelectionCollection,
  restraintId: Id,
): boolean {
  return toSelectionCollection(selectedEntityOrCollection).some((selectedEntity) =>
    selectedEntity.type === 'restraint' && selectedEntity.restraintId === restraintId
  );
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
