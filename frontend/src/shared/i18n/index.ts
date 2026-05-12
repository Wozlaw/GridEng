import { useMemo } from 'react';

import type { SelectedEntity } from '../../features/selection';
import { useUiStore } from '../../app/store';
import { enMessages } from './en';
import { ruMessages } from './ru';
import type { AppLanguage, TFunction, TranslationDictionary, TranslationParams } from './types';

const dictionaries: Record<AppLanguage, TranslationDictionary> = {
  ru: ruMessages,
  en: enMessages,
};

export type I18nKey = keyof typeof ruMessages;

export function translate(
  language: AppLanguage,
  key: I18nKey,
  params?: TranslationParams,
): string {
  const template = dictionaries[language][key] ?? dictionaries.en[key] ?? key;
  return interpolateTemplate(template, params);
}

export function useI18n(): {
  language: AppLanguage;
  t: TFunction<I18nKey>;
} {
  const language = useUiStore((state) => state.language);

  const t = useMemo<TFunction<I18nKey>>(
    () => (key, params) => translate(language, key, params),
    [language],
  );

  return { language, t };
}

export function getViewModeLabelKey(viewMode: string): I18nKey {
  return `viewMode.${viewMode}` as I18nKey;
}

export function getVisibilityLabelKey(visibilityKey: string): I18nKey {
  return `visibility.${visibilityKey}` as I18nKey;
}

export function formatSelectedEntityLabel(
  selectedEntity: SelectedEntity,
  t: TFunction<I18nKey>,
): string | null {
  switch (selectedEntity.type) {
    case 'node':
    case 'member':
    case 'profile':
    case 'material':
    case 'loadCase':
      return t('selection.entityWithId', {
        entity: t(`entity.${selectedEntity.type}` as I18nKey),
        id: selectedEntity.id,
      });
    case 'load':
      return t('selection.load', {
        loadId: selectedEntity.loadId,
        loadCaseId: selectedEntity.loadCaseId,
      });
    case 'restraint':
      return selectedEntity.nodeId != null
        ? t('selection.restraint', {
          restraintId: selectedEntity.restraintId,
          nodeId: selectedEntity.nodeId,
        })
        : t('selection.restraintNoNode', {
          restraintId: selectedEntity.restraintId,
        });
    default:
      return null;
  }
}

function interpolateTemplate(template: string, params?: TranslationParams): string {
  if (params == null) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = params[key];
    return value == null ? '' : String(value);
  });
}

export type { AppLanguage, TFunction, TranslationParams } from './types';
