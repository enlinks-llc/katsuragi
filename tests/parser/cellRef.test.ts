import { describe, expect, it } from 'vitest';
import { parseCellRange, parseCellRef } from '../../src/parser/cellRef';

describe('parseCellRef', () => {
  it('parses A1 to {col: 0, row: 0}', () => {
    expect(parseCellRef('A1')).toEqual({ col: 0, row: 0 });
  });

  it('parses B2 to {col: 1, row: 1}', () => {
    expect(parseCellRef('B2')).toEqual({ col: 1, row: 1 });
  });

  it('parses D10 to {col: 3, row: 9}', () => {
    expect(parseCellRef('D10')).toEqual({ col: 3, row: 9 });
  });

  it('parses Z1 to {col: 25, row: 0}', () => {
    expect(parseCellRef('Z1')).toEqual({ col: 25, row: 0 });
  });

  it('throws on invalid ref', () => {
    expect(() => parseCellRef('invalid')).toThrow();
    expect(() => parseCellRef('1A')).toThrow();
    expect(() => parseCellRef('')).toThrow();
  });
});

describe('parseCellRange', () => {
  it('parses A1..B2', () => {
    expect(parseCellRange('A1..B2')).toEqual({
      start: { col: 0, row: 0 },
      end: { col: 1, row: 1 },
    });
  });

  it('parses single cell A1 as A1..A1', () => {
    expect(parseCellRange('A1')).toEqual({
      start: { col: 0, row: 0 },
      end: { col: 0, row: 0 },
    });
  });

  it('normalizes reversed range B2..A1', () => {
    const range = parseCellRange('B2..A1');
    expect(range.start.col).toBeLessThanOrEqual(range.end.col);
    expect(range.start.row).toBeLessThanOrEqual(range.end.row);
  });
});
