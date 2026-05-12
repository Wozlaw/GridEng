export type ViewMode = 'wireframe' | 'real' | 'loads' | 'restraints' | 'deformed' | 'stress-map';
export type ActiveViewMode = Exclude<ViewMode, 'deformed'>;

export interface VisibilityState {
  axes: boolean;
  grid: boolean;
  nodes: boolean;
  members: boolean;
  loads: boolean;
  moments: boolean;
  restraints: boolean;
  labels: boolean;
}

export interface ViewModeOption {
  value: ViewMode;
  label: string;
  description: string;
}

export const ACTIVE_VIEW_MODES: ActiveViewMode[] = [
  'wireframe',
  'real',
  'loads',
  'restraints',
  'stress-map',
];

export const VIEW_MODE_OPTIONS: ViewModeOption[] = [
  { value: 'wireframe', label: 'Wireframe', description: 'Analytical member graph' },
  { value: 'real', label: 'Real', description: 'Section-aware visual mode' },
  { value: 'loads', label: 'Loads', description: 'Forces and moments overlay' },
  { value: 'restraints', label: 'Restraints', description: 'Support conditions' },
  { value: 'stress-map', label: 'Stress map', description: 'Analysis results visualization' },
];

export function isActiveViewMode(value: string): value is ActiveViewMode {
  return ACTIVE_VIEW_MODES.includes(value as ActiveViewMode);
}

export function normalizeViewMode(viewMode: ViewMode): ActiveViewMode {
  return viewMode === 'deformed' ? 'wireframe' : viewMode;
}

export const DEFAULT_VISIBILITY: VisibilityState = {
  axes: true,
  grid: true,
  nodes: true,
  members: true,
  loads: true,
  moments: true,
  restraints: true,
  labels: false,
};
