import {
  DEFAULT_WIND_CALCULATION_MODE,
  DEFAULT_WIND_GAMMA_F_BY_MODE,
  DEFAULT_WIND_TERRAIN_TYPE,
} from '../../entities/model';
import type { WindCalculationMode, WindTerrainType } from '../../entities/model';

export interface WindDraftValues {
  x: string;
  y: string;
  nominalPressurePa: string;
  terrainType: WindTerrainType;
  gammaF: string;
  calculationMode: WindCalculationMode;
  comment: string;
}

export type WindDraftValidationError =
  | 'invalid_direction'
  | 'invalid_pressure'
  | 'negative_pressure'
  | 'invalid_gamma_f'
  | 'nonpositive_gamma_f'
  | 'invalid_terrain_type'
  | 'invalid_calculation_mode';

export interface ParsedWindDraft {
  direction: {
    x: number;
    y: number;
    z: 0;
  };
  nominalPressurePa: number;
  terrainType: WindTerrainType;
  gammaF: number;
  calculationMode: WindCalculationMode;
  comment?: string;
}

export function formatGammaFInput(gammaF: number): string {
  return formatFiniteNumberInput(gammaF);
}

export function formatPressurePaInput(nominalPressurePa: number): string {
  return formatFiniteNumberInput(nominalPressurePa);
}

export function getDefaultGammaFForMode(mode: WindCalculationMode): number {
  return DEFAULT_WIND_GAMMA_F_BY_MODE[mode];
}

export function getInitialSimpleGammaF(
  gammaF: number | undefined,
  calculationMode: WindCalculationMode | undefined,
): number {
  if (calculationMode === 'simple' && typeof gammaF === 'number' && Number.isFinite(gammaF) && gammaF > 0) {
    return gammaF;
  }

  return DEFAULT_WIND_GAMMA_F_BY_MODE.simple;
}

export function getInitialTerrainType(terrainType: WindTerrainType | undefined): WindTerrainType {
  return isWindTerrainType(terrainType) ? terrainType : DEFAULT_WIND_TERRAIN_TYPE;
}

export function getInitialCalculationMode(
  calculationMode: WindCalculationMode | undefined,
): WindCalculationMode {
  return isWindCalculationMode(calculationMode) ? calculationMode : DEFAULT_WIND_CALCULATION_MODE;
}

function formatFiniteNumberInput(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  const roundedInteger = Math.round(value);
  if (Math.abs(value - roundedInteger) <= 1e-9) {
    return String(roundedInteger);
  }

  return value.toFixed(3).replace(/\.?0+$/, '');
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

  const gammaF = Number(draft.gammaF);
  if (!Number.isFinite(gammaF)) {
    return {
      ok: false,
      error: 'invalid_gamma_f',
    };
  }

  if (gammaF <= 0) {
    return {
      ok: false,
      error: 'nonpositive_gamma_f',
    };
  }

  if (!isWindTerrainType(draft.terrainType)) {
    return {
      ok: false,
      error: 'invalid_terrain_type',
    };
  }

  if (!isWindCalculationMode(draft.calculationMode)) {
    return {
      ok: false,
      error: 'invalid_calculation_mode',
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
      terrainType: draft.terrainType,
      gammaF,
      calculationMode: draft.calculationMode,
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

function isWindTerrainType(value: unknown): value is WindTerrainType {
  return value === 'A' || value === 'B' || value === 'C';
}

function isWindCalculationMode(value: unknown): value is WindCalculationMode {
  return value === 'simple' || value === 'sp20' || value === 'pue';
}
