import { create } from 'zustand';

import {
  createSampleTowerSegmentModel,
  normalizeVec3,
  validateGridEngModelIntegrity,
  type GridEngModel,
  type Id,
  type Load,
  type LoadCase,
  type Member,
  type MemberDistributedLoad,
  type ModelValidationResult,
  type NodalConcentratedLoad,
  type Restraint,
  type Vec3,
  type WindLoadDefinition,
} from '../../entities/model';
import {
  EMPTY_SELECTION,
  type LoadSelection,
  type RestraintSelection,
  type SelectedEntity,
} from '../../features/selection';
import { DEFAULT_VISIBILITY, type ViewMode, type VisibilityState } from '../../features/view-modes';

export interface DxfImportSettingsState {
  toleranceMm: number;
  centerOnXY: boolean;
  force2DToXY: boolean;
}

export type RestraintPreset = 'free' | 'hinge' | 'fixed' | 'custom';

export type StoreActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type RestraintPatch = Partial<Omit<Restraint, 'id' | 'nodeId'>>;
export type MemberGeometryOverridesPatch = Partial<
  Pick<Member, 'localAxisRotationDeg' | 'offsetYmm' | 'offsetZmm'>
>;
export type LoadCasePatch = Partial<Pick<LoadCase, 'name' | 'comment'>>;
export type LoadUpdatePatch = Partial<{
  name: string;
  comment: string | undefined;
  kind: Load['kind'];
  coordinateSystem: Load['coordinateSystem'];
  direction: Vec3;
  magnitude: number;
  target: Load['target'];
  distribution: MemberDistributedLoad['distribution'];
}>;
export type WindLoadPatch = Partial<WindLoadDefinition>;

export interface NodalConcentratedLoadInput {
  id?: Id;
  name: string;
  comment?: string;
  kind: NodalConcentratedLoad['kind'];
  coordinateSystem?: NodalConcentratedLoad['coordinateSystem'];
  direction: Vec3;
  targetNodeId: Id;
  magnitude: number;
}

export interface MemberDistributedLoadInput {
  id?: Id;
  name: string;
  comment?: string;
  kind: MemberDistributedLoad['kind'];
  coordinateSystem?: MemberDistributedLoad['coordinateSystem'];
  direction: Vec3;
  targetMemberId: Id;
  distribution: MemberDistributedLoad['distribution'];
}

export interface ModelStoreState {
  model: GridEngModel;
  validationReport: ModelValidationResult;
  selectedEntity: SelectedEntity;
  viewMode: ViewMode;
  visibility: VisibilityState;
  dxfImportSettings: DxfImportSettingsState;
  setModel: (model: GridEngModel) => void;
  validateModel: () => void;
  selectEntity: (selectedEntity: SelectedEntity) => void;
  selectLoad: (loadCaseId: Id, loadId: Id) => void;
  selectRestraint: (restraintId: Id) => void;
  clearSelection: () => void;
  getSelectedNode: () => GridEngModel['nodes'][number] | undefined;
  getSelectedMember: () => GridEngModel['members'][number] | undefined;
  getSelectedLoadCase: () => GridEngModel['loadCases'][number] | undefined;
  getSelectedLoad: () => Load | undefined;
  getSelectedRestraint: () => Restraint | undefined;
  getSelectedRestraintNode: () => GridEngModel['nodes'][number] | undefined;
  setViewMode: (viewMode: ViewMode) => void;
  setVisibility: (visibility: Partial<VisibilityState>) => void;
  updateDxfImportSettings: (settings: Partial<DxfImportSettingsState>) => void;
  updateNodeLabel: (nodeId: Id, label: string | undefined) => StoreActionResult;
  updateNodePosition: (nodeId: Id, position: Vec3) => StoreActionResult;
  updateNodeComment: (nodeId: Id, comment: string | undefined) => StoreActionResult;
  updateMemberProfile: (memberId: Id, profileId: Id) => StoreActionResult;
  updateMemberMaterial: (memberId: Id, materialId: Id) => StoreActionResult;
  updateMemberGeometryOverrides: (
    memberId: Id,
    patch: MemberGeometryOverridesPatch,
  ) => StoreActionResult;
  updateMemberComment: (memberId: Id, comment: string | undefined) => StoreActionResult;
  upsertNodeRestraint: (nodeId: Id, patch: RestraintPatch) => StoreActionResult;
  deleteNodeRestraint: (nodeId: Id) => StoreActionResult;
  applyRestraintPreset: (nodeId: Id, preset: RestraintPreset) => StoreActionResult;
  addNodalConcentratedLoad: (
    loadCaseId: Id,
    payload: NodalConcentratedLoadInput,
  ) => StoreActionResult;
  addMemberDistributedLoad: (
    loadCaseId: Id,
    payload: MemberDistributedLoadInput,
  ) => StoreActionResult;
  updateLoad: (loadCaseId: Id, loadId: Id, patch: LoadUpdatePatch) => StoreActionResult;
  deleteLoad: (loadCaseId: Id, loadId: Id) => StoreActionResult;
  updateLoadCase: (loadCaseId: Id, patch: LoadCasePatch) => StoreActionResult;
  updateLoadComment: (loadCaseId: Id, loadId: Id, comment: string | undefined) => StoreActionResult;
  updateLoadCaseWind: (loadCaseId: Id, windPatch: WindLoadPatch) => StoreActionResult;
  resetToSampleModel: () => void;
}

const ACTION_SUCCESS: StoreActionResult = { ok: true };

function createValidationReport(model: GridEngModel): ModelValidationResult {
  return validateGridEngModelIntegrity(model);
}

function createDxfImportSettings(model: GridEngModel): DxfImportSettingsState {
  return {
    toleranceMm: model.settings.nodeMergeToleranceMm,
    centerOnXY: model.settings.centerModelByXYProjection,
    force2DToXY: true,
  };
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function normalizeRequiredText(value: string, fieldName: string): string | StoreActionResult {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return actionFailure(`${fieldName} should not be empty.`);
  }

  return trimmed;
}

function actionFailure(message: string): StoreActionResult {
  console.warn(`[modelStore] ${message}`);
  return { ok: false, error: message };
}

function findNode(model: GridEngModel, nodeId: Id) {
  return model.nodes.find((node) => node.id === nodeId);
}

function findMember(model: GridEngModel, memberId: Id) {
  return model.members.find((member) => member.id === memberId);
}

function findProfile(model: GridEngModel, profileId: Id) {
  return model.profiles.find((profile) => profile.id === profileId);
}

function findMaterial(model: GridEngModel, materialId: Id) {
  return model.materials.find((material) => material.id === materialId);
}

function findLoadCase(model: GridEngModel, loadCaseId: Id) {
  return model.loadCases.find((loadCase) => loadCase.id === loadCaseId);
}

function findLoadCaseIndex(model: GridEngModel, loadCaseId: Id): number {
  return model.loadCases.findIndex((loadCase) => loadCase.id === loadCaseId);
}

function findLoadSelection(
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

function findRestraintById(model: GridEngModel, restraintId: Id) {
  return model.restraints.find((restraint) => restraint.id === restraintId);
}

function findRestraintByNodeId(model: GridEngModel, nodeId: Id) {
  return model.restraints.find((restraint) => restraint.nodeId === nodeId);
}

function normalizeRequiredDirection(direction: Vec3): Vec3 | StoreActionResult {
  const normalized = normalizeVec3(direction);
  return normalized ?? actionFailure('Load direction should be a non-zero vector.');
}

function normalizeWindDirection(direction: Vec3): Vec3 {
  const normalized = normalizeVec3(direction);
  return normalized ?? { x: 0, y: 0, z: 0 };
}

function sanitizeSelection(selectedEntity: SelectedEntity, model: GridEngModel): SelectedEntity {
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

function createSequentialId(prefix: string, ids: Id[]): Id {
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

function buildLoadSelection(model: GridEngModel, loadCaseId: Id, loadId: Id): LoadSelection | null {
  return findLoadSelection(model, loadCaseId, loadId) == null
    ? null
    : {
      type: 'load',
      loadCaseId,
      loadId,
    };
}

function buildRestraintSelection(model: GridEngModel, restraintId: Id): RestraintSelection | null {
  const restraint = findRestraintById(model, restraintId);

  return restraint == null
    ? null
    : {
      type: 'restraint',
      restraintId: restraint.id,
      nodeId: restraint.nodeId,
    };
}

export const useModelStore = create<ModelStoreState>((set, get) => {
  const initialModel = createSampleTowerSegmentModel();

  const commitModel = (nextModel: GridEngModel): StoreActionResult => {
    set((state) => ({
      model: nextModel,
      validationReport: createValidationReport(nextModel),
      selectedEntity: sanitizeSelection(state.selectedEntity, nextModel),
    }));

    return ACTION_SUCCESS;
  };

  return {
    model: initialModel,
    validationReport: createValidationReport(initialModel),
    selectedEntity: EMPTY_SELECTION,
    viewMode: 'wireframe',
    visibility: { ...DEFAULT_VISIBILITY },
    dxfImportSettings: createDxfImportSettings(initialModel),
    setModel: (model) =>
      set({
        model,
        validationReport: createValidationReport(model),
        selectedEntity: EMPTY_SELECTION,
        dxfImportSettings: createDxfImportSettings(model),
      }),
    validateModel: () =>
      set((state) => ({
        validationReport: createValidationReport(state.model),
      })),
    selectEntity: (selectedEntity) =>
      set((state) => ({
        selectedEntity: sanitizeSelection(selectedEntity, state.model),
      })),
    selectLoad: (loadCaseId, loadId) =>
      set((state) => {
        const selection = buildLoadSelection(state.model, loadCaseId, loadId);

        if (selection == null) {
          console.warn(`[modelStore] Load ${loadId} in load case ${loadCaseId} does not exist.`);
          return { selectedEntity: EMPTY_SELECTION };
        }

        return { selectedEntity: selection };
      }),
    selectRestraint: (restraintId) =>
      set((state) => {
        const selection = buildRestraintSelection(state.model, restraintId);

        if (selection == null) {
          console.warn(`[modelStore] Restraint ${restraintId} does not exist.`);
          return { selectedEntity: EMPTY_SELECTION };
        }

        return { selectedEntity: selection };
      }),
    clearSelection: () => set({ selectedEntity: EMPTY_SELECTION }),
    getSelectedNode: () => {
      const { model, selectedEntity } = get();
      return selectedEntity.type === 'node' ? findNode(model, selectedEntity.id) : undefined;
    },
    getSelectedMember: () => {
      const { model, selectedEntity } = get();
      return selectedEntity.type === 'member' ? findMember(model, selectedEntity.id) : undefined;
    },
    getSelectedLoadCase: () => {
      const { model, selectedEntity } = get();

      if (selectedEntity.type === 'loadCase') {
        return findLoadCase(model, selectedEntity.id);
      }

      if (selectedEntity.type === 'load') {
        return findLoadCase(model, selectedEntity.loadCaseId);
      }

      return undefined;
    },
    getSelectedLoad: () => {
      const { model, selectedEntity } = get();

      if (selectedEntity.type !== 'load') {
        return undefined;
      }

      return findLoadSelection(model, selectedEntity.loadCaseId, selectedEntity.loadId)?.load;
    },
    getSelectedRestraint: () => {
      const { model, selectedEntity } = get();
      return selectedEntity.type === 'restraint'
        ? findRestraintById(model, selectedEntity.restraintId)
        : undefined;
    },
    getSelectedRestraintNode: () => {
      const { model } = get();
      const selectedRestraint = get().getSelectedRestraint();
      return selectedRestraint == null ? undefined : findNode(model, selectedRestraint.nodeId);
    },
    setViewMode: (viewMode) => set({ viewMode }),
    setVisibility: (visibility) =>
      set((state) => ({
        visibility: {
          ...state.visibility,
          ...visibility,
        },
      })),
    updateDxfImportSettings: (settings) =>
      set((state) => ({
        dxfImportSettings: {
          ...state.dxfImportSettings,
          ...settings,
        },
      })),
    updateNodeLabel: (nodeId, label) => {
      const { model } = get();
      if (findNode(model, nodeId) == null) {
        return actionFailure(`Node ${nodeId} does not exist.`);
      }

      return commitModel({
        ...model,
        nodes: model.nodes.map((node) =>
          node.id === nodeId
            ? {
              ...node,
              label: normalizeOptionalText(label),
            }
            : node
        ),
      });
    },
    updateNodePosition: (nodeId, position) => {
      const { model } = get();
      if (findNode(model, nodeId) == null) {
        return actionFailure(`Node ${nodeId} does not exist.`);
      }

      return commitModel({
        ...model,
        nodes: model.nodes.map((node) =>
          node.id === nodeId
            ? {
              ...node,
              position: { ...position },
            }
            : node
        ),
      });
    },
    updateNodeComment: (nodeId, comment) => {
      const { model } = get();
      if (findNode(model, nodeId) == null) {
        return actionFailure(`Node ${nodeId} does not exist.`);
      }

      return commitModel({
        ...model,
        nodes: model.nodes.map((node) =>
          node.id === nodeId
            ? {
              ...node,
              comment: normalizeOptionalText(comment),
            }
            : node
        ),
      });
    },
    updateMemberProfile: (memberId, profileId) => {
      const { model } = get();
      if (findMember(model, memberId) == null) {
        return actionFailure(`Member ${memberId} does not exist.`);
      }
      if (findProfile(model, profileId) == null) {
        return actionFailure(`Profile ${profileId} does not exist.`);
      }

      return commitModel({
        ...model,
        members: model.members.map((member) =>
          member.id === memberId
            ? {
              ...member,
              profileId,
            }
            : member
        ),
      });
    },
    updateMemberMaterial: (memberId, materialId) => {
      const { model } = get();
      if (findMember(model, memberId) == null) {
        return actionFailure(`Member ${memberId} does not exist.`);
      }
      if (findMaterial(model, materialId) == null) {
        return actionFailure(`Material ${materialId} does not exist.`);
      }

      return commitModel({
        ...model,
        members: model.members.map((member) =>
          member.id === memberId
            ? {
              ...member,
              materialId,
            }
            : member
        ),
      });
    },
    updateMemberGeometryOverrides: (memberId, patch) => {
      const { model } = get();
      const existing = findMember(model, memberId);
      if (existing == null) {
        return actionFailure(`Member ${memberId} does not exist.`);
      }

      return commitModel({
        ...model,
        members: model.members.map((member) => {
          if (member.id !== memberId) {
            return member;
          }

          const nextMember: Member = { ...member };

          if ('localAxisRotationDeg' in patch) {
            nextMember.localAxisRotationDeg = patch.localAxisRotationDeg;
          }
          if ('offsetYmm' in patch) {
            nextMember.offsetYmm = patch.offsetYmm;
          }
          if ('offsetZmm' in patch) {
            nextMember.offsetZmm = patch.offsetZmm;
          }

          return nextMember;
        }),
      });
    },
    updateMemberComment: (memberId, comment) => {
      const { model } = get();
      if (findMember(model, memberId) == null) {
        return actionFailure(`Member ${memberId} does not exist.`);
      }

      return commitModel({
        ...model,
        members: model.members.map((member) =>
          member.id === memberId
            ? {
              ...member,
              comment: normalizeOptionalText(comment),
            }
            : member
        ),
      });
    },
    upsertNodeRestraint: (nodeId, patch) => {
      const { model } = get();
      if (findNode(model, nodeId) == null) {
        return actionFailure(`Node ${nodeId} does not exist.`);
      }

      const existing = findRestraintByNodeId(model, nodeId);

      if (existing != null) {
        return commitModel({
          ...model,
          restraints: model.restraints.map((restraint) =>
            restraint.id === existing.id
              ? {
                ...restraint,
                ...patch,
                comment: 'comment' in patch ? normalizeOptionalText(patch.comment) : restraint.comment,
              }
              : restraint
          ),
        });
      }

      const nextRestraint: Restraint = {
        id: createSequentialId('r-', model.restraints.map((restraint) => restraint.id)),
        nodeId,
        ux: false,
        uy: false,
        uz: false,
        rx: false,
        ry: false,
        rz: false,
        ...patch,
        comment: normalizeOptionalText(patch.comment),
      };

      return commitModel({
        ...model,
        restraints: [...model.restraints, nextRestraint],
      });
    },
    deleteNodeRestraint: (nodeId) => {
      const { model } = get();
      const existing = findRestraintByNodeId(model, nodeId);
      if (existing == null) {
        return actionFailure(`Node ${nodeId} has no restraint to delete.`);
      }

      return commitModel({
        ...model,
        restraints: model.restraints.filter((restraint) => restraint.id !== existing.id),
      });
    },
    applyRestraintPreset: (nodeId, preset) => {
      switch (preset) {
        case 'free':
          return get().deleteNodeRestraint(nodeId);
        case 'hinge':
          return get().upsertNodeRestraint(nodeId, {
            ux: true,
            uy: true,
            uz: true,
            rx: false,
            ry: false,
            rz: false,
          });
        case 'fixed':
          return get().upsertNodeRestraint(nodeId, {
            ux: true,
            uy: true,
            uz: true,
            rx: true,
            ry: true,
            rz: true,
          });
        case 'custom':
          return get().upsertNodeRestraint(nodeId, {});
        default:
          return actionFailure(`Unknown restraint preset: ${String(preset)}.`);
      }
    },
    addNodalConcentratedLoad: (loadCaseId, payload) => {
      const { model } = get();
      const loadCaseIndex = findLoadCaseIndex(model, loadCaseId);
      if (loadCaseIndex < 0) {
        return actionFailure(`Load case ${loadCaseId} does not exist.`);
      }
      if (findNode(model, payload.targetNodeId) == null) {
        return actionFailure(`Node ${payload.targetNodeId} does not exist.`);
      }

      const normalizedName = normalizeRequiredText(payload.name, 'Load name');
      if (typeof normalizedName !== 'string') {
        return normalizedName;
      }

      const direction = normalizeRequiredDirection(payload.direction);
      if (!('x' in direction)) {
        return direction;
      }

      const loadId = payload.id ?? createSequentialId(
        'load-',
        model.loadCases.flatMap((loadCase) => loadCase.loads.map((load) => load.id)),
      );
      if (model.loadCases.some((loadCase) => loadCase.loads.some((load) => load.id === loadId))) {
        return actionFailure(`Load ${loadId} already exists.`);
      }

      const nextLoad: NodalConcentratedLoad = {
        id: loadId,
        type: 'nodal_concentrated',
        name: normalizedName,
        comment: normalizeOptionalText(payload.comment),
        kind: payload.kind,
        coordinateSystem: payload.coordinateSystem ?? 'global',
        direction,
        target: {
          type: 'node',
          nodeId: payload.targetNodeId,
        },
        magnitude: payload.magnitude,
      };

      return commitModel({
        ...model,
        loadCases: model.loadCases.map((loadCase, index) =>
          index === loadCaseIndex
            ? {
              ...loadCase,
              loads: [...loadCase.loads, nextLoad],
            }
            : loadCase
        ),
      });
    },
    addMemberDistributedLoad: (loadCaseId, payload) => {
      const { model } = get();
      const loadCaseIndex = findLoadCaseIndex(model, loadCaseId);
      if (loadCaseIndex < 0) {
        return actionFailure(`Load case ${loadCaseId} does not exist.`);
      }
      if (findMember(model, payload.targetMemberId) == null) {
        return actionFailure(`Member ${payload.targetMemberId} does not exist.`);
      }

      const normalizedName = normalizeRequiredText(payload.name, 'Load name');
      if (typeof normalizedName !== 'string') {
        return normalizedName;
      }

      const direction = normalizeRequiredDirection(payload.direction);
      if (!('x' in direction)) {
        return direction;
      }

      const loadId = payload.id ?? createSequentialId(
        'load-',
        model.loadCases.flatMap((loadCase) => loadCase.loads.map((load) => load.id)),
      );
      if (model.loadCases.some((loadCase) => loadCase.loads.some((load) => load.id === loadId))) {
        return actionFailure(`Load ${loadId} already exists.`);
      }

      const nextLoad: MemberDistributedLoad = {
        id: loadId,
        type: 'member_distributed',
        name: normalizedName,
        comment: normalizeOptionalText(payload.comment),
        kind: payload.kind,
        coordinateSystem: payload.coordinateSystem ?? 'global',
        direction,
        target: {
          type: 'member',
          memberId: payload.targetMemberId,
        },
        distribution: payload.distribution,
      };

      return commitModel({
        ...model,
        loadCases: model.loadCases.map((loadCase, index) =>
          index === loadCaseIndex
            ? {
              ...loadCase,
              loads: [...loadCase.loads, nextLoad],
            }
            : loadCase
        ),
      });
    },
    updateLoad: (loadCaseId, loadId, patch) => {
      const { model } = get();
      const selection = findLoadSelection(model, loadCaseId, loadId);
      if (selection == null) {
        return actionFailure(`Load ${loadId} in load case ${loadCaseId} does not exist.`);
      }

      let nextLoad: Load = { ...selection.load };

      if ('name' in patch && patch.name != null) {
        const normalizedName = normalizeRequiredText(patch.name, 'Load name');
        if (typeof normalizedName !== 'string') {
          return normalizedName;
        }
        nextLoad = { ...nextLoad, name: normalizedName };
      }

      if ('comment' in patch) {
        nextLoad = { ...nextLoad, comment: normalizeOptionalText(patch.comment) };
      }

      if ('kind' in patch && patch.kind != null) {
        nextLoad = { ...nextLoad, kind: patch.kind };
      }

      if ('coordinateSystem' in patch && patch.coordinateSystem != null) {
        nextLoad = { ...nextLoad, coordinateSystem: patch.coordinateSystem };
      }

      if ('direction' in patch && patch.direction != null) {
        const direction = normalizeRequiredDirection(patch.direction);
        if (!('x' in direction)) {
          return direction;
        }

        nextLoad = { ...nextLoad, direction };
      }

      if (nextLoad.type === 'nodal_concentrated') {
        if ('distribution' in patch) {
          return actionFailure(`Load ${loadId} is nodal and does not support distribution.`);
        }
        if ('magnitude' in patch && patch.magnitude != null) {
          nextLoad = { ...nextLoad, magnitude: patch.magnitude };
        }
        if ('target' in patch && patch.target != null) {
          if (patch.target.type !== 'node') {
            return actionFailure(`Load ${loadId} expects a node target.`);
          }
          if (findNode(model, patch.target.nodeId) == null) {
            return actionFailure(`Node ${patch.target.nodeId} does not exist.`);
          }
          nextLoad = { ...nextLoad, target: patch.target };
        }
      } else {
        if ('magnitude' in patch) {
          return actionFailure(`Load ${loadId} is distributed and does not support scalar magnitude.`);
        }
        if ('distribution' in patch && patch.distribution != null) {
          nextLoad = { ...nextLoad, distribution: patch.distribution };
        }
        if ('target' in patch && patch.target != null) {
          if (patch.target.type !== 'member') {
            return actionFailure(`Load ${loadId} expects a member target.`);
          }
          if (findMember(model, patch.target.memberId) == null) {
            return actionFailure(`Member ${patch.target.memberId} does not exist.`);
          }
          nextLoad = { ...nextLoad, target: patch.target };
        }
      }

      return commitModel({
        ...model,
        loadCases: model.loadCases.map((loadCase) =>
          loadCase.id === loadCaseId
            ? {
              ...loadCase,
              loads: loadCase.loads.map((load) => (load.id === loadId ? nextLoad : load)),
            }
            : loadCase
        ),
      });
    },
    deleteLoad: (loadCaseId, loadId) => {
      const { model } = get();
      const selection = findLoadSelection(model, loadCaseId, loadId);
      if (selection == null) {
        return actionFailure(`Load ${loadId} in load case ${loadCaseId} does not exist.`);
      }

      return commitModel({
        ...model,
        loadCases: model.loadCases.map((loadCase) =>
          loadCase.id === loadCaseId
            ? {
              ...loadCase,
              loads: loadCase.loads.filter((load) => load.id !== loadId),
            }
            : loadCase
        ),
      });
    },
    updateLoadCase: (loadCaseId, patch) => {
      const { model } = get();
      const existing = findLoadCase(model, loadCaseId);
      if (existing == null) {
        return actionFailure(`Load case ${loadCaseId} does not exist.`);
      }

      let normalizedName: string | undefined;
      if ('name' in patch && patch.name != null) {
        const candidate = normalizeRequiredText(patch.name, 'Load case name');
        if (typeof candidate !== 'string') {
          return candidate;
        }
        normalizedName = candidate;
      }

      return commitModel({
        ...model,
        loadCases: model.loadCases.map((loadCase) =>
          loadCase.id === loadCaseId
            ? {
              ...loadCase,
              ...(normalizedName != null ? { name: normalizedName } : {}),
              ...('comment' in patch ? { comment: normalizeOptionalText(patch.comment) } : {}),
            }
            : loadCase
        ),
      });
    },
    updateLoadComment: (loadCaseId, loadId, comment) =>
      get().updateLoad(loadCaseId, loadId, { comment }),
    updateLoadCaseWind: (loadCaseId, windPatch) => {
      const { model } = get();
      const existing = findLoadCase(model, loadCaseId);
      if (existing == null) {
        return actionFailure(`Load case ${loadCaseId} does not exist.`);
      }

      const nextWind: WindLoadDefinition = {
        ...existing.wind,
        ...windPatch,
        ...(windPatch.direction != null
          ? { direction: normalizeWindDirection(windPatch.direction) }
          : {}),
        ...('comment' in windPatch ? { comment: normalizeOptionalText(windPatch.comment) } : {}),
      };

      return commitModel({
        ...model,
        loadCases: model.loadCases.map((loadCase) =>
          loadCase.id === loadCaseId
            ? {
              ...loadCase,
              wind: nextWind,
            }
            : loadCase
        ),
      });
    },
    resetToSampleModel: () =>
      set((state) => {
        const model = createSampleTowerSegmentModel();

        return {
          model,
          validationReport: createValidationReport(model),
          selectedEntity: EMPTY_SELECTION,
          dxfImportSettings: createDxfImportSettings(model),
          viewMode: state.viewMode,
          visibility: state.visibility,
        };
      }),
  };
});
