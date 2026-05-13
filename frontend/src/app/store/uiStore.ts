import { create } from 'zustand';

import type { AppLanguage } from '../../shared/i18n';

const LANGUAGE_STORAGE_KEY = 'grideng.ui.language';
const THEME_MODE_STORAGE_KEY = 'grideng.ui.themeMode';

export type AppThemeMode = 'light' | 'dark';

export interface UiStoreState {
  language: AppLanguage;
  themeMode: AppThemeMode;
  setLanguage: (language: AppLanguage) => void;
  setThemeMode: (themeMode: AppThemeMode) => void;
  toggleThemeMode: () => void;
}

function readStoredLanguage(): AppLanguage {
  if (typeof window === 'undefined') {
    return 'ru';
  }

  const storedValue = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return storedValue === 'en' ? 'en' : 'ru';
}

function readStoredThemeMode(): AppThemeMode {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const storedValue = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
  return storedValue === 'light' ? 'light' : 'dark';
}

export const useUiStore = create<UiStoreState>((set) => ({
  language: readStoredLanguage(),
  themeMode: readStoredThemeMode(),
  setLanguage: (language) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }

    set({ language });
  },
  setThemeMode: (themeMode) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode);
    }

    set({ themeMode });
  },
  toggleThemeMode: () =>
    set((state) => {
      const nextThemeMode: AppThemeMode = state.themeMode === 'dark' ? 'light' : 'dark';

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_MODE_STORAGE_KEY, nextThemeMode);
      }

      return { themeMode: nextThemeMode };
    }),
}));
