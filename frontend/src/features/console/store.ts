import { create } from 'zustand';

import type { CommandConsoleEntry, CommandConsoleEntryLevel } from './types';

const MAX_LOG_ENTRIES = 200;
const MAX_HISTORY_ENTRIES = 40;

interface AppendConsoleEntryInput {
  level: CommandConsoleEntryLevel;
  title?: string;
  lines?: string[];
}

export interface CommandConsoleStoreState {
  isOpen: boolean;
  entries: CommandConsoleEntry[];
  history: string[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  clearEntries: () => void;
  appendEntry: (entry: AppendConsoleEntryInput) => void;
  pushHistory: (command: string) => void;
}

export const useCommandConsoleStore = create<CommandConsoleStoreState>((set) => ({
  isOpen: false,
  entries: [],
  history: [],
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
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
  useCommandConsoleStore.getState().open();
}

export function closeCommandConsole() {
  useCommandConsoleStore.getState().close();
}
