import { describe, expect, test } from 'vitest';
import {
  calculateCanvasSize,
  calculateCellRect,
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
