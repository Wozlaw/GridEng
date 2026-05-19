import AutoCadColorIndex from 'dxf-parser/dist/AutoCadColorIndex';

import type { DxfColorValue } from '../../entities/model';
import type { DxfColorGroup } from './types';

const FALLBACK_DXF_COLOR = '#9aa1a9';

interface DxfColorLike {
  color?: DxfColorValue;
  colorIndex?: number;
  trueColor?: DxfColorValue;
}

export function resolveDxfDisplayColor(source: DxfColorLike): string | undefined {
  const trueColor = toDisplayColor(source.trueColor);
  if (trueColor != null) {
    return trueColor;
  }

  const indexedColor = toAutoCadIndexColor(source.colorIndex);
  if (indexedColor != null) {
    return indexedColor;
  }

  return toDisplayColor(source.color);
}

export function resolveDxfGroupDisplayColor(group: DxfColorGroup): string {
  return resolveDxfDisplayColor(group) ?? FALLBACK_DXF_COLOR;
}

export function normalizeColorInputValue(color: string): string {
  return /^#[0-9a-f]{6}$/i.test(color) ? color : FALLBACK_DXF_COLOR;
}

function toAutoCadIndexColor(colorIndex: number | undefined): string | undefined {
  if (typeof colorIndex !== 'number' || !Number.isFinite(colorIndex)) {
    return undefined;
  }

  const normalizedColorIndex = Math.abs(Math.trunc(colorIndex));
  const indexedColor = AutoCadColorIndex[normalizedColorIndex];
  return typeof indexedColor === 'number' ? toDisplayColor(indexedColor) : undefined;
}

function toDisplayColor(value: DxfColorValue | undefined): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return `#${Math.max(0, Math.trunc(value)).toString(16).padStart(6, '0').slice(-6)}`;
}
