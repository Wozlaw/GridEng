import { z } from 'zod';

import type { Profile, ProfileKind } from '../../entities/model';
import {
  CrossSectionCatalogItemSchema,
  CrossSectionDataframeRowSchema,
  CrossSectionDetailsResponseSchema,
  CrossSectionProfileTypeCatalogItemSchema,
  CrossSectionStandardCatalogItemSchema,
  findProfileById,
  getProfileCatalog,
  type CrossSectionCatalogFilters,
  type CrossSectionCatalogItem,
  type CrossSectionDataframeRow,
  type CrossSectionDetailsResponse,
  type CrossSectionProfileTypeCatalogItem,
  type CrossSectionStandardCatalogItem,
} from '../../entities/section';
import {
  notifyApiError,
  notifyApiFallbackOnce,
  requestJson,
  shouldUseApiFallback,
  type AdapterRequestOptions,
} from './http';

const LOCAL_STANDARD_ID = 'local_catalog';
const LOCAL_STANDARD_NAME = 'Local catalog';
const LOCAL_STANDARD_TITLE = 'Local fixture catalog';
const LOCAL_DATASET_ID = 'profiles.local';

const backendDimensionsSchema = z.record(z.string(), z.number().finite());
const backendValueSchema = z.union([z.string(), z.number().finite(), z.boolean(), z.null()]);

const backendStandardItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  title: z.string().min(1),
  dataset_id: z.string().min(1),
  profile_types: z.array(z.string().min(1)),
  profile_count: z.number().int().nonnegative(),
});

const backendProfileTypeItemSchema = z.object({
  id: z.string().min(1),
  profile_count: z.number().int().nonnegative(),
  standard_ids: z.array(z.string().min(1)),
  standard_names: z.array(z.string().min(1)),
});

const backendCatalogItemSchema = z.object({
  id: z.string().min(1),
  standard_id: z.string().min(1),
  standard_name: z.string().min(1),
  dataset_id: z.string().min(1),
  profile_type: z.string().min(1),
  series: z.string().min(1).nullable().optional(),
  gost_number: z.string().min(1),
  designation: z.string().min(1),
  display_name: z.string().min(1),
  shape_method: z.string().min(1),
  dimensions_mm: backendDimensionsSchema,
});

const backendProfileDetailsSchema = z.object({
  catalog_item: backendCatalogItemSchema,
  geometry: backendDimensionsSchema,
  calculated: z.record(z.string(), backendValueSchema),
  dataframe_row: z.record(z.string(), backendValueSchema),
});

export const crossSectionsApi = {
  async listStandards(options: AdapterRequestOptions = {}): Promise<CrossSectionStandardCatalogItem[]> {
    try {
      const response = await requestJson({
        path: '/api/cross-sections/standards',
        schema: z.array(backendStandardItemSchema),
        ...options,
      });

      return response.map(mapStandardItem);
    } catch (error) {
      if (shouldUseApiFallback(error)) {
        if (options.notifyOnError !== false) {
          notifyApiFallbackOnce('cross-sections', 'Cross-section catalog', error);
        }
        return buildLocalStandardItems();
      }

      if (options.notifyOnError !== false) {
        notifyApiError('Cross-section catalog', error);
      }
      throw error;
    }
  },

  async listProfileTypes(options: AdapterRequestOptions = {}): Promise<CrossSectionProfileTypeCatalogItem[]> {
    try {
      const response = await requestJson({
        path: '/api/cross-sections/profile-types',
        schema: z.array(backendProfileTypeItemSchema),
        ...options,
      });

      return response.map(mapProfileTypeItem);
    } catch (error) {
      if (shouldUseApiFallback(error)) {
        if (options.notifyOnError !== false) {
          notifyApiFallbackOnce('cross-sections', 'Cross-section catalog', error);
        }
        return buildLocalProfileTypeItems();
      }

      if (options.notifyOnError !== false) {
        notifyApiError('Cross-section catalog', error);
      }
      throw error;
    }
  },

  async listCatalog(
    filters: CrossSectionCatalogFilters = {},
    options: AdapterRequestOptions = {},
  ): Promise<CrossSectionCatalogItem[]> {
    try {
      const response = await requestJson({
        path: '/api/cross-sections/catalog',
        schema: z.array(backendCatalogItemSchema),
        query: {
          standard_id: filters.standardId,
          profile_type: filters.profileType,
          query: filters.query,
        },
        ...options,
      });

      return response.map(mapCatalogItem);
    } catch (error) {
      if (shouldUseApiFallback(error)) {
        if (options.notifyOnError !== false) {
          notifyApiFallbackOnce('cross-sections', 'Cross-section catalog', error);
        }
        return buildLocalCatalogItems(filters);
      }

      if (options.notifyOnError !== false) {
        notifyApiError('Cross-section catalog', error);
      }
      throw error;
    }
  },

  async getProfileDetails(
    profileId: string,
    options: AdapterRequestOptions = {},
  ): Promise<CrossSectionDetailsResponse> {
    try {
      const response = await requestJson({
        path: `/api/cross-sections/${encodeURIComponent(profileId)}`,
        schema: backendProfileDetailsSchema,
        ...options,
      });

      return mapProfileDetails(response);
    } catch (error) {
      if (shouldUseApiFallback(error)) {
        const localProfile = findProfileById(profileId);
        if (localProfile != null) {
          if (options.notifyOnError !== false) {
            notifyApiFallbackOnce('cross-sections', 'Cross-section catalog', error);
          }
          return buildLocalProfileDetails(localProfile);
        }
      }

      if (options.notifyOnError !== false) {
        notifyApiError('Cross-section profile details', error);
      }
      throw error;
    }
  },

  async getDataframeRow(profileId: string, options: AdapterRequestOptions = {}): Promise<CrossSectionDataframeRow> {
    try {
      const response = await requestJson({
        path: `/api/cross-sections/${encodeURIComponent(profileId)}/dataframe-row`,
        schema: z.record(z.string(), backendValueSchema),
        ...options,
      });

      return CrossSectionDataframeRowSchema.parse(toCamelizedDataframeRow(response));
    } catch (error) {
      if (shouldUseApiFallback(error)) {
        const localProfile = findProfileById(profileId);
        if (localProfile != null) {
          if (options.notifyOnError !== false) {
            notifyApiFallbackOnce('cross-sections', 'Cross-section catalog', error);
          }
          return buildLocalDataframeRow(localProfile);
        }
      }

      if (options.notifyOnError !== false) {
        notifyApiError('Cross-section profile dataframe row', error);
      }
      throw error;
    }
  },
};

function mapStandardItem(item: z.infer<typeof backendStandardItemSchema>): CrossSectionStandardCatalogItem {
  return CrossSectionStandardCatalogItemSchema.parse({
    id: item.id,
    name: item.name,
    title: item.title,
    datasetId: item.dataset_id,
    profileTypes: item.profile_types,
    profileCount: item.profile_count,
  });
}

function mapProfileTypeItem(
  item: z.infer<typeof backendProfileTypeItemSchema>,
): CrossSectionProfileTypeCatalogItem {
  return CrossSectionProfileTypeCatalogItemSchema.parse({
    id: item.id,
    profileCount: item.profile_count,
    standardIds: item.standard_ids,
    standardNames: item.standard_names,
  });
}

function mapCatalogItem(item: z.infer<typeof backendCatalogItemSchema>): CrossSectionCatalogItem {
  return CrossSectionCatalogItemSchema.parse({
    id: item.id,
    datasetId: item.dataset_id,
    standardId: item.standard_id,
    standardName: item.standard_name,
    profileType: item.profile_type,
    series: item.series ?? null,
    gostNumber: item.gost_number,
    designation: item.designation,
    displayName: item.display_name,
    shapeMethod: item.shape_method,
    dimensionsMm: item.dimensions_mm,
  });
}

function mapProfileDetails(item: z.infer<typeof backendProfileDetailsSchema>): CrossSectionDetailsResponse {
  return CrossSectionDetailsResponseSchema.parse({
    catalogItem: mapCatalogItem(item.catalog_item),
    geometry: item.geometry,
    calculated: item.calculated,
    dataframeRow: toCamelizedDataframeRow(item.dataframe_row),
  });
}

function buildLocalStandardItems(): CrossSectionStandardCatalogItem[] {
  const localItems = buildAllLocalCatalogItems();

  return [
    CrossSectionStandardCatalogItemSchema.parse({
      id: LOCAL_STANDARD_ID,
      name: LOCAL_STANDARD_NAME,
      title: LOCAL_STANDARD_TITLE,
      datasetId: LOCAL_DATASET_ID,
      profileTypes: [...new Set(localItems.map((item) => item.profileType))].sort(),
      profileCount: localItems.length,
    }),
  ];
}

function buildLocalProfileTypeItems(): CrossSectionProfileTypeCatalogItem[] {
  const counts = new Map<string, number>();
  for (const item of buildAllLocalCatalogItems()) {
    counts.set(item.profileType, (counts.get(item.profileType) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([id, profileCount]) =>
      CrossSectionProfileTypeCatalogItemSchema.parse({
        id,
        profileCount,
        standardIds: [LOCAL_STANDARD_ID],
        standardNames: [LOCAL_STANDARD_NAME],
      }),
    );
}

function buildLocalCatalogItems(filters: CrossSectionCatalogFilters): CrossSectionCatalogItem[] {
  const normalizedQuery = filters.query?.trim().toLowerCase();

  return buildAllLocalCatalogItems().filter((item) => {
    if (filters.standardId != null && filters.standardId !== item.standardId) {
      return false;
    }

    if (filters.profileType != null && filters.profileType !== item.profileType) {
      return false;
    }

    if (normalizedQuery == null || normalizedQuery.length === 0) {
      return true;
    }

    return [item.displayName, item.designation, item.gostNumber, item.profileType].some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    );
  });
}

function buildAllLocalCatalogItems(): CrossSectionCatalogItem[] {
  return getProfileCatalog().map((profile) => mapLocalProfileToCatalogItem(profile));
}

function buildLocalProfileDetails(profile: Profile): CrossSectionDetailsResponse {
  const catalogItem = mapLocalProfileToCatalogItem(profile);
  const calculated = buildLocalCalculatedValues(profile);

  return CrossSectionDetailsResponseSchema.parse({
    catalogItem,
    geometry: catalogItem.dimensionsMm,
    calculated,
    dataframeRow: buildLocalDataframeRow(profile),
  });
}

function buildLocalDataframeRow(profile: Profile): CrossSectionDataframeRow {
  const catalogItem = mapLocalProfileToCatalogItem(profile);
  const calculated = buildLocalCalculatedValues(profile);
  const dataframeRow: CrossSectionDataframeRow = {
    profileId: catalogItem.id,
    datasetId: catalogItem.datasetId,
    standardId: catalogItem.standardId,
    standardName: catalogItem.standardName,
    profileType: catalogItem.profileType,
    series: catalogItem.series ?? null,
    gostNumber: catalogItem.gostNumber,
    designation: catalogItem.designation,
    displayName: catalogItem.displayName,
    shapeMethod: catalogItem.shapeMethod,
  };

  for (const [key, value] of Object.entries(calculated)) {
    dataframeRow[key] = value;
  }

  return CrossSectionDataframeRowSchema.parse(dataframeRow);
}

function mapLocalProfileToCatalogItem(profile: Profile): CrossSectionCatalogItem {
  const mapping = mapLocalProfileKind(profile.kind);

  return CrossSectionCatalogItemSchema.parse({
    id: profile.id,
    datasetId: LOCAL_DATASET_ID,
    standardId: LOCAL_STANDARD_ID,
    standardName: LOCAL_STANDARD_NAME,
    profileType: mapping.profileType,
    series: null,
    gostNumber: profile.name,
    designation: profile.name,
    displayName: profile.name,
    shapeMethod: mapping.shapeMethod,
    dimensionsMm: { ...profile.params },
  });
}

function buildLocalCalculatedValues(profile: Profile): Record<string, string | number> {
  const calculated: Record<string, string | number> = {};

  if (profile.section.areaMm2 != null) {
    calculated.A = profile.section.areaMm2;
  }
  if (profile.section.IyMm4 != null) {
    calculated.Iy = profile.section.IyMm4;
  }
  if (profile.section.IzMm4 != null) {
    calculated.Iz = profile.section.IzMm4;
  }
  if (profile.section.JxMm4 != null) {
    calculated.Jx = profile.section.JxMm4;
  }
  if (profile.section.WxMm3 != null) {
    calculated.Wx = profile.section.WxMm3;
  }
  if (profile.section.WyMm3 != null) {
    calculated.Wy = profile.section.WyMm3;
  }
  if (profile.section.WzMm3 != null) {
    calculated.Wz = profile.section.WzMm3;
  }
  if (profile.massKgPerM != null) {
    calculated.massKgPerM = profile.massKgPerM;
  }

  calculated.axis = 'YZ';
  return calculated;
}

function toCamelizedDataframeRow(raw: Record<string, string | number | boolean | null>): CrossSectionDataframeRow {
  const dataframeRow: CrossSectionDataframeRow = {};

  for (const [key, value] of Object.entries(raw)) {
    dataframeRow[snakeToCamel(key)] = value;
  }

  return dataframeRow;
}

function snakeToCamel(value: string): string {
  return value.replace(/_([a-z])/gu, (_match, letter: string) => letter.toUpperCase());
}

function mapLocalProfileKind(kind: ProfileKind): { profileType: string; shapeMethod: string } {
  switch (kind) {
    case 'L_equal':
      return { profileType: 'angle_equal', shapeMethod: 'LShape' };
    case 'L_unequal':
      return { profileType: 'angle_unequal', shapeMethod: 'LShape' };
    case 'U':
      return { profileType: 'channel', shapeMethod: 'ChannelShape' };
    case 'I':
      return { profileType: 'i_beam', shapeMethod: 'IShape' };
    case 'pipe':
      return { profileType: 'pipe_round', shapeMethod: 'PipeShape' };
    case 'rect_pipe':
      return { profileType: 'rect_pipe', shapeMethod: 'RectShape' };
    case 'round_bar':
      return { profileType: 'round_bar', shapeMethod: 'CircleShape' };
    case 'flat_bar':
      return { profileType: 'flat_bar', shapeMethod: 'RectShape' };
    case 'custom':
    default:
      return { profileType: 'custom', shapeMethod: 'CustomShape' };
  }
}
