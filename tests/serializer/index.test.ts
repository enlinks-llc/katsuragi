import { describe, expect, it } from 'vitest';
import {
  coordToRef,
  rangeToString,
  serialize,
} from '../../src/serializer/index.js';
import type { CellRange, KuiDocument } from '../../src/types.js';

describe('coordToRef', () => {
  it('converts column 0 to A', () => {
    expect(coordToRef({ col: 0, row: 0 })).toBe('A1');
  });

  it('converts column 25 to Z', () => {
    expect(coordToRef({ col: 25, row: 0 })).toBe('Z1');
  });

  it('handles different rows', () => {
    expect(coordToRef({ col: 1, row: 2 })).toBe('B3');
    expect(coordToRef({ col: 3, row: 9 })).toBe('D10');
  });
});

describe('rangeToString', () => {
  it('formats single cell without ..', () => {
    const range: CellRange = {
      start: { col: 0, row: 0 },
      end: { col: 0, row: 0 },
    };
    expect(rangeToString(range)).toBe('A1');
  });

  it('formats multi-cell range with ..', () => {
    const range: CellRange = {
      start: { col: 0, row: 0 },
      end: { col: 1, row: 1 },
    };
    expect(rangeToString(range)).toBe('A1..B2');
  });

  it('formats full row range', () => {
    const range: CellRange = {
      start: { col: 0, row: 0 },
      end: { col: 3, row: 0 },
    };
    expect(rangeToString(range)).toBe('A1..D1');
  });
});

describe('serialize', () => {
  it('serializes minimal document', () => {
    const doc: KuiDocument = {
      metadata: {
        ratio: [16, 9],
        grid: [4, 3],
      },
      components: [],
    };

    const result = serialize(doc);
    expect(result).toBe('ratio: 16:9\ngrid: 4x3\n');
  });

  it('serializes document with gap and padding', () => {
    const doc: KuiDocument = {
      metadata: {
        ratio: [16, 9],
        grid: [4, 3],
        gap: 8,
        padding: 16,
      },
      components: [],
    };

    const result = serialize(doc);
    expect(result).toContain('gap: 8');
    expect(result).toContain('padding: 16');
  });

  it('serializes document with colors', () => {
    const doc: KuiDocument = {
      metadata: {
        ratio: [16, 9],
        grid: [4, 3],
        colors: { primary: '#3B82F6', danger: '#EF4444' },
      },
      components: [],
    };

    const result = serialize(doc);
    expect(result).toContain(
      'colors: { primary: "#3B82F6", danger: "#EF4444" }',
    );
  });

  it('serializes components', () => {
    const doc: KuiDocument = {
      metadata: {
        ratio: [16, 9],
        grid: [4, 3],
      },
      components: [
        {
          type: 'txt',
          range: { start: { col: 0, row: 0 }, end: { col: 3, row: 0 } },
          props: { value: 'Header', align: 'center' },
        },
        {
          type: 'btn',
          range: { start: { col: 0, row: 1 }, end: { col: 0, row: 1 } },
          props: { value: 'Submit' },
        },
      ],
    };

    const result = serialize(doc);
    expect(result).toContain(
      'A1..D1: { type: txt, value: "Header", align: center }',
    );
    expect(result).toContain('A2: { type: btn, value: "Submit" }');
  });

  it('serializes input component with label', () => {
    const doc: KuiDocument = {
      metadata: {
        ratio: [16, 9],
        grid: [4, 3],
      },
      components: [
        {
          type: 'input',
          range: { start: { col: 0, row: 0 }, end: { col: 1, row: 0 } },
          props: { label: 'Email' },
        },
      ],
    };

    const result = serialize(doc);
    expect(result).toContain('A1..B1: { type: input, label: "Email" }');
  });

  it('serializes box component with bg and border', () => {
    const doc: KuiDocument = {
      metadata: {
        ratio: [16, 9],
        grid: [4, 3],
      },
      components: [
        {
          type: 'box',
          range: { start: { col: 0, row: 0 }, end: { col: 1, row: 1 } },
          props: { bg: '#f0f0f0', border: '#333333' },
        },
      ],
    };

    const result = serialize(doc);
    expect(result).toContain(
      'A1..B2: { type: box, bg: "#f0f0f0", border: "#333333" }',
    );
  });

  it('serializes img component with src and alt', () => {
    const doc: KuiDocument = {
      metadata: {
        ratio: [16, 9],
        grid: [4, 3],
      },
      components: [
        {
          type: 'img',
          range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
          props: { src: 'logo.png', alt: 'Company Logo' },
        },
      ],
    };

    const result = serialize(doc);
    expect(result).toContain(
      'A1: { type: img, src: "logo.png", alt: "Company Logo" }',
    );
  });

  it('escapes special characters in strings', () => {
    const doc: KuiDocument = {
      metadata: {
        ratio: [16, 9],
        grid: [4, 3],
      },
      components: [
        {
          type: 'txt',
          range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
          props: { value: 'Say "Hello"' },
        },
      ],
    };

    const result = serialize(doc);
    expect(result).toContain('value: "Say \\"Hello\\""');
  });

  it('uses backtick syntax for multiline values', () => {
    const doc: KuiDocument = {
      metadata: {
        ratio: [16, 9],
        grid: [4, 3],
      },
      components: [
        {
          type: 'txt',
          range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
          props: { value: 'Line 1\nLine 2' },
        },
      ],
    };

    const result = serialize(doc);
    expect(result).toContain('value: `Line 1\nLine 2`');
  });

  it('adds header comment when provided', () => {
    const doc: KuiDocument = {
      metadata: {
        ratio: [9, 16],
        grid: [4, 5],
      },
      components: [],
    };

    const result = serialize(doc, { headerComment: 'Viewport: mobile' });
    expect(result.startsWith('// Viewport: mobile\n')).toBe(true);
  });

  it('omits default align (left)', () => {
    const doc: KuiDocument = {
      metadata: {
        ratio: [16, 9],
        grid: [4, 3],
      },
      components: [
        {
          type: 'txt',
          range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
          props: { value: 'Text', align: 'left' },
        },
      ],
    };

    const result = serialize(doc);
    expect(result).not.toContain('align: left');
  });
});
