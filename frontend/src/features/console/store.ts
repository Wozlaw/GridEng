import { create } from 'zustand';

import type { CommandConsoleEntry, CommandConsoleEntryLevel } from './types';

const MAX_LOG_ENTRIES = 200;
const MAX_HISTORY_ENTRIES = 40;
const DEFAULT_DOCKED_HEIGHT = 220;
const MIN_DOCKED_HEIGHT = 148;
const MAX_DOCKED_HEIGHT = 420;

interface AppendConsoleEntryInput {
  level: CommandConsoleEntryLevel;
  title?: string;
  lines?: string[];
}

export interface CommandConsoleStoreState {
  isDockedOpen: boolean;
  isFullscreenOpen: boolean;
  entries: CommandConsoleEntry[];
  history: string[];
  inputValue: string;
  dockedHeight: number;
  openDocked: () => void;
  closeDocked: () => void;
  toggleDocked: () => void;
  openFullscreen: () => void;
  closeFullscreen: () => void;
  toggleFullscreen: () => void;
  setInputValue: (value: string) => void;
  setDockedHeight: (height: number) => void;
  clearEntries: () => void;
  appendEntry: (entry: AppendConsoleEntryInput) => void;
  pushHistory: (command: string) => void;
}

export const useCommandConsoleStore = create<CommandConsoleStoreState>((set) => ({
  isDockedOpen: false,
  isFullscreenOpen: false,
  entries: [],
  history: [],
  inputValue: '',
  dockedHeight: DEFAULT_DOCKED_HEIGHT,
  openDocked: () => set({ isDockedOpen: true }),
  closeDocked: () => set({ isDockedOpen: false }),
  toggleDocked: () => set((state) => ({ isDockedOpen: !state.isDockedOpen })),
  openFullscreen: () => set({ isFullscreenOpen: true }),
  closeFullscreen: () => set({ isFullscreenOpen: false }),
  toggleFullscreen: () => set((state) => ({ isFullscreenOpen: !state.isFullscreenOpen })),
  setInputValue: (value) => set({ inputValue: value }),
  setDockedHeight: (height) =>
    set({
      dockedHeight: Math.min(MAX_DOCKED_HEIGHT, Math.max(MIN_DOCKED_HEIGHT, Math.round(height))),
    }),
  clearEntries: () => set({ entries: [] }),
  appendEntry: (entry) =>
    set((state) => ({
      entries: [
        ...state.entries,
        {
          id: `console-entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          level: entry.level,
          title: entry.title,
          lines: entry.lines?.length ? entry.lines : [],
          timestamp: Date.now(),
        },
      ].slice(-MAX_LOG_ENTRIES),
    })),
  pushHistory: (command) =>
    set((state) => ({
      history: [
        command,
        ...state.history.filter((entry) => entry !== command),
      ].slice(0, MAX_HISTORY_ENTRIES),
    })),
}));

export function openCommandConsole() {
  useCommandConsoleStore.getState().openFullscreen();
}

export function closeCommandConsole() {
  useCommandConsoleStore.getState().closeFullscreen();
}

export function toggleDockedCommandConsole() {
  useCommandConsoleStore.getState().toggleDocked();
}

export { DEFAULT_DOCKED_HEIGHT, MAX_DOCKED_HEIGHT, MIN_DOCKED_HEIGHT };
