import { z } from 'zod';

import { crossSectionsApi, materialsApi, requestJson, resolveApiBaseUrl, shouldUseApiFallback } from '../api';
import type { AppLanguage } from '../i18n';
import type { AppConsoleCommandResult } from './types';

type CatalogSource = 'backend' | 'fallback' | 'unavailable';

interface CatalogProbeResult {
  source: CatalogSource;
  detail?: string;
}

export function buildDbHelpResult(language: AppLanguage): AppConsoleCommandResult {
  return {
    severity: 'info',
    title: localize(language, 'DB-команды', 'DB commands'),
    lines: [
      'db.status - '
        + localize(
          language,
          'источник и доступность каталогов профилей и материалов',
          'catalog source and availability for profiles and materials',
        ),
      'db.profiles - '
        + localize(
          language,
          'краткая сводка каталога профилей',
          'short profile catalog summary',
        ),
      'db.materials - '
        + localize(
          language,
          'краткая сводка каталога материалов',
          'short material catalog summary',
        ),
      'db.refresh | db.reload - '
        + localize(
          language,
          'недоступно: безопасный API перезагрузки каталогов не реализован',
          'unavailable: a safe catalog reload API is not implemented',
        ),
    ],
  };
}

export async function buildDbStatusResult(language: AppLanguage): Promise<AppConsoleCommandResult> {
  const [profilesProbe, materialsProbe] = await Promise.all([
    probeCatalogSource('/api/cross-sections/standards'),
    probeCatalogSource('/api/materials/steels'),
  ]);

  const hasDegradedSource = profilesProbe.source !== 'backend' || materialsProbe.source !== 'backend';

  return {
    severity: hasDegradedSource ? 'warning' : 'info',
    title: localize(language, 'Статус каталогов', 'Catalog status'),
    lines: [
      `${localize(language, 'API', 'API')}: ${formatApiBaseUrl(language)}`,
      `${localize(language, 'Каталог профилей', 'Profile catalog')}: ${formatCatalogSource(language, profilesProbe.source)}`,
      ...buildProbeDetailLines(language, localize(language, 'Профили', 'Profiles'), profilesProbe),
      `${localize(language, 'Каталог материалов', 'Material catalog')}: ${formatCatalogSource(language, materialsProbe.source)}`,
      ...buildProbeDetailLines(language, localize(language, 'Материалы', 'Materials'), materialsProbe),
    ],
    notify: hasDegradedSource,
  };
}

export async function buildDbProfilesResult(language: AppLanguage): Promise<AppConsoleCommandResult> {
  const probe = await probeCatalogSource('/api/cross-sections/standards');

  if (probe.source === 'unavailable') {
    return buildUnavailableCatalogResult(language, 'db.profiles', localize(language, 'каталог профилей', 'profile catalog'), probe);
  }

  try {
    const [standards, profileTypes] = await Promise.all([
      crossSectionsApi.listStandards({ notifyOnError: false }),
      crossSectionsApi.listProfileTypes({ notifyOnError: false }),
    ]);

    const profilesCount = standards.reduce((sum, item) => sum + item.profileCount, 0);

    return {
      severity: probe.source === 'fallback' ? 'warning' : 'info',
      title: localize(language, 'Сводка каталога профилей', 'Profile catalog summary'),
      lines: [
        `${localize(language, 'Источник', 'Source')}: ${formatCatalogSource(language, probe.source)}`,
        `${localize(language, 'Стандарты', 'Standards')}: ${standards.length}`,
        `${localize(language, 'Типы профилей', 'Profile types')}: ${profileTypes.length}`,
        `${localize(language, 'Профили', 'Profiles')}: ${profilesCount}`,
        `${localize(language, 'Примеры стандартов', 'Standards sample')}: ${formatPreviewList(language, standards.map((item) => item.name))}`,
        `${localize(language, 'Примеры типов', 'Types sample')}: ${formatPreviewList(language, profileTypes.map((item) => item.id))}`,
      ],
      notify: probe.source === 'fallback',
    };
  } catch (error) {
    return buildExecutionFailureResult(language, 'db.profiles', error);
  }
}

export async function buildDbMaterialsResult(language: AppLanguage): Promise<AppConsoleCommandResult> {
  const probe = await probeCatalogSource('/api/materials/steels');

  if (probe.source === 'unavailable') {
    return buildUnavailableCatalogResult(language, 'db.materials', localize(language, 'каталог материалов', 'material catalog'), probe);
  }

  try {
    const [steels, materialOptions] = await Promise.all([
      materialsApi.listSteels({}, { notifyOnError: false }),
      materialsApi.listSteelOptions({}, { notifyOnError: false }),
    ]);

    const productTypes = [...new Set(materialOptions.flatMap((item) => item.productTypes))].sort((left, right) =>
      left.localeCompare(right),
    );

    return {
      severity: probe.source === 'fallback' ? 'warning' : 'info',
      title: localize(language, 'Сводка каталога материалов', 'Material catalog summary'),
      lines: [
        `${localize(language, 'Источник', 'Source')}: ${formatCatalogSource(language, probe.source)}`,
        `${localize(language, 'Марки стали', 'Steel grades')}: ${steels.length}`,
        `${localize(language, 'Строки свойств', 'Property rows')}: ${materialOptions.length}`,
        `${localize(language, 'Типы проката', 'Product types')}: ${formatPreviewList(language, productTypes)}`,
        `${localize(language, 'Примеры материалов', 'Materials sample')}: ${formatPreviewList(language, steels.map((item) => item.displayName))}`,
      ],
      notify: probe.source === 'fallback',
    };
  } catch (error) {
    return buildExecutionFailureResult(language, 'db.materials', error);
  }
}

export function buildDbRefreshUnavailableResult(language: AppLanguage): AppConsoleCommandResult {
  return {
    severity: 'warning',
    title: localize(
      language,
      'Команда недоступна: отсутствует API обновления каталогов.',
      'Command unavailable: catalog reload API is missing.',
    ),
    lines: [
      localize(
        language,
        'Текущая frontend/backend-итерация поддерживает только read-only команды состояния каталогов.',
        'The current frontend/backend iteration supports only read-only catalog status commands.',
      ),
    ],
    notify: true,
  };
}

async function probeCatalogSource(path: string): Promise<CatalogProbeResult> {
  try {
    await requestJson({
      path,
      schema: z.unknown(),
      notifyOnError: false,
    });

    return { source: 'backend' };
  } catch (error) {
    if (shouldUseApiFallback(error)) {
      return {
        source: 'fallback',
        detail: getErrorMessage(error),
      };
    }

    return {
      source: 'unavailable',
      detail: getErrorMessage(error),
    };
  }
}

function buildProbeDetailLines(
  language: AppLanguage,
  label: string,
  probe: CatalogProbeResult,
): string[] {
  if (probe.detail == null || probe.source === 'backend') {
    return [];
  }

  return [`${label}${localize(language, ' детали', ' detail')}: ${probe.detail}`];
}

function buildUnavailableCatalogResult(
  language: AppLanguage,
  commandName: string,
  scopeLabel: string,
  probe: CatalogProbeResult,
): AppConsoleCommandResult {
  return {
    severity: 'warning',
    title: localize(language, 'Команда недоступна.', 'Command unavailable.'),
    lines: [
      `${commandName}: ${localize(language, 'не удалось загрузить', 'failed to load')} ${scopeLabel}.`,
      probe.detail ?? localize(language, 'Отсутствует доступный API или fallback.', 'No available API or fallback source.'),
    ],
    notify: true,
  };
}

function buildExecutionFailureResult(
  language: AppLanguage,
  commandName: string,
  error: unknown,
): AppConsoleCommandResult {
  return {
    severity: 'warning',
    title: localize(language, 'Команда завершилась с ошибкой.', 'Command failed.'),
    lines: [`${commandName}: ${getErrorMessage(error)}`],
    notify: true,
  };
}

function formatApiBaseUrl(language: AppLanguage): string {
  const apiBaseUrl = resolveApiBaseUrl();

  if (apiBaseUrl.length > 0) {
    return apiBaseUrl;
  }

  return localize(language, 'same-origin', 'same-origin');
}

function formatCatalogSource(language: AppLanguage, source: CatalogSource): string {
  switch (source) {
    case 'backend':
      return localize(language, 'backend API', 'backend API');
    case 'fallback':
      return localize(language, 'локальный fallback', 'local fallback');
    case 'unavailable':
    default:
      return localize(language, 'недоступно', 'unavailable');
  }
}

function formatPreviewList(language: AppLanguage, values: string[], limit = 4): string {
  if (values.length === 0) {
    return localize(language, 'нет', 'none');
  }

  const preview = values.slice(0, limit).join(', ');
  const remainingCount = values.length - limit;

  if (remainingCount <= 0) {
    return preview;
  }

  return `${preview} ${localize(language, `(+${remainingCount} ещё)`, `(+${remainingCount} more)`)}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return String(error);
}

function localize(language: AppLanguage, ru: string, en: string): string {
  return language === 'ru' ? ru : en;
}
