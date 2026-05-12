import { create } from 'zustand';

import { useModelStore } from '../../app/store';
import type { Id } from '../../entities/model';

export interface WindEditorStoreState {
  isOpen: boolean;
  activeLoadCaseId: Id | null;
  open: (loadCaseId?: Id) => void;
  close: () => void;
  setActiveLoadCaseId: (loadCaseId: Id) => void;
}

export const useWindEditorStore = create<WindEditorStoreState>((set) => ({
  isOpen: false,
  activeLoadCaseId: null,
  open: (loadCaseId) =>
    set(() => {
      const model = useModelStore.getState().model;
      const selectedEntity = useModelStore.getState().selectedEntity;
      const fallbackLoadCaseId = loadCaseId
        ?? (selectedEntity.type === 'loadCase'
          ? selectedEntity.id
          : selectedEntity.type === 'load'
            ? selectedEntity.loadCaseId
            : model.loadCases[0]?.id)
        ?? null;

      return {
        isOpen: true,
        activeLoadCaseId: fallbackLoadCaseId,
      };
    }),
  close: () => set({ isOpen: false }),
  setActiveLoadCaseId: (loadCaseId) => set({ activeLoadCaseId: loadCaseId }),
}));

export function openWindEditorDialog(loadCaseId?: Id) {
  useWindEditorStore.getState().open(loadCaseId);
}
