import { describe, expect, it } from 'vitest';
import { calculateGrid, parseGridString } from '../../src/fetcher/grid.js';
import type { DomElement, ViewportConfig } from '../../src/fetcher/types.js';

const viewport: ViewportConfig = {
  width: 1280,
  height: 720,
  userAgent: 'Test',
  defaultRatio: [16, 9],
};

function createElement(
  x: number,
  y: number,
  width: number,
  height: number,
  tagName = 'div',
): DomElement {
  return {
    tagName,
    bounds: { x, y, width, height },
    hasText: false,
    attributes: {},
  };
}

describe('calculateGrid', () => {
  it('returns default grid for empty elements', () => {
    const result = calculateGrid([], viewport);

    expect(result.cols).toBe(4);
    expect(result.rows).toBe(3);
    expect(result.placements).toHaveLength(0);
  });

  it('places single full-width element', () => {
    const elements = [createElement(0, 0, 1280, 100, 'header')];
    const result = calculateGrid(elements, viewport);

    expect(result.placements).toHaveLength(1);
    expect(result.placements[0].col).toBe(0);
    expect(result.placements[0].row).toBe(0);
    expect(result.placements[0].colSpan).toBeGreaterThanOrEqual(1);
  });

  it('places multiple elements vertically', () => {
    const elements = [
      createElement(0, 0, 1280, 80, 'header'),
      createElement(0, 90, 1280, 400, 'main'),
      createElement(0, 500, 1280, 60, 'footer'),
    ];

    const result = calculateGrid(elements, viewport);

    expect(result.placements).toHaveLength(3);
    // Elements should be in different rows
    const rows = result.placements.map((p) => p.row);
    expect(new Set(rows).size).toBeGreaterThanOrEqual(2);
  });

  it('respects grid override options', () => {
    const elements = [createElement(0, 0, 1280, 100)];
    const result = calculateGrid(elements, viewport, { cols: 6, rows: 4 });

    expect(result.cols).toBe(6);
    expect(result.rows).toBe(4);
  });

  it('handles elements at different positions', () => {
    const elements = [
      createElement(0, 0, 640, 100), // Left half
      createElement(640, 0, 640, 100), // Right half
    ];

    const result = calculateGrid(elements, viewport);

    expect(result.placements).toHaveLength(2);
    // Should be in different columns
    expect(result.placements[0].col).not.toBe(result.placements[1].col);
  });

  it('resolves overlapping placements', () => {
    const elements = [
      createElement(0, 0, 1280, 200),
      createElement(0, 50, 1280, 200), // Overlapping
    ];

    const result = calculateGrid(elements, viewport);

    expect(result.placements).toHaveLength(2);

    // Check that placements don't overlap
    const p1 = result.placements[0];
    const p2 = result.placements[1];

    const p1EndCol = p1.col + p1.colSpan;
    const p1EndRow = p1.row + p1.rowSpan;
    const p2EndCol = p2.col + p2.colSpan;
    const p2EndRow = p2.row + p2.rowSpan;

    const hasOverlap = !(
      p1EndCol <= p2.col ||
      p2EndCol <= p1.col ||
      p1EndRow <= p2.row ||
      p2EndRow <= p1.row
    );

    expect(hasOverlap).toBe(false);
  });

  it('clamps grid size to maximum', () => {
    // Create many elements to force large grid
    const elements: DomElement[] = [];
    for (let i = 0; i < 50; i++) {
      elements.push(createElement(i * 30, i * 30, 50, 50));
    }

    const result = calculateGrid(elements, viewport);

    expect(result.cols).toBeLessThanOrEqual(26);
    expect(result.rows).toBeLessThanOrEqual(26);
  });

  it('skips excess elements when grid is full', () => {
    // Create more elements than can fit in a 2x2 grid
    const elements = [
      createElement(0, 0, 100, 100),
      createElement(100, 0, 100, 100),
      createElement(0, 100, 100, 100),
      createElement(100, 100, 100, 100),
      createElement(200, 0, 100, 100), // 5th element - should be skipped
      createElement(200, 100, 100, 100), // 6th element - should be skipped
    ];

    const result = calculateGrid(elements, viewport, { cols: 2, rows: 2 });

    // Should only place 4 elements in a 2x2 grid
    expect(result.placements.length).toBeLessThanOrEqual(4);
  });

  it('ensures no duplicate cell positions when many elements', () => {
    // Create many elements at same position
    const elements: DomElement[] = [];
    for (let i = 0; i < 20; i++) {
      elements.push(createElement(0, 0, 100, 100));
    }

    const result = calculateGrid(elements, viewport, { cols: 4, rows: 4 });

    // Check no duplicates
    const positions = new Set<string>();
    for (const p of result.placements) {
      const key = `${p.col},${p.row}`;
      expect(positions.has(key)).toBe(false);
      positions.add(key);
    }
  });
});

describe('parseGridString', () => {
  it('parses valid grid string', () => {
    expect(parseGridString('4x3')).toEqual({ cols: 4, rows: 3 });
    expect(parseGridString('12x8')).toEqual({ cols: 12, rows: 8 });
    expect(parseGridString('1x1')).toEqual({ cols: 1, rows: 1 });
  });

  it('handles case insensitivity', () => {
    expect(parseGridString('4X3')).toEqual({ cols: 4, rows: 3 });
  });

  it('returns null for invalid format', () => {
    expect(parseGridString('invalid')).toBeNull();
    expect(parseGridString('4x')).toBeNull();
    expect(parseGridString('x3')).toBeNull();
    expect(parseGridString('4:3')).toBeNull();
    expect(parseGridString('4 x 3')).toBeNull();
  });

  it('returns null for out of range values', () => {
    expect(parseGridString('0x3')).toBeNull();
    expect(parseGridString('4x0')).toBeNull();
    expect(parseGridString('27x3')).toBeNull(); // > 26
    expect(parseGridString('4x27')).toBeNull();
  });
});
