import { normalizeVec3, validateGridEngModelIntegrity, type GridEngModel, type Id, type Load, type LoadCase, type ModelValidationResult, type Vec3 } from '../../entities/model';
import { EMPTY_SELECTION, type LoadSelection, type RestraintSelection, type SelectedEntity } from '../../features/selection';
import type { StoreActionResult, DxfImportSettingsState } from './modelStore.types';

export const ACTION_SUCCESS: StoreActionResult = { ok: true };

export function createValidationReport(model: GridEngModel): ModelValidationResult {
  return validateGridEngModelIntegrity(model);
}

export function createDxfImportSettings(model: GridEngModel): DxfImportSettingsState {
  return {
    toleranceMm: model.settings.nodeMergeToleranceMm,
    centerOnXY: model.settings.centerModelByXYProjection,
    force2DToXY: true,
  };
}

export function normalizeOptionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export function normalizeRequiredText(value: string, fieldName: string): string | StoreActionResult {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return actionFailure(`${fieldName} should not be empty.`);
  }

  return trimmed;
}

export function actionFailure(message: string): StoreActionResult {
  return { ok: false, error: message };
}

export function findNode(model: GridEngModel, nodeId: Id) {
  return model.nodes.find((node) => node.id === nodeId);
}

export function findMember(model: GridEngModel, memberId: Id) {
  return model.members.find((member) => member.id === memberId);
}

export function findProfile(model: GridEngModel, profileId: Id) {
  return model.profiles.find((profile) => profile.id === profileId);
}

export function findMaterial(model: GridEngModel, materialId: Id) {
  return model.materials.find((material) => material.id === materialId);
}

export function findLoadCase(model: GridEngModel, loadCaseId: Id) {
  return model.loadCases.find((loadCase) => loadCase.id === loadCaseId);
}

export function resolveActiveLoadCaseId(model: GridEngModel, activeLoadCaseId: Id | null): Id | null {
  if (activeLoadCaseId != null && findLoadCase(model, activeLoadCaseId) != null) {
    return activeLoadCaseId;
  }

  return model.loadCases[0]?.id ?? null;
}

export function findActiveLoadCase(model: GridEngModel, activeLoadCaseId: Id | null): LoadCase | undefined {
  const resolvedId = resolveActiveLoadCaseId(model, activeLoadCaseId);
  return resolvedId == null ? undefined : findLoadCase(model, resolvedId);
}

export function findLoadCaseIndex(model: GridEngModel, loadCaseId: Id): number {
  return model.loadCases.findIndex((loadCase) => loadCase.id === loadCaseId);
}

export function findLoadSelection(
  model: GridEngModel,
  loadCaseId: Id,
  loadId: Id,
): { loadCase: LoadCase; load: Load } | undefined {
  const loadCase = findLoadCase(model, loadCaseId);
  if (loadCase == null) {
    return undefined;
  }

  const load = loadCase.loads.find((candidate) => candidate.id === loadId);
  return load == null ? undefined : { loadCase, load };
}

export function findRestraintById(model: GridEngModel, restraintId: Id) {
  return model.restraints.find((restraint) => restraint.id === restraintId);
}

export function findRestraintByNodeId(model: GridEngModel, nodeId: Id) {
  return model.restraints.find((restraint) => restraint.nodeId === nodeId);
}

export function normalizeRequiredDirection(direction: Vec3): Vec3 | StoreActionResult {
  const normalized = normalizeVec3(direction);
  return normalized ?? actionFailure('Load direction should be a non-zero vector.');
}

export function normalizeWindDirection(direction: Vec3): Vec3 {
  const normalized = normalizeVec3(direction);
  return normalized ?? { x: 0, y: 0, z: 0 };
}

export function sanitizeSelection(selectedEntity: SelectedEntity, model: GridEngModel): SelectedEntity {
  switch (selectedEntity.type) {
    case 'node':
      return findNode(model, selectedEntity.id) != null ? selectedEntity : EMPTY_SELECTION;
    case 'member':
      return findMember(model, selectedEntity.id) != null ? selectedEntity : EMPTY_SELECTION;
    case 'profile':
      return findProfile(model, selectedEntity.id) != null ? selectedEntity : EMPTY_SELECTION;
    case 'material':
      return findMaterial(model, selectedEntity.id) != null ? selectedEntity : EMPTY_SELECTION;
    case 'loadCase':
      return findLoadCase(model, selectedEntity.id) != null ? selectedEntity : EMPTY_SELECTION;
    case 'load':
      return findLoadSelection(model, selectedEntity.loadCaseId, selectedEntity.loadId) != null
        ? selectedEntity
        : EMPTY_SELECTION;
    case 'restraint': {
      const restraint = findRestraintById(model, selectedEntity.restraintId);
      return restraint == null
        ? EMPTY_SELECTION
        : {
          type: 'restraint',
          restraintId: restraint.id,
          nodeId: restraint.nodeId,
        };
    }
    default:
      return EMPTY_SELECTION;
  }
}

export function syncSelectionWithActiveLoadCase(
  selectedEntity: SelectedEntity,
  activeLoadCaseId: Id | null,
): SelectedEntity {
  if (activeLoadCaseId == null) {
    return selectedEntity.type === 'loadCase' || selectedEntity.type === 'load'
      ? EMPTY_SELECTION
      : selectedEntity;
  }

  if (selectedEntity.type === 'loadCase') {
    return {
      type: 'loadCase',
      id: activeLoadCaseId,
    };
  }

  if (selectedEntity.type === 'load' && selectedEntity.loadCaseId !== activeLoadCaseId) {
    return {
      type: 'loadCase',
      id: activeLoadCaseId,
    };
  }

  return selectedEntity;
}

export function createSequentialId(prefix: string, ids: Id[]): Id {
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^${escapedPrefix}(\\d+)$`);
  let maxIndex = 0;

  for (const id of ids) {
    const match = pattern.exec(id);
    if (match == null) {
      continue;
    }

    const index = Number.parseInt(match[1], 10);
    if (Number.isFinite(index)) {
      maxIndex = Math.max(maxIndex, index);
    }
  }

  return `${prefix}${maxIndex + 1}`;
}

export function buildLoadSelection(model: GridEngModel, loadCaseId: Id, loadId: Id): LoadSelection | null {
  return findLoadSelection(model, loadCaseId, loadId) == null
    ? null
    : {
      type: 'load',
      loadCaseId,
      loadId,
    };
}

export function buildRestraintSelection(model: GridEngModel, restraintId: Id): RestraintSelection | null {
  const restraint = findRestraintById(model, restraintId);

  return restraint == null
    ? null
    : {
      type: 'restraint',
      restraintId: restraint.id,
      nodeId: restraint.nodeId,
    };
}
