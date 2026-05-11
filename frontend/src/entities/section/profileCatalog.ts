import type { Id, Profile, SectionProperties } from '../model';

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
