export type AppLanguage = 'ru' | 'en';

export type TranslationParams = Record<string, string | number | boolean | null | undefined>;

export type TranslationDictionary = Record<string, string>;

export type TFunction<Key extends string = string> = (
  key: Key,
  params?: TranslationParams,
) => string;
