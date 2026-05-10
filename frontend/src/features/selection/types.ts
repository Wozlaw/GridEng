import type { Id } from '../../entities/model';

export type SelectableEntityType = 'node' | 'member' | 'profile' | 'material' | 'loadCase';

export type SelectedEntity =
  | { type: SelectableEntityType; id: Id }
  | { type: null; id: null };

export const EMPTY_SELECTION: SelectedEntity = { type: null, id: null };

export function isSelectedEntity(
  selectedEntity: SelectedEntity,
  entityType: SelectableEntityType,
  entityId: Id,
): boolean {
  return selectedEntity.type === entityType && selectedEntity.id === entityId;
}
