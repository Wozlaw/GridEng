import type { Vec3 } from '../../entities/model';

export function formatNumber(value: number | null | undefined, maximumFractionDigits = 2): string {
  if (value == null || Number.isNaN(value)) {
    return '-';
  }

  return value.toLocaleString('en-US', {
    maximumFractionDigits,
  });
}

export function formatVector(vector: Vec3 | null | undefined, maximumFractionDigits = 1): string {
  if (!vector) {
    return '-';
  }

  return `X ${formatNumber(vector.x, maximumFractionDigits)} / Y ${formatNumber(vector.y, maximumFractionDigits)} / Z ${formatNumber(vector.z, maximumFractionDigits)}`;
}

export function formatOptionalText(value: string | number | null | undefined): string {
  if (value == null) {
    return '-';
  }

  const normalizedValue = String(value).trim();

  if (normalizedValue.length === 0) {
    return '-';
  }

  return normalizedValue;
}

export function formatRestraintState(value: boolean): string {
  return value ? 'Fixed' : 'Free';
}
