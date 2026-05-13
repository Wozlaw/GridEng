export interface WindDraftValues {
  x: string;
  y: string;
  nominalPressurePa: string;
  comment: string;
}

export type WindDraftValidationError =
  | 'invalid_direction'
  | 'invalid_pressure'
  | 'negative_pressure';

export interface ParsedWindDraft {
  direction: {
    x: number;
    y: number;
    z: 0;
  };
  nominalPressurePa: number;
  comment?: string;
}

export function formatPressurePaInput(nominalPressurePa: number): string {
  if (!Number.isFinite(nominalPressurePa)) {
    return '0';
  }

  const roundedInteger = Math.round(nominalPressurePa);
  if (Math.abs(nominalPressurePa - roundedInteger) <= 1e-9) {
    return String(roundedInteger);
  }

  return nominalPressurePa.toFixed(3).replace(/\.?0+$/, '');
}

export function parseWindDraft(
  draft: Readonly<WindDraftValues>,
): { ok: true; value: ParsedWindDraft } | { ok: false; error: WindDraftValidationError } {
  const x = Number(draft.x);
  const y = Number(draft.y);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return {
      ok: false,
      error: 'invalid_direction',
    };
  }

  const nominalPressurePa = Number(draft.nominalPressurePa);
  if (!Number.isFinite(nominalPressurePa)) {
    return {
      ok: false,
      error: 'invalid_pressure',
    };
  }

  if (nominalPressurePa < 0) {
    return {
      ok: false,
      error: 'negative_pressure',
    };
  }

  return {
    ok: true,
    value: {
      direction: {
        x,
        y,
        z: 0,
      },
      nominalPressurePa,
      comment: normalizeOptionalText(draft.comment),
    },
  };
}

export function hasNonZeroWindZ(z: number): boolean {
  return Number.isFinite(z) && Math.abs(z) > 1e-9;
}

export function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized == null || normalized.length === 0 ? undefined : normalized;
}
