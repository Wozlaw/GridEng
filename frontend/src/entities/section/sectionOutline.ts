import type { Profile } from '../model';

export type Vec2 = { x: number; y: number };

export function getSectionOutline(profile: Profile): Vec2[] {
  switch (profile.kind) {
    case 'rect_pipe':
      return createCenteredRectangle(
        getParam(profile, ['b', 'width'], 80),
        getParam(profile, ['h', 'height'], 60),
      );
    case 'pipe':
      return createCircleOutline(getParam(profile, ['d', 'diameter'], 76) / 2, 24);
    case 'round_bar':
      return createCircleOutline(getParam(profile, ['d', 'diameter'], 40) / 2, 24);
    case 'flat_bar':
      return createCenteredRectangle(
        getParam(profile, ['b', 'width'], 60),
        getParam(profile, ['t', 'thickness'], 8),
      );
    case 'L_equal':
      return createCenteredOutline([
        { x: 0, y: 0 },
        { x: getParam(profile, ['b'], 90), y: 0 },
        { x: getParam(profile, ['b'], 90), y: getParam(profile, ['t'], 6) },
        { x: getParam(profile, ['t'], 6), y: getParam(profile, ['t'], 6) },
        { x: getParam(profile, ['t'], 6), y: getParam(profile, ['b'], 90) },
        { x: 0, y: getParam(profile, ['b'], 90) },
      ]);
    case 'L_unequal': {
      const width = getParam(profile, ['b'], 80);
      const height = getParam(profile, ['h'], 125);
      const thickness = getParam(profile, ['t'], 8);

      return createCenteredOutline([
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: thickness },
        { x: thickness, y: thickness },
        { x: thickness, y: height },
        { x: 0, y: height },
      ]);
    }
    case 'U': {
      const width = getParam(profile, ['b'], 80);
      const height = getParam(profile, ['h'], 140);
      const thickness = getParam(profile, ['t'], 8);

      return createCenteredOutline([
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: width - thickness, y: height },
        { x: width - thickness, y: thickness },
        { x: thickness, y: thickness },
        { x: thickness, y: height },
        { x: 0, y: height },
      ]);
    }
    case 'I': {
      const flangeWidth = getParam(profile, ['b'], 120);
      const height = getParam(profile, ['h'], 160);
      const flangeThickness = getParam(profile, ['t', 'tf'], 10);
      const webThickness = getParam(profile, ['tw'], flangeThickness);
      const halfWebOffset = (flangeWidth - webThickness) / 2;

      return createCenteredOutline([
        { x: 0, y: 0 },
        { x: flangeWidth, y: 0 },
        { x: flangeWidth, y: flangeThickness },
        { x: halfWebOffset + webThickness, y: flangeThickness },
        { x: halfWebOffset + webThickness, y: height - flangeThickness },
        { x: flangeWidth, y: height - flangeThickness },
        { x: flangeWidth, y: height },
        { x: 0, y: height },
        { x: 0, y: height - flangeThickness },
        { x: halfWebOffset, y: height - flangeThickness },
        { x: halfWebOffset, y: flangeThickness },
        { x: 0, y: flangeThickness },
      ]);
    }
    case 'custom':
    default:
      return createCustomFallbackOutline(profile);
  }
}

function createCustomFallbackOutline(profile: Profile): Vec2[] {
  const areaMm2 = profile.section.areaMm2 ?? 6400;
  const side = Math.max(Math.sqrt(Math.max(areaMm2, 400)), 20);

  return createCenteredRectangle(side, side);
}

function createCenteredRectangle(width: number, height: number): Vec2[] {
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  return [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight },
  ];
}

function createCircleOutline(radius: number, segments: number): Vec2[] {
  const safeRadius = Math.max(radius, 5);
  const safeSegments = Math.max(segments, 12);

  return Array.from({ length: safeSegments }, (_unused, index) => {
    const angle = (index / safeSegments) * Math.PI * 2;

    return {
      x: Math.cos(angle) * safeRadius,
      y: Math.sin(angle) * safeRadius,
    };
  });
}

function createCenteredOutline(points: Vec2[]): Vec2[] {
  const bounds = getOutlineBounds(points);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  return points.map((point) => ({
    x: point.x - centerX,
    y: point.y - centerY,
  }));
}

function getOutlineBounds(points: Vec2[]) {
  return points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      maxX: Math.max(bounds.maxX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxY: Math.max(bounds.maxY, point.y),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  );
}

function getParam(profile: Profile, keys: string[], fallback: number): number {
  for (const key of keys) {
    const value = profile.params[key];

    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return fallback;
}
