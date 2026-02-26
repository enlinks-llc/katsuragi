import { describe, expect, test } from 'vitest';
import { getTheme, THEMES } from '../../src/svg/themes.js';

describe('getTheme', () => {
  test('returns default theme when no name given', () => {
    const theme = getTheme();
    expect(theme).toEqual(THEMES.default);
  });

  test('returns default theme for undefined', () => {
    const theme = getTheme(undefined);
    expect(theme).toEqual(THEMES.default);
  });

  test('returns clean theme', () => {
    const theme = getTheme('clean');
    expect(theme.strokeWidth).toBe(1);
    expect(theme.borderRadius).toBe(4);
    expect(theme.fontSize).toBe(20);
    expect(theme.defaultBg).toBe('#f0f0f0');
  });

  test('returns bold theme', () => {
    const theme = getTheme('bold');
    expect(theme.strokeWidth).toBe(3);
    expect(theme.borderRadius).toBe(12);
    expect(theme.fontSize).toBe(28);
    expect(theme.defaultBg).toBe('#d0d0d0');
  });

  test('throws on unknown theme', () => {
    expect(() => getTheme('nonexistent')).toThrow('Unknown theme "nonexistent"');
  });
});
