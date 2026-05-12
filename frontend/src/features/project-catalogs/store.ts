import { create } from 'zustand';

import { useModelStore } from '../../app/store';
import type { Id } from '../../entities/model';

export interface ProjectCatalogsStoreState {
  profilesDialogOpen: boolean;
  materialsDialogOpen: boolean;
  activeProfileId: Id | null;
  activeMaterialId: Id | null;
  openProfilesDialog: (profileId?: Id) => void;
  closeProfilesDialog: () => void;
  setActiveProfileId: (profileId: Id) => void;
  openMaterialsDialog: (materialId?: Id) => void;
  closeMaterialsDialog: () => void;
  setActiveMaterialId: (materialId: Id) => void;
}

export const useProjectCatalogsStore = create<ProjectCatalogsStoreState>((set) => ({
  profilesDialogOpen: false,
  materialsDialogOpen: false,
  activeProfileId: null,
  activeMaterialId: null,
  openProfilesDialog: (profileId) =>
    set(() => {
      const model = useModelStore.getState().model;
      const selectedEntity = useModelStore.getState().selectedEntity;
      const fallbackProfileId = selectedEntity.type === 'profile'
        ? selectedEntity.id
        : model.profiles[0]?.id ?? null;

      return {
        profilesDialogOpen: true,
        activeProfileId: profileId ?? fallbackProfileId,
      };
    }),
  closeProfilesDialog: () => set({ profilesDialogOpen: false }),
  setActiveProfileId: (profileId) => set({ activeProfileId: profileId }),
  openMaterialsDialog: (materialId) =>
    set(() => {
      const model = useModelStore.getState().model;
      const selectedEntity = useModelStore.getState().selectedEntity;
      const fallbackMaterialId = selectedEntity.type === 'material'
        ? selectedEntity.id
        : model.materials[0]?.id ?? null;

      return {
        materialsDialogOpen: true,
        activeMaterialId: materialId ?? fallbackMaterialId,
      };
    }),
  closeMaterialsDialog: () => set({ materialsDialogOpen: false }),
  setActiveMaterialId: (materialId) => set({ activeMaterialId: materialId }),
}));

export function openProfilesDialog(profileId?: Id) {
  useProjectCatalogsStore.getState().openProfilesDialog(profileId);
}

export function openMaterialsDialog(materialId?: Id) {
  useProjectCatalogsStore.getState().openMaterialsDialog(materialId);
}
