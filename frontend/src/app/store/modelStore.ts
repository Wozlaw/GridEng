import { create } from 'zustand';

import {
  createSampleTowerSegmentModel,
  type GridEngModel,
  type Load,
  type Material,
  type Member,
  type MemberDistributedLoad,
  type NodalConcentratedLoad,
  type Profile,
  type Restraint,
} from '../../entities/model';
import { EMPTY_SELECTION, isSameSelection } from '../../features/selection';
import { DEFAULT_VISIBILITY, normalizeViewMode } from '../../features/view-modes';
import {
  ACTION_SUCCESS,
  actionFailure,
  applySelectionUpdate,
  buildLoadSelection,
  buildRestraintSelection,
  createDxfImportSettings,
  createSequentialId,
  createValidationReport,
  findActiveLoadCase,
  findLoadCase,
  findLoadCaseIndex,
  findLoadSelection,
  findMaterial,
  findMember,
  findNode,
  findProfile,
  findRestraintById,
  findRestraintByNodeId,
  normalizeOptionalText,
  normalizeRequiredDirection,
  normalizeRequiredText,
  normalizeWindDirection,
  resolveActiveLoadCaseId,
  sanitizeSelection,
  sanitizeSelections,
  syncSelectionWithActiveLoadCase,
  syncSelectionsWithActiveLoadCase,
} from './modelStore.helpers';
import type {
  DxfImportSettingsState,
  ModelStoreState,
  SelectionUpdateOptions,
  StoreActionResult,
} from './modelStore.types';

export const useModelStore = create<ModelStoreState>((set, get) => {
  const initialModel = createSampleTowerSegmentModel();
  const initialActiveLoadCaseId = resolveActiveLoadCaseId(initialModel, null);

  const finalizeSelectionState = (
    model: GridEngModel,
    selectedEntity: ModelStoreState['selectedEntity'],
    selectedEntities: ModelStoreState['selectedEntities'],
    activeLoadCaseId: GridEngModel['loadCases'][number]['id'] | null,
  ): Pick<ModelStoreState, 'selectedEntity' | 'selectedEntities'> => {
    const nextSelectedEntities = syncSelectionsWithActiveLoadCase(
      sanitizeSelections(selectedEntities, model),
      activeLoadCaseId,
    );
    const nextSelectedEntity = syncSelectionWithActiveLoadCase(
      sanitizeSelection(selectedEntity, model),
      activeLoadCaseId,
    );

    if (nextSelectedEntities.length === 0 || nextSelectedEntity.type == null) {
      return {
        selectedEntity: nextSelectedEntities.length > 0
          ? nextSelectedEntities[nextSelectedEntities.length - 1]
          : nextSelectedEntity,
        selectedEntities: nextSelectedEntities,
      };
    }

    const resolvedSelectedEntity = nextSelectedEntities.some((candidate) =>
      isSameSelection(candidate, nextSelectedEntity)
    )
      ? nextSelectedEntity
      : nextSelectedEntities[nextSelectedEntities.length - 1];

    return {
      selectedEntity: resolvedSelectedEntity,
      selectedEntities: nextSelectedEntities,
    };
  };

  const resolveSelectionPayload = (
    state: Pick<ModelStoreState, 'selectedEntity' | 'selectedEntities' | 'activeLoadCaseId' | 'model'>,
    nextSelection: ModelStoreState['selectedEntity'],
    options?: SelectionUpdateOptions,
  ): Pick<ModelStoreState, 'selectedEntity' | 'selectedEntities' | 'activeLoadCaseId'> => {
    const currentSelectedEntities = sanitizeSelections(
      [...state.selectedEntities, state.selectedEntity],
      state.model,
    );
    const sanitizedNextSelection = sanitizeSelection(nextSelection, state.model);
    const selectionUpdate = applySelectionUpdate(
      state.selectedEntity,
      currentSelectedEntities,
      sanitizedNextSelection,
      options?.additive === true,
    );
    const nextActiveLoadCaseId = sanitizedNextSelection.type === 'loadCase'
      ? resolveActiveLoadCaseId(state.model, sanitizedNextSelection.id)
      : sanitizedNextSelection.type === 'load'
        ? resolveActiveLoadCaseId(state.model, sanitizedNextSelection.loadCaseId)
        : state.activeLoadCaseId;
    const finalizedSelection = finalizeSelectionState(
      state.model,
      selectionUpdate.selectedEntity,
      selectionUpdate.selectedEntities,
      nextActiveLoadCaseId,
    );

    return {
      ...finalizedSelection,
      activeLoadCaseId: nextActiveLoadCaseId,
    };
  };

  const commitModel = (
    nextModel: GridEngModel,
    options?: { dxfImportSettings?: DxfImportSettingsState },
  ): StoreActionResult => {
    set((state) => ({
      model: nextModel,
      validationReport: createValidationReport(nextModel),
      activeLoadCaseId: resolveActiveLoadCaseId(nextModel, state.activeLoadCaseId),
      ...finalizeSelectionState(
        nextModel,
        state.selectedEntity,
        [...state.selectedEntities, state.selectedEntity],
        resolveActiveLoadCaseId(nextModel, state.activeLoadCaseId),
      ),
      ...(options?.dxfImportSettings != null
        ? { dxfImportSettings: options.dxfImportSettings }
        : {}),
    }));

    return ACTION_SUCCESS;
  };

  return {
    model: initialModel,
    validationReport: createValidationReport(initialModel),
    selectedEntity: EMPTY_SELECTION,
    selectedEntities: [],
    activeLoadCaseId: initialActiveLoadCaseId,
    viewMode: 'wireframe',
    visibility: { ...DEFAULT_VISIBILITY },
    fitRequestNonce: 0,
    dxfImportSettings: createDxfImportSettings(initialModel),
    setModel: (model) =>
      set((state) => ({
        model,
        validationReport: createValidationReport(model),
        selectedEntity: EMPTY_SELECTION,
        selectedEntities: [],
        activeLoadCaseId: resolveActiveLoadCaseId(model, state.activeLoadCaseId),
        dxfImportSettings: createDxfImportSettings(model),
      })),
    validateModel: () =>
      set((state) => ({
        validationReport: createValidationReport(state.model),
      })),
    selectEntity: (selectedEntity, options) =>
      set((state) => resolveSelectionPayload(state, selectedEntity, options)),
    selectLoad: (loadCaseId, loadId, options) =>
      set((state) => {
        const selection = buildLoadSelection(state.model, loadCaseId, loadId);

        if (selection == null) {
          return options?.additive
            ? {}
            : { selectedEntity: EMPTY_SELECTION, selectedEntities: [] };
        }

        return resolveSelectionPayload(state, selection, options);
      }),
    selectRestraint: (restraintId, options) =>
      set((state) => {
        const selection = buildRestraintSelection(state.model, restraintId);

        if (selection == null) {
          return options?.additive
            ? {}
            : { selectedEntity: EMPTY_SELECTION, selectedEntities: [] };
        }

        return resolveSelectionPayload(state, selection, options);
      }),
    setActiveLoadCaseId: (loadCaseId) =>
      set((state) => {
        const nextActiveLoadCaseId = resolveActiveLoadCaseId(state.model, loadCaseId);
        const nextSelectionState = finalizeSelectionState(
          state.model,
          state.selectedEntity,
          [...state.selectedEntities, state.selectedEntity],
          nextActiveLoadCaseId,
        );

        return {
          activeLoadCaseId: nextActiveLoadCaseId,
          ...nextSelectionState,
        };
      }),
    clearSelection: () => set({ selectedEntity: EMPTY_SELECTION, selectedEntities: [] }),
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
    getActiveLoadCase: () => {
      const { model, activeLoadCaseId } = get();
      return findActiveLoadCase(model, activeLoadCaseId);
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
    setViewMode: (viewMode) => set({ viewMode: normalizeViewMode(viewMode) }),
    setVisibility: (visibility) =>
      set((state) => ({
        visibility: {
          ...state.visibility,
          ...visibility,
        },
      })),
    requestFitToModel: () =>
      set((state) => ({
        fitRequestNonce: state.fitRequestNonce + 1,
      })),
    updateDxfImportSettings: (settings) =>
      set((state) => ({
        dxfImportSettings: {
          ...state.dxfImportSettings,
          ...settings,
        },
      })),
    updateModelSettings: (patch) => {
      const { model, dxfImportSettings } = get();

      if ('nodeMergeToleranceMm' in patch) {
        const toleranceMm = patch.nodeMergeToleranceMm;

        if (toleranceMm == null || !Number.isFinite(toleranceMm) || toleranceMm <= 0) {
          return actionFailure('nodeMergeToleranceMm should be a positive finite number.');
        }
      }

      const nextModel: GridEngModel = {
        ...model,
        settings: {
          ...model.settings,
          ...patch,
        },
      };

      return commitModel(nextModel, {
        dxfImportSettings: {
          ...dxfImportSettings,
          ...('nodeMergeToleranceMm' in patch && patch.nodeMergeToleranceMm != null
            ? { toleranceMm: patch.nodeMergeToleranceMm }
            : {}),
          ...('centerModelByXYProjection' in patch && patch.centerModelByXYProjection != null
            ? { centerOnXY: patch.centerModelByXYProjection }
            : {}),
        },
      });
    },
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
    upsertProfile: (profile) => {
      const { model } = get();

      const nextProfile: Profile = {
        ...profile,
        name: profile.name.trim() || profile.id,
        comment: normalizeOptionalText(profile.comment),
        params: { ...profile.params },
        section: { ...profile.section },
      };

      const hasExistingProfile = findProfile(model, nextProfile.id) != null;

      return commitModel({
        ...model,
        profiles: hasExistingProfile
          ? model.profiles.map((candidate) => (
            candidate.id === nextProfile.id ? nextProfile : candidate
          ))
          : [...model.profiles, nextProfile],
      });
    },
    upsertMaterial: (material) => {
      const { model } = get();

      const nextMaterial: Material = {
        ...material,
        name: material.name.trim() || material.id,
        comment: normalizeOptionalText(material.comment),
      };

      const hasExistingMaterial = findMaterial(model, nextMaterial.id) != null;

      return commitModel({
        ...model,
        materials: hasExistingMaterial
          ? model.materials.map((candidate) => (
            candidate.id === nextMaterial.id ? nextMaterial : candidate
          ))
          : [...model.materials, nextMaterial],
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

      if ('type' in patch && patch.type != null && patch.type !== selection.load.type) {
        if (patch.type === 'nodal_concentrated') {
          const targetNodeId = patch.target?.type === 'node'
            ? patch.target.nodeId
            : model.nodes[0]?.id;

          if (targetNodeId == null || findNode(model, targetNodeId) == null) {
            return actionFailure('Cannot switch load to nodal: target node is missing.');
          }

          nextLoad = {
            id: selection.load.id,
            type: 'nodal_concentrated',
            name: selection.load.name,
            comment: selection.load.comment,
            kind: selection.load.kind,
            coordinateSystem: selection.load.coordinateSystem,
            direction: selection.load.direction,
            target: {
              type: 'node',
              nodeId: targetNodeId,
            },
            magnitude: selection.load.type === 'nodal_concentrated'
              ? selection.load.magnitude
              : selection.load.distribution.type === 'linear'
                ? selection.load.distribution.qStart
                : 0,
          };
        } else {
          const targetMemberId = patch.target?.type === 'member'
            ? patch.target.memberId
            : model.members[0]?.id;

          if (targetMemberId == null || findMember(model, targetMemberId) == null) {
            return actionFailure('Cannot switch load to distributed: target member is missing.');
          }

          nextLoad = {
            id: selection.load.id,
            type: 'member_distributed',
            name: selection.load.name,
            comment: selection.load.comment,
            kind: selection.load.kind,
            coordinateSystem: selection.load.coordinateSystem,
            direction: selection.load.direction,
            target: {
              type: 'member',
              memberId: targetMemberId,
            },
            distribution: selection.load.type === 'member_distributed'
              ? selection.load.distribution
              : {
                type: 'linear',
                qStart: selection.load.magnitude,
                qEnd: selection.load.magnitude,
                xStartRel: 0,
                xEndRel: 1,
              },
          };
        }
      }

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

      const nextWind: GridEngModel['loadCases'][number]['wind'] = {
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
          selectedEntities: [],
          activeLoadCaseId: resolveActiveLoadCaseId(model, state.activeLoadCaseId),
          dxfImportSettings: createDxfImportSettings(model),
          viewMode: state.viewMode,
          visibility: state.visibility,
        };
      }),
  };
});
