import { create } from 'zustand';

const PROJECT_TREE_WIDTH_STORAGE_KEY = 'grideng.layout.projectTree.width';
const PROJECT_TREE_COLLAPSED_STORAGE_KEY = 'grideng.layout.projectTree.collapsed';
const PROPERTIES_WIDTH_STORAGE_KEY = 'grideng.layout.properties.width';
const PROPERTIES_COLLAPSED_STORAGE_KEY = 'grideng.layout.properties.collapsed';

export const PROJECT_TREE_WIDTH_MIN = 240;
export const PROJECT_TREE_WIDTH_MAX = 420;
export const PROJECT_TREE_WIDTH_DEFAULT = 280;

export const PROPERTIES_WIDTH_MIN = 280;
export const PROPERTIES_WIDTH_MAX = 520;
export const PROPERTIES_WIDTH_DEFAULT = 360;

export interface LayoutStoreState {
  projectTreeWidth: number;
  projectTreeCollapsed: boolean;
  propertiesWidth: number;
  propertiesCollapsed: boolean;
  setProjectTreeWidth: (width: number) => void;
  setProjectTreeCollapsed: (collapsed: boolean) => void;
  toggleProjectTreeCollapsed: () => void;
  setPropertiesWidth: (width: number) => void;
  setPropertiesCollapsed: (collapsed: boolean) => void;
  togglePropertiesCollapsed: () => void;
}

function clampWidth(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

function readStoredWidth(storageKey: string, min: number, max: number, fallback: number): number {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const storedValue = window.localStorage.getItem(storageKey);
  if (storedValue == null) {
    return fallback;
  }

  return clampWidth(Number(storedValue), min, max, fallback);
}

function readStoredCollapsed(storageKey: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(storageKey) === 'true';
}

function persistWidth(storageKey: string, width: number) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(storageKey, String(width));
  }
}

function persistCollapsed(storageKey: string, collapsed: boolean) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(storageKey, String(collapsed));
  }
}

export const useLayoutStore = create<LayoutStoreState>((set) => ({
  projectTreeWidth: readStoredWidth(
    PROJECT_TREE_WIDTH_STORAGE_KEY,
    PROJECT_TREE_WIDTH_MIN,
    PROJECT_TREE_WIDTH_MAX,
    PROJECT_TREE_WIDTH_DEFAULT,
  ),
  projectTreeCollapsed: readStoredCollapsed(PROJECT_TREE_COLLAPSED_STORAGE_KEY),
  propertiesWidth: readStoredWidth(
    PROPERTIES_WIDTH_STORAGE_KEY,
    PROPERTIES_WIDTH_MIN,
    PROPERTIES_WIDTH_MAX,
    PROPERTIES_WIDTH_DEFAULT,
  ),
  propertiesCollapsed: readStoredCollapsed(PROPERTIES_COLLAPSED_STORAGE_KEY),
  setProjectTreeWidth: (width) => {
    const nextWidth = clampWidth(
      width,
      PROJECT_TREE_WIDTH_MIN,
      PROJECT_TREE_WIDTH_MAX,
      PROJECT_TREE_WIDTH_DEFAULT,
    );
    persistWidth(PROJECT_TREE_WIDTH_STORAGE_KEY, nextWidth);
    set({ projectTreeWidth: nextWidth });
  },
  setProjectTreeCollapsed: (collapsed) => {
    persistCollapsed(PROJECT_TREE_COLLAPSED_STORAGE_KEY, collapsed);
    set({ projectTreeCollapsed: collapsed });
  },
  toggleProjectTreeCollapsed: () =>
    set((state) => {
      const nextCollapsed = !state.projectTreeCollapsed;
      persistCollapsed(PROJECT_TREE_COLLAPSED_STORAGE_KEY, nextCollapsed);
      return { projectTreeCollapsed: nextCollapsed };
    }),
  setPropertiesWidth: (width) => {
    const nextWidth = clampWidth(
      width,
      PROPERTIES_WIDTH_MIN,
      PROPERTIES_WIDTH_MAX,
      PROPERTIES_WIDTH_DEFAULT,
    );
    persistWidth(PROPERTIES_WIDTH_STORAGE_KEY, nextWidth);
    set({ propertiesWidth: nextWidth });
  },
  setPropertiesCollapsed: (collapsed) => {
    persistCollapsed(PROPERTIES_COLLAPSED_STORAGE_KEY, collapsed);
    set({ propertiesCollapsed: collapsed });
  },
  togglePropertiesCollapsed: () =>
    set((state) => {
      const nextCollapsed = !state.propertiesCollapsed;
      persistCollapsed(PROPERTIES_COLLAPSED_STORAGE_KEY, nextCollapsed);
      return { propertiesCollapsed: nextCollapsed };
    }),
}));
