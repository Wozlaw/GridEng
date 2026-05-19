import { describe, expect, it } from 'vitest';

import {
  formatGammaFInput,
  formatPressurePaInput,
  getDefaultGammaFForMode,
  hasNonZeroWindZ,
  parseWindDraft,
} from './helpers';

describe('wind-editor helpers', () => {
  it('formats model pressure in Pa to input text', () => {
    expect(formatPressurePaInput(0)).toBe('0');
    expect(formatPressurePaInput(850)).toBe('850');
    expect(formatPressurePaInput(123.4)).toBe('123.4');
    expect(formatGammaFInput(1.4)).toBe('1.4');
    expect(getDefaultGammaFForMode('sp20')).toBe(1.4);
    expect(getDefaultGammaFForMode('pue')).toBe(1.2);
  });

  it('parses dialog draft into model wind patch with z forced to zero', () => {
    const result = parseWindDraft({
      x: '12',
      y: '-4',
      nominalPressurePa: '850',
      terrainType: 'C',
      gammaF: '1.4',
      calculationMode: 'sp20',
      comment: '  wind  ',
    });

    expect(result).toEqual({
      ok: true,
      value: {
        direction: { x: 12, y: -4, z: 0 },
        nominalPressurePa: 850,
        terrainType: 'C',
        gammaF: 1.4,
        calculationMode: 'sp20',
        comment: 'wind',
      },
    });
  });

  it('rejects negative pressure, invalid gamma and detects non-zero z in existing model', () => {
    expect(parseWindDraft({
      x: '1',
      y: '0',
      nominalPressurePa: '-10',
      terrainType: 'B',
      gammaF: '1',
      calculationMode: 'simple',
      comment: '',
    })).toEqual({
      ok: false,
      error: 'negative_pressure',
    });

    expect(parseWindDraft({
      x: '1',
      y: '0',
      nominalPressurePa: '10',
      terrainType: 'B',
      gammaF: '0',
      calculationMode: 'simple',
      comment: '',
    })).toEqual({
      ok: false,
      error: 'nonpositive_gamma_f',
    });

    expect(hasNonZeroWindZ(0)).toBe(false);
    expect(hasNonZeroWindZ(0.001)).toBe(true);
  });
});
