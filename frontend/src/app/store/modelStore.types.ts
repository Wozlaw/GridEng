import type {
  GridEngModel,
  Id,
  Load,
  LoadCase,
  Material,
  Member,
  MemberDistributedLoad,
  ModelSettings,
  ModelValidationResult,
  NodalConcentratedLoad,
  Profile,
  Restraint,
  Vec3,
  WindLoadDefinition,
} from '../../entities/model';
import type { SelectedEntity } from '../../features/selection';
import type { ViewMode, VisibilityState } from '../../features/view-modes';

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
export type ModelSettingsPatch = Partial<Pick<
  ModelSettings,
  'nodeMergeToleranceMm' | 'centerModelByXYProjection'
>>;
export type LoadUpdatePatch = Partial<{
  type: Load['type'];
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

export interface SelectionUpdateOptions {
  additive?: boolean;
}

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
  selectedEntities: SelectedEntity[];
  activeLoadCaseId: Id | null;
  viewMode: ViewMode;
  visibility: VisibilityState;
  fitRequestNonce: number;
  dxfImportSettings: DxfImportSettingsState;
  setModel: (model: GridEngModel) => void;
  validateModel: () => void;
  selectEntity: (selectedEntity: SelectedEntity, options?: SelectionUpdateOptions) => void;
  selectLoad: (loadCaseId: Id, loadId: Id, options?: SelectionUpdateOptions) => void;
  selectRestraint: (restraintId: Id, options?: SelectionUpdateOptions) => void;
  setActiveLoadCaseId: (loadCaseId: Id | null) => void;
  clearSelection: () => void;
  getSelectedNode: () => GridEngModel['nodes'][number] | undefined;
  getSelectedMember: () => GridEngModel['members'][number] | undefined;
  getSelectedLoadCase: () => GridEngModel['loadCases'][number] | undefined;
  getActiveLoadCase: () => GridEngModel['loadCases'][number] | undefined;
  getSelectedLoad: () => Load | undefined;
  getSelectedRestraint: () => Restraint | undefined;
  getSelectedRestraintNode: () => GridEngModel['nodes'][number] | undefined;
  setViewMode: (viewMode: ViewMode) => void;
  setVisibility: (visibility: Partial<VisibilityState>) => void;
  requestFitToModel: () => void;
  updateDxfImportSettings: (settings: Partial<DxfImportSettingsState>) => void;
  updateModelSettings: (patch: ModelSettingsPatch) => StoreActionResult;
  updateNodeLabel: (nodeId: Id, label: string | undefined) => StoreActionResult;
  updateNodePosition: (nodeId: Id, position: Vec3) => StoreActionResult;
  updateNodeComment: (nodeId: Id, comment: string | undefined) => StoreActionResult;
  upsertProfile: (profile: Profile) => StoreActionResult;
  upsertMaterial: (material: Material) => StoreActionResult;
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
