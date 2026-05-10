export type ViewMode = 'wireframe' | 'real' | 'loads' | 'restraints' | 'deformed' | 'stress-map';

export interface VisibilityState {
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

export const VIEW_MODE_OPTIONS: ViewModeOption[] = [
  { value: 'wireframe', label: 'Wireframe', description: 'Analytical member graph' },
  { value: 'real', label: 'Real', description: 'Section-aware visual mode' },
  { value: 'loads', label: 'Loads', description: 'Forces and moments overlay' },
  { value: 'restraints', label: 'Restraints', description: 'Support conditions' },
  { value: 'deformed', label: 'Deformed', description: 'Displaced shape placeholder' },
  { value: 'stress-map', label: 'Stress map', description: 'Analysis results placeholder' },
];

export const DEFAULT_VISIBILITY: VisibilityState = {
  nodes: true,
  members: true,
  loads: true,
  moments: true,
  restraints: true,
  labels: false,
};
