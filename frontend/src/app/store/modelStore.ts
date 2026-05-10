import { create } from 'zustand';

import {
  createSampleTowerSegmentModel,
  validateGridEngModelIntegrity,
  type GridEngModel,
  type ModelValidationResult,
} from '../../entities/model';
import { EMPTY_SELECTION, type SelectedEntity } from '../../features/selection';
import { DEFAULT_VISIBILITY, type ViewMode, type VisibilityState } from '../../features/view-modes';

export interface DxfImportSettingsState {
  toleranceMm: number;
  centerOnXY: boolean;
  force2DToXY: boolean;
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
  clearSelection: () => void;
  setViewMode: (viewMode: ViewMode) => void;
  setVisibility: (visibility: Partial<VisibilityState>) => void;
  updateDxfImportSettings: (settings: Partial<DxfImportSettingsState>) => void;
  resetToSampleModel: () => void;
}

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

export const useModelStore = create<ModelStoreState>((set) => {
  const initialModel = createSampleTowerSegmentModel();

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
    selectEntity: (selectedEntity) => set({ selectedEntity }),
    clearSelection: () => set({ selectedEntity: EMPTY_SELECTION }),
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
