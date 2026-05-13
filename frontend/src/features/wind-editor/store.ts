import { create } from 'zustand';

import { useModelStore } from '../../app/store';
import type { Id } from '../../entities/model';

export interface WindEditorStoreState {
  isOpen: boolean;
  open: (loadCaseId?: Id) => void;
  close: () => void;
}

export const useWindEditorStore = create<WindEditorStoreState>((set) => ({
  isOpen: false,
  open: (loadCaseId) =>
    set(() => {
      useModelStore.getState().setActiveLoadCaseId(loadCaseId ?? useModelStore.getState().activeLoadCaseId);

      return {
        isOpen: true,
      };
    }),
  close: () => set({ isOpen: false }),
}));

export function openWindEditorDialog(loadCaseId?: Id) {
  useWindEditorStore.getState().open(loadCaseId);
}
