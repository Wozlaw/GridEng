import { describe, expect, it } from 'vitest';

import { formatPressurePaInput, hasNonZeroWindZ, parseWindDraft } from './helpers';

describe('wind-editor helpers', () => {
  it('formats model pressure in Pa to input text', () => {
    expect(formatPressurePaInput(0)).toBe('0');
    expect(formatPressurePaInput(850)).toBe('850');
    expect(formatPressurePaInput(123.4)).toBe('123.4');
  });

  it('parses dialog draft into model wind patch with z forced to zero', () => {
    const result = parseWindDraft({
      x: '12',
      y: '-4',
      nominalPressurePa: '850',
      comment: '  wind  ',
    });

    expect(result).toEqual({
      ok: true,
      value: {
        direction: { x: 12, y: -4, z: 0 },
        nominalPressurePa: 850,
        comment: 'wind',
      },
    });
  });

  it('rejects negative pressure and detects non-zero z in existing model', () => {
    expect(parseWindDraft({
      x: '1',
      y: '0',
      nominalPressurePa: '-10',
      comment: '',
    })).toEqual({
      ok: false,
      error: 'negative_pressure',
    });

    expect(hasNonZeroWindZ(0)).toBe(false);
    expect(hasNonZeroWindZ(0.001)).toBe(true);
  });
});
