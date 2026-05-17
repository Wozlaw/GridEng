import type { Id, Profile, ProfileKind, SectionProperties } from '../model';
import type { CrossSectionCatalogItem, CrossSectionDetailsResponse } from './apiTypes';

export interface CreateCustomProfileInput {
  id?: Id;
  name: string;
  params?: Record<string, number>;
  section?: SectionProperties;
  massKgPerM?: number;
  defaultLocalAxisRotationDeg?: number;
  defaultOffsetYmm?: number;
  defaultOffsetZmm?: number;
  color?: string;
}

const CATALOG_PROFILE_COLORS: Partial<Record<ProfileKind, string>> = {
  L_equal: '#58a6ff',
  L_unequal: '#2a9d8f',
  U: '#4cc9f0',
  I: '#dd6b20',
  pipe: '#f6ad55',
  rect_pipe: '#805ad5',
  round_bar: '#2cb1bc',
  flat_bar: '#9f7aea',
};

export const LOCAL_PROFILE_CATALOG: readonly Readonly<Profile>[] = [
  {
    id: 'catalog-L63x5',
    name: 'L63x5',
    kind: 'L_equal',
    params: { b: 63, t: 5 },
    defaultLocalAxisRotationDeg: 0,
    defaultOffsetYmm: 0,
    defaultOffsetZmm: 0,
    massKgPerM: 4.8,
    section: {
      areaMm2: 610,
      IyMm4: 221000,
      IzMm4: 87500,
      JxMm4: 6400,
      WyMm3: 7000,
      WzMm3: 2800,
      WxMm3: 1300,
    },
    color: '#58a6ff',
  },
  {
    id: 'catalog-L75x6',
    name: 'L75x6',
    kind: 'L_equal',
    params: { b: 75, t: 6 },
    defaultLocalAxisRotationDeg: 0,
    defaultOffsetYmm: 0,
    defaultOffsetZmm: 0,
    massKgPerM: 6.8,
    section: {
      areaMm2: 865,
      IyMm4: 433000,
      IzMm4: 170000,
      JxMm4: 9800,
      WyMm3: 11500,
      WzMm3: 4500,
      WxMm3: 1900,
    },
    color: '#4cc9f0',
  },
  {
    id: 'catalog-L90x6',
    name: 'L90x6',
    kind: 'L_equal',
    params: { b: 90, t: 6 },
    defaultLocalAxisRotationDeg: 0,
    defaultOffsetYmm: 0,
    defaultOffsetZmm: 0,
    massKgPerM: 8.1,
    section: {
      areaMm2: 1030,
      IyMm4: 789000,
      IzMm4: 312000,
      JxMm4: 13800,
      WyMm3: 17600,
      WzMm3: 7000,
      WxMm3: 2300,
    },
    color: '#2cb1bc',
  },
  {
    id: 'catalog-L100x63x8',
    name: 'L100x63x8',
    kind: 'L_unequal',
    params: { h: 100, b: 63, t: 8 },
    defaultLocalAxisRotationDeg: 0,
    defaultOffsetYmm: 0,
    defaultOffsetZmm: 0,
    massKgPerM: 9.7,
    section: {
      areaMm2: 1230,
      IyMm4: 1120000,
      IzMm4: 292000,
      JxMm4: 17500,
      WyMm3: 22500,
      WzMm3: 6200,
      WxMm3: 3000,
    },
    color: '#2a9d8f',
  },
  {
    id: 'catalog-L125x80x8',
    name: 'L125x80x8',
    kind: 'L_unequal',
    params: { h: 125, b: 80, t: 8 },
    defaultLocalAxisRotationDeg: 0,
    defaultOffsetYmm: 0,
    defaultOffsetZmm: 0,
    massKgPerM: 12.4,
    section: {
      areaMm2: 1580,
      IyMm4: 2130000,
      IzMm4: 540000,
      JxMm4: 24800,
      WyMm3: 34000,
      WzMm3: 9000,
      WxMm3: 4200,
    },
    color: '#2f855a',
  },
  {
    id: 'catalog-pipe42x3.2',
    name: 'Pipe 42.3x3.2',
    kind: 'pipe',
    params: { d: 42.3, t: 3.2 },
    defaultLocalAxisRotationDeg: 0,
    defaultOffsetYmm: 0,
    defaultOffsetZmm: 0,
    massKgPerM: 3.1,
    section: {
      areaMm2: 398,
      IyMm4: 74600,
      IzMm4: 74600,
      JxMm4: 149000,
      WyMm3: 3530,
      WzMm3: 3530,
      WxMm3: 7040,
    },
    color: '#f6ad55',
  },
  {
    id: 'catalog-pipe57x4',
    name: 'Pipe 57x4',
    kind: 'pipe',
    params: { d: 57, t: 4 },
    defaultLocalAxisRotationDeg: 0,
    defaultOffsetYmm: 0,
    defaultOffsetZmm: 0,
    massKgPerM: 5.1,
    section: {
      areaMm2: 666,
      IyMm4: 244000,
      IzMm4: 244000,
      JxMm4: 488000,
      WyMm3: 8600,
      WzMm3: 8600,
      WxMm3: 17100,
    },
    color: '#ed8936',
  },
  {
    id: 'catalog-pipe76x4',
    name: 'Pipe 76x4',
    kind: 'pipe',
    params: { d: 76, t: 4 },
    defaultLocalAxisRotationDeg: 0,
    defaultOffsetYmm: 0,
    defaultOffsetZmm: 0,
    massKgPerM: 7,
    section: {
      areaMm2: 894,
      IyMm4: 576000,
      IzMm4: 576000,
      JxMm4: 1150000,
      WyMm3: 15200,
      WzMm3: 15200,
      WxMm3: 30200,
    },
    color: '#dd6b20',
  },
  {
    id: 'catalog-rhs60x40x3',
    name: 'RHS 60x40x3',
    kind: 'rect_pipe',
    params: { h: 60, b: 40, t: 3 },
    defaultLocalAxisRotationDeg: 0,
    defaultOffsetYmm: 0,
    defaultOffsetZmm: 0,
    massKgPerM: 4.5,
    section: {
      areaMm2: 573,
      IyMm4: 284000,
      IzMm4: 148000,
      JxMm4: 336000,
      WyMm3: 9480,
      WzMm3: 7390,
      WxMm3: 11200,
    },
    color: '#9f7aea',
  },
  {
    id: 'catalog-rhs80x40x4',
    name: 'RHS 80x40x4',
    kind: 'rect_pipe',
    params: { h: 80, b: 40, t: 4 },
    defaultLocalAxisRotationDeg: 0,
    defaultOffsetYmm: 0,
    defaultOffsetZmm: 0,
    massKgPerM: 6.8,
    section: {
      areaMm2: 869,
      IyMm4: 753000,
      IzMm4: 245000,
      JxMm4: 741000,
      WyMm3: 18800,
      WzMm3: 12300,
      WxMm3: 18500,
    },
    color: '#805ad5',
  },
  {
    id: 'catalog-rhs120x80x5',
    name: 'RHS 120x80x5',
    kind: 'rect_pipe',
    params: { h: 120, b: 80, t: 5 },
    defaultLocalAxisRotationDeg: 0,
    defaultOffsetYmm: 0,
    defaultOffsetZmm: 0,
    massKgPerM: 13.8,
    section: {
      areaMm2: 1760,
      IyMm4: 3580000,
      IzMm4: 1970000,
      JxMm4: 4310000,
      WyMm3: 59700,
      WzMm3: 49300,
      WxMm3: 71800,
    },
    color: '#6b46c1',
  },
] as const;

export function getProfileCatalog(): Profile[] {
  return LOCAL_PROFILE_CATALOG.map(cloneProfile);
}

export function findProfileById(id: Id): Profile | undefined {
  const match = LOCAL_PROFILE_CATALOG.find((profile) => profile.id === id);
  return match == null ? undefined : cloneProfile(match);
}

export function createCustomProfile(input: CreateCustomProfileInput): Profile {
  const name = input.name.trim() || 'Custom profile';

  return {
    id: normalizeId(input.id) ?? buildCustomProfileId(name),
    name,
    kind: 'custom',
    params: { ...(input.params ?? {}) },
    defaultLocalAxisRotationDeg: input.defaultLocalAxisRotationDeg ?? 0,
    defaultOffsetYmm: input.defaultOffsetYmm ?? 0,
    defaultOffsetZmm: input.defaultOffsetZmm ?? 0,
    massKgPerM: input.massKgPerM,
    section: { ...(input.section ?? {}) },
    color: input.color,
  };
}

export function createProfileFromCatalogDetails(details: CrossSectionDetailsResponse): Profile {
  const dimensions = {
    ...filterFiniteNumbers(details.catalogItem.dimensionsMm),
    ...filterFiniteNumbers(details.geometry),
  };
  const kind = resolveCatalogProfileKind(
    details.catalogItem.profileType,
    details.catalogItem.shapeMethod,
    dimensions,
  );
  const section = buildSectionProperties(details);
  const estimatedMassKgPerM = section.areaMm2 == null
    ? undefined
    : Number((section.areaMm2 * 0.00785).toFixed(6));

  return {
    id: details.catalogItem.id,
    name: details.catalogItem.displayName.trim() || details.catalogItem.designation,
    kind,
    params: buildProfileParams(kind, dimensions),
    defaultLocalAxisRotationDeg: 0,
    defaultOffsetYmm: 0,
    defaultOffsetZmm: 0,
    massKgPerM: getNumericValue(
      [details.dataframeRow, details.calculated],
      ['massKgPerM', 'kgPerM', 'mass', 'm'],
    ) ?? estimatedMassKgPerM,
    section,
    color: CATALOG_PROFILE_COLORS[kind],
  };
}

export function resolveCatalogProfileColor(catalogItem: Pick<
  CrossSectionCatalogItem,
  'profileType' | 'shapeMethod' | 'dimensionsMm'
>): string | undefined {
  const kind = resolveCatalogProfileKind(
    catalogItem.profileType,
    catalogItem.shapeMethod,
    catalogItem.dimensionsMm,
  );

  return CATALOG_PROFILE_COLORS[kind];
}

export function formatCatalogProfileType(profileType: string): string {
  const normalized = profileType.trim();
  if (normalized.length === 0) {
    return '-';
  }

  return normalized
    .replace(/[_-]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
    .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

function cloneProfile(profile: Readonly<Profile>): Profile {
  return {
    ...profile,
    params: { ...profile.params },
    section: { ...profile.section },
  };
}

function normalizeId(id: string | undefined): string | undefined {
  const normalized = id?.trim();
  return normalized != null && normalized.length > 0 ? normalized : undefined;
}

function buildCustomProfileId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  const suffix = Math.random().toString(36).slice(2, 8);

  return `profile-custom-${slug || 'section'}-${suffix}`;
}

function resolveCatalogProfileKind(
  profileType: string,
  shapeMethod: string,
  dimensions: Record<string, number>,
): ProfileKind {
  const normalizedType = profileType.trim().toLowerCase();
  const normalizedShape = shapeMethod.trim().toLowerCase();

  if (normalizedType.includes('angle_equal')) {
    return 'L_equal';
  }

  if (normalizedType.includes('angle_unequal')) {
    return 'L_unequal';
  }

  if (normalizedType.includes('channel') || normalizedShape === 'cshape' || normalizedShape === 'cbendshape') {
    return 'U';
  }

  if (normalizedType.includes('i_beam') || normalizedShape === 'ishape') {
    return 'I';
  }

  if (normalizedType.includes('round_bar') || normalizedType.includes('rod') || normalizedShape === 'circleshape') {
    return 'round_bar';
  }

  if (
    normalizedType.includes('square_pipe')
    || normalizedType.includes('rect_pipe')
    || normalizedType.includes('rectangular_pipe')
    || normalizedType.includes('rectangular_tube')
    || normalizedShape === 'squarepipeshape'
  ) {
    return 'rect_pipe';
  }

  if (
    normalizedType.includes('flat')
    || normalizedType.includes('strip')
    || (normalizedShape === 'rectshape' && getDimension(dimensions, ['t']) == null)
  ) {
    return 'flat_bar';
  }

  if (normalizedType.includes('pipe') || normalizedShape === 'pipeshape') {
    return 'pipe';
  }

  if (normalizedShape === 'lshape') {
    const height = getDimension(dimensions, ['h']);
    const width = getDimension(dimensions, ['b']);
    if (height != null && width != null) {
      return Math.abs(height - width) <= 1e-6 ? 'L_equal' : 'L_unequal';
    }
  }

  return 'custom';
}

function buildProfileParams(kind: ProfileKind, dimensions: Record<string, number>): Record<string, number> {
  const params = filterFiniteNumbers(dimensions);
  const width = getDimension(dimensions, ['b', 'B', 'width']);
  const height = getDimension(dimensions, ['h', 'H', 'height']);
  const thickness = getDimension(dimensions, ['t', 'T', 'thickness']);

  switch (kind) {
    case 'L_equal':
      setNumericParam(params, 'b', width ?? height);
      setNumericParam(params, 'h', height ?? width);
      setNumericParam(params, 't', thickness);
      break;
    case 'L_unequal':
      setNumericParam(params, 'b', width);
      setNumericParam(params, 'h', height);
      setNumericParam(params, 't', thickness);
      break;
    case 'U':
      setNumericParam(params, 'b', width);
      setNumericParam(params, 'h', height);
      setNumericParam(params, 't', thickness);
      setNumericParam(params, 'tw', getDimension(dimensions, ['s', 'tw']));
      break;
    case 'I':
      setNumericParam(params, 'b', width);
      setNumericParam(params, 'h', height);
      setNumericParam(params, 't', thickness);
      setNumericParam(params, 'tf', thickness);
      setNumericParam(params, 'tw', getDimension(dimensions, ['s', 'tw']));
      break;
    case 'pipe': {
      const diameter = getDimension(dimensions, ['D', 'd', 'diameter']);
      setNumericParam(params, 'D', diameter);
      setNumericParam(params, 'd', diameter);
      setNumericParam(params, 'diameter', diameter);
      setNumericParam(params, 't', thickness);
      break;
    }
    case 'rect_pipe':
      setNumericParam(params, 'b', width);
      setNumericParam(params, 'h', height);
      setNumericParam(params, 'width', width);
      setNumericParam(params, 'height', height);
      setNumericParam(params, 't', thickness);
      break;
    case 'round_bar': {
      const diameter = getDimension(dimensions, ['D', 'd', 'diameter', 'h']);
      setNumericParam(params, 'D', diameter);
      setNumericParam(params, 'd', diameter);
      setNumericParam(params, 'diameter', diameter);
      break;
    }
    case 'flat_bar': {
      const flatWidth = width ?? getDimension(dimensions, ['width']);
      const flatThickness = thickness ?? height;
      setNumericParam(params, 'b', flatWidth);
      setNumericParam(params, 'width', flatWidth);
      setNumericParam(params, 't', flatThickness);
      setNumericParam(params, 'thickness', flatThickness);
      setNumericParam(params, 'h', height);
      break;
    }
    case 'custom':
    default:
      break;
  }

  return params;
}

function buildSectionProperties(details: CrossSectionDetailsResponse): SectionProperties {
  return {
    areaMm2: getNumericValue([details.calculated, details.dataframeRow], ['areaMm2', 'A']),
    IyMm4: getNumericValue([details.calculated, details.dataframeRow], ['Iy', 'Jx']),
    IzMm4: getNumericValue([details.calculated, details.dataframeRow], ['Iz', 'Jy']),
    JxMm4: getNumericValue([details.calculated, details.dataframeRow], ['Jp', 'JxMm4', 'Jx']),
    WyMm3: getNumericValue([details.calculated, details.dataframeRow], ['Wy', 'Wx']),
    WzMm3: getNumericValue([details.calculated, details.dataframeRow], ['Wz', 'Wy']),
    WxMm3: getNumericValue([details.calculated, details.dataframeRow], ['Wp', 'Wx']),
  };
}

function getNumericValue(
  sources: Array<Record<string, string | number | boolean | null>>,
  keys: string[],
): number | undefined {
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
    }
  }

  return undefined;
}

function filterFiniteNumbers(input: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(input).filter((entry): entry is [string, number] => Number.isFinite(entry[1])),
  );
}

function getDimension(dimensions: Record<string, number>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = dimensions[key];
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return undefined;
}

function setNumericParam(params: Record<string, number>, key: string, value: number | undefined) {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return;
  }

  params[key] = value;
}
