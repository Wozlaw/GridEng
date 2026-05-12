import { create } from 'zustand';

import type { AppLanguage } from '../../shared/i18n';

const LANGUAGE_STORAGE_KEY = 'grideng.ui.language';

export interface UiStoreState {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
}

function readStoredLanguage(): AppLanguage {
  if (typeof window === 'undefined') {
    return 'ru';
  }

  const storedValue = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return storedValue === 'en' ? 'en' : 'ru';
}

export const useUiStore = create<UiStoreState>((set) => ({
  language: readStoredLanguage(),
  setLanguage: (language) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }

    set({ language });
  },
}));
