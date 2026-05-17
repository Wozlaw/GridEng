import { DEFAULT_STEEL, type Material, type Profile, type ProfileKind } from '../model';
import type { CrossSectionDetailsResponse } from '../section';
import type { SteelMaterialResolvedProperties, SteelMaterialThicknessRange } from './apiTypes';

export type MaterialProductType = 'sheet' | 'wide_flat' | 'bent_profile' | 'hot_rolled_shape' | 'bar';

export interface MaterialProfileContext {
  dimensionsMm: Record<string, number>;
  productType: MaterialProductType | null;
  profileMethod: string | null;
  profileType: string | null;
  thicknessMm: number | null;
}

const CATALOG_MATERIAL_ID_PREFIX = 'catalog-material:';

const PROFILE_METHOD_TO_PRODUCT_TYPE: Record<string, MaterialProductType> = {
  CBendShape: 'bent_profile',
  CShape: 'hot_rolled_shape',
  CircleShape: 'bar',
  HexShape: 'bar',
  IShape: 'hot_rolled_shape',
  LBendShape: 'bent_profile',
  LShape: 'hot_rolled_shape',
  PipeShape: 'bent_profile',
  RectShape: 'bar',
  SquarePipeShape: 'bent_profile',
  TShape: 'hot_rolled_shape',
};

export function buildCatalogMaterialId(key: string, propertyId: string): string {
  return `${CATALOG_MATERIAL_ID_PREFIX}${encodeURIComponent(key)}:${encodeURIComponent(propertyId)}`;
}

export function parseCatalogMaterialId(materialId: string): { key: string; propertyId: string } | null {
  if (!materialId.startsWith(CATALOG_MATERIAL_ID_PREFIX)) {
    return null;
  }

  const encodedParts = materialId.slice(CATALOG_MATERIAL_ID_PREFIX.length).split(':');
  if (encodedParts.length !== 2) {
    return null;
  }

  try {
    return {
      key: decodeURIComponent(encodedParts[0]),
      propertyId: decodeURIComponent(encodedParts[1]),
    };
  } catch {
    return null;
  }
}

export function createMaterialFromResolvedProperties(option: SteelMaterialResolvedProperties): Material {
  if (isLocalDefaultMaterialOption(option)) {
    return {
      ...DEFAULT_STEEL,
      comment: DEFAULT_STEEL.comment,
      densityKgPerM3: option.rho,
      elasticModulusMPa: option.E,
      name: option.displayName,
      poissonRatio: resolvePoissonRatio(option.E, option.G),
      shearModulusMPa: option.G,
      yieldStrengthMPa: option.Rt,
    };
  }

  return {
    id: buildCatalogMaterialId(option.key, option.propertyId),
    name: option.displayName,
    comment: buildMaterialComment(option),
    densityKgPerM3: option.rho,
    elasticModulusMPa: option.E,
    poissonRatio: resolvePoissonRatio(option.E, option.G),
    shearModulusMPa: option.G,
    yieldStrengthMPa: option.Rt,
  };
}

export function buildMaterialProfileContext(
  profile: Profile,
  details?: CrossSectionDetailsResponse | null,
): MaterialProfileContext {
  const profileType = details?.catalogItem.profileType ?? null;
  const profileMethod = resolveMaterialProfileMethod(profile, details);
  const dimensionsMm = buildMaterialDimensionsMm(profile, details, profileMethod);

  return {
    dimensionsMm,
    productType: resolveMaterialProductType(profile, details, profileMethod),
    profileMethod,
    profileType,
    thicknessMm: resolveMaterialThicknessMm(profile, details, profileMethod, dimensionsMm),
  };
}

export function resolveMaterialThicknessMm(
  profile: Profile,
  details?: CrossSectionDetailsResponse | null,
  profileMethod = resolveMaterialProfileMethod(profile, details),
  dimensionsMm = buildMaterialDimensionsMm(profile, details, profileMethod),
): number | null {
  if (profileMethod == null) {
    return null;
  }

  switch (profileMethod) {
    // Angles and pipes use their wall thickness directly.
    case 'LShape':
    case 'LBendShape':
    case 'PipeShape':
    case 'SquarePipeShape':
      return getPositiveDimension(dimensionsMm, ['t']);

    // Bent channels expose the web thickness as `s`.
    case 'CBendShape':
      return getPositiveDimension(dimensionsMm, ['s', 'tw', 't']);

    // Rolled channels / I-shapes / tees use the governing rolled thickness.
    case 'CShape':
    case 'IShape':
    case 'TShape':
      return getMaxPositiveDimension(dimensionsMm, ['s', 'tw'], ['t', 'tf']);

    // Solid rectangular bars use the smaller side as the material thickness.
    case 'RectShape':
      return getMinPositiveDimension(dimensionsMm, ['h', 'height'], ['b', 'width', 'h', 'height']);

    // Solid round / hex bars use the overall size as the governing thickness.
    case 'CircleShape':
      return getPositiveDimension(dimensionsMm, ['D', 'd', 'diameter']);
    case 'HexShape':
      return getPositiveDimension(dimensionsMm, ['h']);
    default:
      return null;
  }
}

export function resolveMaterialProductType(
  profile: Profile,
  details?: CrossSectionDetailsResponse | null,
  profileMethod = resolveMaterialProfileMethod(profile, details),
): MaterialProductType | null {
  if (profileMethod == null) {
    return null;
  }

  return PROFILE_METHOD_TO_PRODUCT_TYPE[profileMethod] ?? null;
}

export function matchesMaterialOption(material: Material, option: SteelMaterialResolvedProperties): boolean {
  if (isLocalDefaultMaterialOption(option)) {
    return material.id === DEFAULT_STEEL.id;
  }

  return material.id === buildCatalogMaterialId(option.key, option.propertyId);
}

export function findMatchingMaterialOption(
  material: Material | undefined,
  options: SteelMaterialResolvedProperties[],
): SteelMaterialResolvedProperties | undefined {
  if (material == null) {
    return undefined;
  }

  return options.find((option) => matchesMaterialOption(material, option));
}

export function formatMaterialSourceRefs(option: SteelMaterialResolvedProperties): string[] {
  return option.sourceRefs
    .map((sourceRef) => [sourceRef.standard, sourceRef.table, sourceRef.note].filter(Boolean).join(' · '))
    .filter((value) => value.length > 0);
}

export function formatMaterialThicknessRangeLabel(range: SteelMaterialThicknessRange): string {
  const minLabel = formatThicknessBound(range.min, range.minInclusive, true);
  const maxLabel = formatThicknessBound(range.max, range.maxInclusive, false);

  if (range.min == null && range.max == null) {
    return 't: any';
  }

  if (range.min != null && range.max == null) {
    return minLabel;
  }

  if (range.min == null && range.max != null) {
    return maxLabel;
  }

  if (range.min === range.max && range.minInclusive && range.maxInclusive) {
    return `t = ${range.min} mm`;
  }

  return `${minLabel} .. ${maxLabel}`;
}

function resolveMaterialProfileMethod(profile: Profile, details?: CrossSectionDetailsResponse | null): string | null {
  const shapeMethod = normalizeShapeMethod(details?.catalogItem.shapeMethod);
  if (shapeMethod != null) {
    return refineShapeMethod(shapeMethod, profile, details?.catalogItem.profileType ?? null);
  }

  return resolveProfileMethodFromKind(profile.kind);
}

function refineShapeMethod(profileMethod: string, profile: Profile, profileType: string | null): string | null {
  const normalizedProfileType = profileType?.trim().toLowerCase() ?? '';

  if (profile.kind === 'rect_pipe' && profileMethod === 'RectShape') {
    return 'SquarePipeShape';
  }

  if (profile.kind === 'U' && profileMethod === 'ChannelShape') {
    return normalizedProfileType.includes('bend') ? 'CBendShape' : 'CShape';
  }

  if (profile.kind === 'L_equal' || profile.kind === 'L_unequal') {
    if (profileMethod === 'LShape' && normalizedProfileType.includes('bend')) {
      return 'LBendShape';
    }
  }

  if (profileMethod in PROFILE_METHOD_TO_PRODUCT_TYPE) {
    return profileMethod;
  }

  return resolveProfileMethodFromKind(profile.kind);
}

function resolveProfileMethodFromKind(kind: ProfileKind): string | null {
  switch (kind) {
    case 'L_equal':
    case 'L_unequal':
      return 'LShape';
    case 'U':
      return 'CShape';
    case 'I':
      return 'IShape';
    case 'pipe':
      return 'PipeShape';
    case 'rect_pipe':
      return 'SquarePipeShape';
    case 'round_bar':
      return 'CircleShape';
    case 'flat_bar':
      return 'RectShape';
    case 'custom':
    default:
      return null;
  }
}

function normalizeShapeMethod(shapeMethod: string | undefined): string | null {
  if (shapeMethod == null) {
    return null;
  }

  const normalized = shapeMethod.trim();
  if (normalized.length === 0) {
    return null;
  }

  switch (normalized.toLowerCase()) {
    case 'cbendshape':
      return 'CBendShape';
    case 'channelshape':
      return 'ChannelShape';
    case 'circleshape':
      return 'CircleShape';
    case 'cshape':
      return 'CShape';
    case 'hexshape':
      return 'HexShape';
    case 'ishape':
      return 'IShape';
    case 'lbendshape':
      return 'LBendShape';
    case 'lshape':
      return 'LShape';
    case 'pipeshape':
      return 'PipeShape';
    case 'rectshape':
      return 'RectShape';
    case 'squarepipeshape':
      return 'SquarePipeShape';
    case 'tshape':
      return 'TShape';
    default:
      return normalized;
  }
}

function buildMaterialDimensionsMm(
  profile: Profile,
  details: CrossSectionDetailsResponse | null | undefined,
  profileMethod: string | null,
): Record<string, number> {
  const sourceDimensions = filterFiniteNumbers({
    ...profile.params,
    ...(details?.catalogItem.dimensionsMm ?? {}),
    ...(details?.geometry ?? {}),
  });

  if (profileMethod == null) {
    return sourceDimensions;
  }

  const dimensionsMm = { ...sourceDimensions };

  switch (profileMethod) {
    case 'LShape':
    case 'LBendShape':
      assignDimension(dimensionsMm, 'h', sourceDimensions, ['h', 'height', 'b', 'width']);
      assignDimension(dimensionsMm, 'b', sourceDimensions, ['b', 'width', 'h', 'height']);
      assignDimension(dimensionsMm, 't', sourceDimensions, ['t', 'thickness']);
      break;
    case 'CShape':
    case 'CBendShape':
    case 'IShape':
    case 'TShape':
      assignDimension(dimensionsMm, 'h', sourceDimensions, ['h', 'height']);
      assignDimension(dimensionsMm, 'b', sourceDimensions, ['b', 'width']);
      assignDimension(dimensionsMm, 's', sourceDimensions, ['s', 'tw', 't']);
      assignDimension(dimensionsMm, 't', sourceDimensions, ['t', 'tf', 'thickness']);
      break;
    case 'PipeShape':
      assignDimension(dimensionsMm, 'D', sourceDimensions, ['D', 'd', 'diameter', 'h']);
      assignDimension(dimensionsMm, 't', sourceDimensions, ['t', 'thickness']);
      break;
    case 'SquarePipeShape':
      assignDimension(dimensionsMm, 'h', sourceDimensions, ['h', 'height']);
      assignDimension(dimensionsMm, 'b', sourceDimensions, ['b', 'width']);
      assignDimension(dimensionsMm, 't', sourceDimensions, ['t', 'thickness']);
      break;
    case 'RectShape':
      assignDimension(dimensionsMm, 'h', sourceDimensions, ['h', 'height', 't', 'thickness']);
      assignDimension(dimensionsMm, 'b', sourceDimensions, ['b', 'width', 'h', 'height']);
      break;
    case 'CircleShape':
      assignDimension(dimensionsMm, 'D', sourceDimensions, ['D', 'd', 'diameter', 'h']);
      break;
    case 'HexShape':
      assignDimension(dimensionsMm, 'h', sourceDimensions, ['h', 'height']);
      break;
    default:
      break;
  }

  return filterFiniteNumbers(dimensionsMm);
}

function buildMaterialComment(option: SteelMaterialResolvedProperties): string | undefined {
  const sourceLabel = formatMaterialSourceRefs(option)[0] ?? null;
  const detailParts = [
    option.propertyId,
    sourceLabel,
    option.productTypes.join(', '),
    formatMaterialThicknessRangeLabel(option.thickness),
  ].filter((value): value is string => value != null && value.trim().length > 0);

  return detailParts.length > 0 ? detailParts.join(' · ') : undefined;
}

function resolvePoissonRatio(elasticModulus: number, shearModulus: number): number | undefined {
  if (!Number.isFinite(elasticModulus) || !Number.isFinite(shearModulus) || shearModulus <= 0) {
    return undefined;
  }

  return Number((elasticModulus / (2 * shearModulus) - 1).toFixed(6));
}

function isLocalDefaultMaterialOption(option: SteelMaterialResolvedProperties): boolean {
  return option.displayName === DEFAULT_STEEL.name && option.propertyId === 'local-default' && option.key === 'C245';
}

function filterFiniteNumbers(input: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(input).filter((entry): entry is [string, number] => Number.isFinite(entry[1])),
  );
}

function assignDimension(
  target: Record<string, number>,
  key: string,
  source: Record<string, number>,
  aliases: string[],
) {
  const value = getPositiveDimension(source, aliases);
  if (value != null) {
    target[key] = value;
  }
}

function getPositiveDimension(source: Record<string, number>, aliases: string[]): number | null {
  for (const alias of aliases) {
    const value = source[alias];
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return null;
}

function getMaxPositiveDimension(
  source: Record<string, number>,
  firstAliases: string[],
  secondAliases: string[],
): number | null {
  const first = getPositiveDimension(source, firstAliases);
  const second = getPositiveDimension(source, secondAliases);

  if (first == null) {
    return second;
  }

  if (second == null) {
    return first;
  }

  return Math.max(first, second);
}

function getMinPositiveDimension(
  source: Record<string, number>,
  firstAliases: string[],
  secondAliases: string[],
): number | null {
  const first = getPositiveDimension(source, firstAliases);
  const second = getPositiveDimension(source, secondAliases);

  if (first == null) {
    return second;
  }

  if (second == null) {
    return first;
  }

  return Math.min(first, second);
}

function formatThicknessBound(value: number | null, inclusive: boolean, isMin: boolean): string {
  if (value == null) {
    return isMin ? 't > 0 mm' : 't: any';
  }

  if (isMin) {
    return inclusive ? `t >= ${value} mm` : `t > ${value} mm`;
  }

  return inclusive ? `t <= ${value} mm` : `t < ${value} mm`;
}
