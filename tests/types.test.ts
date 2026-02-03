import { describe, it, expect } from 'vitest';
import type { KuiDocument, CellRange, Component, Metadata } from '../src/types';

describe('Type definitions', () => {
  it('should define KuiDocument structure', () => {
    const doc: KuiDocument = {
      metadata: { ratio: [16, 9], grid: [4, 3] },
      components: [],
    };
    expect(doc.metadata.ratio).toEqual([16, 9]);
    expect(doc.metadata.grid).toEqual([4, 3]);
  });

  it('should define CellRange', () => {
    const range: CellRange = {
      start: { col: 0, row: 0 },
      end: { col: 1, row: 1 },
    };
    expect(range.start.col).toBe(0);
  });

  it('should define Component types', () => {
    const txt: Component = {
      type: 'txt',
      range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
      props: { value: 'Hello', align: 'left' },
    };
    expect(txt.type).toBe('txt');
  });
});
