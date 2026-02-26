import { describe, expect, test } from 'vitest';
import {
  calculateCanvasSize,
  calculateCellRect,
  calculateSizes,
} from '../../src/layout/calculator.js';
import type { CellRange, LayoutConfig, Metadata } from '../../src/types.js';

describe('calculateCanvasSize', () => {
  test('calculates 16:9 landscape (wider)', () => {
    const size = calculateCanvasSize([16, 9]);
    expect(size).toEqual({ width: 1280, height: 720 });
  });

  test('calculates 4:3 landscape', () => {
    const size = calculateCanvasSize([4, 3]);
    expect(size).toEqual({ width: 1280, height: 960 });
  });

  test('calculates 1:1 square', () => {
    const size = calculateCanvasSize([1, 1]);
    expect(size).toEqual({ width: 1280, height: 1280 });
  });

  test('calculates 9:16 portrait (taller)', () => {
    const size = calculateCanvasSize([9, 16]);
    expect(size).toEqual({ width: 720, height: 1280 });
  });

  test('calculates 3:4 portrait', () => {
    const size = calculateCanvasSize([3, 4]);
    expect(size).toEqual({ width: 960, height: 1280 });
  });
});

describe('calculateCellRect', () => {
  const metadata: Metadata = {
    ratio: [16, 9],
    grid: [4, 3],
  };
  const canvas = { width: 1280, height: 720 };

  test('calculates single cell A1 (top-left)', () => {
    const range: CellRange = {
      start: { col: 0, row: 0 },
      end: { col: 0, row: 0 },
    };
    const rect = calculateCellRect(range, metadata.grid, canvas);
    expect(rect).toEqual({
      x: 0,
      y: 0,
      width: 320,
      height: 240,
      padding: 16,
    });
  });

  test('calculates single cell D3 (bottom-right)', () => {
    const range: CellRange = {
      start: { col: 3, row: 2 },
      end: { col: 3, row: 2 },
    };
    const rect = calculateCellRect(range, metadata.grid, canvas);
    expect(rect).toEqual({
      x: 960,
      y: 480,
      width: 320,
      height: 240,
      padding: 16,
    });
  });

  test('calculates merged range A1..B2', () => {
    const range: CellRange = {
      start: { col: 0, row: 0 },
      end: { col: 1, row: 1 },
    };
    const rect = calculateCellRect(range, metadata.grid, canvas);
    expect(rect).toEqual({
      x: 0,
      y: 0,
      width: 640,
      height: 480,
      padding: 16,
    });
  });

  test('calculates full width range A1..D1', () => {
    const range: CellRange = {
      start: { col: 0, row: 0 },
      end: { col: 3, row: 0 },
    };
    const rect = calculateCellRect(range, metadata.grid, canvas);
    expect(rect).toEqual({
      x: 0,
      y: 0,
      width: 1280,
      height: 240,
      padding: 16,
    });
  });

  test('calculates center cell B2', () => {
    const range: CellRange = {
      start: { col: 1, row: 1 },
      end: { col: 1, row: 1 },
    };
    const rect = calculateCellRect(range, metadata.grid, canvas);
    expect(rect).toEqual({
      x: 320,
      y: 240,
      width: 320,
      height: 240,
      padding: 16,
    });
  });
});

describe('calculateCellRect with gap', () => {
  const canvas = { width: 1280, height: 720 };
  const config: LayoutConfig = { gap: 10, padding: 20 };

  test('applies gap between cells', () => {
    const range: CellRange = {
      start: { col: 1, row: 0 },
      end: { col: 1, row: 0 },
    };
    // With gap=10, 4 cols: totalGapX = 10*3 = 30
    // cellWidth = (1280 - 30) / 4 = 312.5
    // x for col 1 = 1 * (312.5 + 10) = 322.5
    const rect = calculateCellRect(range, [4, 3], canvas, config);
    expect(rect.x).toBeCloseTo(322.5);
    expect(rect.padding).toBe(20);
  });

  test('merged cells include gaps in width', () => {
    const range: CellRange = {
      start: { col: 0, row: 0 },
      end: { col: 1, row: 0 },
    };
    // 2 columns merged: width = 2*cellWidth + 1*gap = 2*312.5 + 10 = 635
    const rect = calculateCellRect(range, [4, 3], canvas, config);
    expect(rect.width).toBeCloseTo(635);
  });

  test('cell padding can be overridden', () => {
    const range: CellRange = {
      start: { col: 0, row: 0 },
      end: { col: 0, row: 0 },
    };
    const rect = calculateCellRect(range, [4, 3], canvas, config, 32);
    expect(rect.padding).toBe(32);
  });
});

describe('calculateSizes', () => {
  test('equal sizes when no ratios provided', () => {
    const sizes = calculateSizes(1280, 4, 0);
    expect(sizes).toEqual([320, 320, 320, 320]);
  });

  test('ratio-based sizes [1, 2, 1]', () => {
    const sizes = calculateSizes(1280, 3, 0, [1, 2, 1]);
    // total ratio = 4, available = 1280
    expect(sizes).toEqual([320, 640, 320]);
  });

  test('ratio-based sizes with gap', () => {
    const sizes = calculateSizes(1280, 3, 10, [1, 2, 1]);
    // available = 1280 - 2*10 = 1260, total ratio = 4
    expect(sizes[0]).toBeCloseTo(315);
    expect(sizes[1]).toBeCloseTo(630);
    expect(sizes[2]).toBeCloseTo(315);
  });

  test('handles decimal ratios', () => {
    const sizes = calculateSizes(1000, 2, 0, [1.5, 0.5]);
    expect(sizes[0]).toBeCloseTo(750);
    expect(sizes[1]).toBeCloseTo(250);
  });
});

describe('calculateCellRect with unequal grid', () => {
  const canvas = { width: 1280, height: 720 };
  const config: LayoutConfig = { gap: 0, padding: 16 };

  test('unequal columns [1, 2, 1]', () => {
    const gridSizes = {
      colSizes: calculateSizes(1280, 3, 0, [1, 2, 1]),
      rowSizes: calculateSizes(720, 2, 0),
    };

    // First column (A): width 320
    const rectA = calculateCellRect(
      { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
      [3, 2], canvas, config, undefined, gridSizes,
    );
    expect(rectA.x).toBe(0);
    expect(rectA.width).toBe(320);

    // Second column (B): width 640
    const rectB = calculateCellRect(
      { start: { col: 1, row: 0 }, end: { col: 1, row: 0 } },
      [3, 2], canvas, config, undefined, gridSizes,
    );
    expect(rectB.x).toBe(320);
    expect(rectB.width).toBe(640);

    // Third column (C): width 320
    const rectC = calculateCellRect(
      { start: { col: 2, row: 0 }, end: { col: 2, row: 0 } },
      [3, 2], canvas, config, undefined, gridSizes,
    );
    expect(rectC.x).toBe(960);
    expect(rectC.width).toBe(320);
  });

  test('merged cells across unequal columns', () => {
    const gridSizes = {
      colSizes: calculateSizes(1280, 3, 0, [1, 2, 1]),
      rowSizes: calculateSizes(720, 2, 0),
    };

    // A1..B1 spans columns with widths 320 + 640 = 960
    const rect = calculateCellRect(
      { start: { col: 0, row: 0 }, end: { col: 1, row: 0 } },
      [3, 2], canvas, config, undefined, gridSizes,
    );
    expect(rect.x).toBe(0);
    expect(rect.width).toBe(960);
  });

  test('unequal rows [1, 3]', () => {
    const gridSizes = {
      colSizes: calculateSizes(1280, 3, 0),
      rowSizes: calculateSizes(720, 2, 0, [1, 3]),
    };

    // First row: height 720 * 1/4 = 180
    const rect1 = calculateCellRect(
      { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
      [3, 2], canvas, config, undefined, gridSizes,
    );
    expect(rect1.height).toBeCloseTo(180);

    // Second row: height 720 * 3/4 = 540
    const rect2 = calculateCellRect(
      { start: { col: 0, row: 1 }, end: { col: 0, row: 1 } },
      [3, 2], canvas, config, undefined, gridSizes,
    );
    expect(rect2.y).toBeCloseTo(180);
    expect(rect2.height).toBeCloseTo(540);
  });
});
