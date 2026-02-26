import { describe, expect, test } from 'vitest';
import { fitTextToRect, wrapText } from '../../src/svg/components.js';

describe('wrapText', () => {
  test('short text that fits returns single line', () => {
    const lines = wrapText('Hello', 200, 24);
    expect(lines).toEqual(['Hello']);
  });

  test('\\n acts as hard break', () => {
    const lines = wrapText('Line 1\nLine 2', 500, 24);
    expect(lines).toEqual(['Line 1', 'Line 2']);
  });

  test('empty string from hard break preserved', () => {
    const lines = wrapText('A\n\nB', 500, 24);
    expect(lines).toEqual(['A', '', 'B']);
  });

  test('long English text wraps at word boundaries', () => {
    // 24px * 0.55 = 13.2px per ASCII char; "Hello World" = ~75px; maxWidth=80 can fit "Hello " but not "Hello World"
    const lines = wrapText('Hello World', 80, 24);
    expect(lines.length).toBeGreaterThan(1);
    // Words should not be broken mid-word
    expect(lines.join(' ').trim()).toContain('Hello');
    expect(lines.join(' ').trim()).toContain('World');
  });

  test('Japanese text wraps character by character', () => {
    // 24px * 1.0 = 24px per CJK char; maxWidth=60 fits 2 chars
    const lines = wrapText('日本語テスト', 60, 24);
    expect(lines.length).toBeGreaterThan(1);
    // Each line should be at most 2 CJK chars wide
    for (const line of lines) {
      expect([...line].length).toBeLessThanOrEqual(2);
    }
  });

  test('mixed English and Japanese text', () => {
    const lines = wrapText('Hello世界', 100, 24);
    // 'Hello' = 5 * 13.2 = 66px, '世' = 24px → total 90px fits
    // '界' = 24px → 90+24 = 114px > 100 → wraps
    expect(lines.length).toBeGreaterThanOrEqual(1);
    const joined = lines.join('');
    expect(joined).toContain('Hello');
    expect(joined).toContain('世');
    expect(joined).toContain('界');
  });

  test('single token exceeding maxWidth is force-added', () => {
    // A single long word that exceeds maxWidth should still appear
    const lines = wrapText('Superlongword', 10, 24);
    expect(lines).toEqual(['Superlongword']);
  });

  test('respects existing newlines with wrapping', () => {
    // Hard break + long line that needs soft wrap
    const lines = wrapText('Short\nThis is a longer line that should wrap', 100, 24);
    expect(lines[0]).toBe('Short');
    expect(lines.length).toBeGreaterThan(2);
  });
});

describe('fitTextToRect', () => {
  test('short text uses theme fontSize unchanged', () => {
    const { lines, fontSize } = fitTextToRect('Hi', 320, 240, 16, 24);
    expect(fontSize).toBe(24);
    expect(lines).toEqual(['Hi']);
  });

  test('text that fits after wrapping uses theme fontSize', () => {
    // 320px wide, 240px tall, padding 16 → 288px x 208px available
    // "Hello World" wraps to 2 lines, each short — should fit at fontSize=24
    const { fontSize } = fitTextToRect('Hello World', 320, 240, 16, 24);
    expect(fontSize).toBe(24);
  });

  test('reduces fontSize when text does not fit', () => {
    // Tiny cell (80x40), padding 8, text has many lines after wrapping
    const longText = 'word '.repeat(20).trim();
    const { fontSize } = fitTextToRect(longText, 80, 40, 8, 24);
    expect(fontSize).toBeLessThan(24);
  });

  test('never goes below MIN_FONT_SIZE (8)', () => {
    // Extremely long text in tiny cell
    const veryLongText = 'word '.repeat(100).trim();
    const { fontSize } = fitTextToRect(veryLongText, 50, 30, 4, 24);
    expect(fontSize).toBeGreaterThanOrEqual(8);
  });

  test('padding reduces available area', () => {
    // Same text, larger padding → may need smaller font
    const text = 'Hello World testing wrap behavior here';
    const { fontSize: fs1 } = fitTextToRect(text, 200, 100, 4, 24);
    const { fontSize: fs2 } = fitTextToRect(text, 200, 100, 40, 24);
    // Larger padding = less room = same or smaller fontSize
    expect(fs2).toBeLessThanOrEqual(fs1);
  });
});
