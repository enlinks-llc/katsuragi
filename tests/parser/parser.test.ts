import { describe, expect, test } from 'vitest';
import { parse } from '../../src/parser/parser.js';

describe('parse', () => {
  describe('metadata parsing', () => {
    test('parses ratio and grid', () => {
      const input = `ratio: 16:9
grid: 4x3`;
      const doc = parse(input);
      expect(doc.metadata.ratio).toEqual([16, 9]);
      expect(doc.metadata.grid).toEqual([4, 3]);
    });

    test('uses default ratio 16:9 if not specified', () => {
      const input = `grid: 4x3
A1: { type: txt, value: "test" }`;
      const doc = parse(input);
      expect(doc.metadata.ratio).toEqual([16, 9]);
    });

    test('uses default grid 4x3 if not specified', () => {
      const input = `ratio: 16:9
A1: { type: txt, value: "test" }`;
      const doc = parse(input);
      expect(doc.metadata.grid).toEqual([4, 3]);
    });
  });

  describe('component parsing', () => {
    test('parses txt component', () => {
      const input = `ratio: 16:9
grid: 4x3
A1: { type: txt, value: "Hello" }`;
      const doc = parse(input);
      expect(doc.components).toHaveLength(1);
      expect(doc.components[0]).toEqual({
        type: 'txt',
        range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
        props: { value: 'Hello', align: 'left' },
      });
    });

    test('parses component with cell range', () => {
      const input = `A1..B2: { type: box }`;
      const doc = parse(input);
      expect(doc.components[0].range).toEqual({
        start: { col: 0, row: 0 },
        end: { col: 1, row: 1 },
      });
    });

    test('parses btn component with bg color', () => {
      const input = `A1: { type: btn, value: "Submit", bg: "#3B82F6" }`;
      const doc = parse(input);
      expect(doc.components[0]).toEqual({
        type: 'btn',
        range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
        props: { value: 'Submit', align: 'left', bg: '#3B82F6' },
      });
    });

    test('parses input component with label', () => {
      const input = `A1: { type: input, label: "Email" }`;
      const doc = parse(input);
      expect(doc.components[0].props.label).toBe('Email');
    });

    test('parses img component with src and alt', () => {
      const input = `A1: { type: img, src: "/logo.png", alt: "Logo" }`;
      const doc = parse(input);
      expect(doc.components[0].props).toMatchObject({
        src: '/logo.png',
        alt: 'Logo',
      });
    });

    test('applies default align: left', () => {
      const input = `A1: { type: txt, value: "test" }`;
      const doc = parse(input);
      expect(doc.components[0].props.align).toBe('left');
    });

    test('bg and border are undefined by default', () => {
      const input = `A1: { type: txt, value: "test" }`;
      const doc = parse(input);
      expect(doc.components[0].props.bg).toBeUndefined();
      expect(doc.components[0].props.border).toBeUndefined();
    });

    test('respects explicit align value', () => {
      const input = `A1: { type: txt, value: "test", align: center }`;
      const doc = parse(input);
      expect(doc.components[0].props.align).toBe('center');
    });
  });

  describe('multi-line component definition', () => {
    test('parses component spanning multiple lines', () => {
      const input = `A1..B2: {
  type: txt,
  value: "Long text here",
  align: center,
}`;
      const doc = parse(input);
      expect(doc.components[0]).toEqual({
        type: 'txt',
        range: { start: { col: 0, row: 0 }, end: { col: 1, row: 1 } },
        props: { value: 'Long text here', align: 'center' },
      });
    });
  });

  describe('comments', () => {
    test('ignores line comments', () => {
      const input = `// Header section
A1: { type: txt, value: "test" }`;
      const doc = parse(input);
      expect(doc.components).toHaveLength(1);
    });

    test('ignores end-of-line comments', () => {
      const input = `A1: { type: txt, value: "test" } // main text`;
      const doc = parse(input);
      expect(doc.components[0].props.value).toBe('test');
    });
  });

  describe('complete document', () => {
    test('parses full .kui document', () => {
      const input = `ratio: 16:9
grid: 4x3

// Header section
A1..D1: { type: txt, value: "Login", align: center }

// Form section
A2..D2: { type: input, label: "Email" }
A3..C3: { type: input, label: "Password" }
D3: { type: btn, value: "Submit", style: primary }`;

      const doc = parse(input);
      expect(doc.metadata).toEqual({ ratio: [16, 9], grid: [4, 3] });
      expect(doc.components).toHaveLength(4);
    });
  });

  describe('error handling', () => {
    test('throws on overlapping cells', () => {
      const input = `A1..B2: { type: txt, value: "first" }
A1..A1: { type: txt, value: "overlap" }`;
      expect(() => parse(input)).toThrow(/overlap/i);
    });

    test('throws on missing type', () => {
      const input = `A1: { value: "no type" }`;
      expect(() => parse(input)).toThrow(/type/i);
    });

    test('throws on invalid component type', () => {
      const input = `A1: { type: invalid }`;
      expect(() => parse(input)).toThrow(/invalid.*type/i);
    });

    test('throws on cell reference exceeding grid columns', () => {
      const input = `grid: 4x3
E1: { type: txt, value: "out of bounds" }`;
      expect(() => parse(input)).toThrow(/column.*bounds/i);
    });

    test('throws on cell reference exceeding grid rows', () => {
      const input = `grid: 4x3
A4: { type: txt, value: "out of bounds" }`;
      expect(() => parse(input)).toThrow(/row.*bounds/i);
    });

    test('throws on cell range exceeding grid bounds', () => {
      const input = `grid: 4x3
A1..E5: { type: txt, value: "out of bounds" }`;
      expect(() => parse(input)).toThrow(/bounds/i);
    });

    test('accepts cells at grid edge (D3 on 4x3)', () => {
      const input = `grid: 4x3
D3: { type: txt, value: "at edge" }`;
      const doc = parse(input);
      expect(doc.components).toHaveLength(1);
    });

    test('validates against updated grid setting', () => {
      const input = `grid: 2x2
C1: { type: txt, value: "out of bounds" }`;
      expect(() => parse(input)).toThrow(/column.*bounds/i);
    });
  });

  describe('colors metadata and properties', () => {
    test('parses colors theme definition', () => {
      const input = `colors: { primary: "#3B82F6", danger: "#EF4444" }
A1: { type: btn, value: "Test" }`;
      const doc = parse(input);
      expect(doc.metadata.colors).toEqual({
        primary: '#3B82F6',
        danger: '#EF4444',
      });
    });

    test('parses colors with CSS color names', () => {
      const input = `colors: { accent: orange, light: lightblue }
A1: { type: box }`;
      const doc = parse(input);
      expect(doc.metadata.colors).toEqual({
        accent: 'orange',
        light: 'lightblue',
      });
    });

    test('resolves theme reference in bg property', () => {
      const input = `colors: { primary: "#3B82F6" }
A1: { type: btn, value: "Submit", bg: $primary }`;
      const doc = parse(input);
      expect(doc.components[0].props.bg).toBe('#3B82F6');
    });

    test('resolves theme reference in border property', () => {
      const input = `colors: { accent: "#EF4444" }
A1: { type: box, border: $accent }`;
      const doc = parse(input);
      expect(doc.components[0].props.border).toBe('#EF4444');
    });

    test('parses hex color directly in bg', () => {
      const input = `A1: { type: box, bg: "#f0f0f0" }`;
      const doc = parse(input);
      expect(doc.components[0].props.bg).toBe('#f0f0f0');
    });

    test('parses CSS color name directly in bg', () => {
      const input = `A1: { type: box, bg: lightblue }`;
      const doc = parse(input);
      expect(doc.components[0].props.bg).toBe('lightblue');
    });

    test('parses both bg and border', () => {
      const input = `A1: { type: box, bg: "#f0f0f0", border: "#ccc" }`;
      const doc = parse(input);
      expect(doc.components[0].props.bg).toBe('#f0f0f0');
      expect(doc.components[0].props.border).toBe('#ccc');
    });

    test('throws on undefined theme reference', () => {
      const input = `A1: { type: btn, bg: $undefined }`;
      expect(() => parse(input)).toThrow(/Undefined theme color.*\$undefined/);
    });

    test('colors metadata is optional', () => {
      const input = `A1: { type: box }`;
      const doc = parse(input);
      expect(doc.metadata.colors).toBeUndefined();
    });
  });

  describe('gap and padding metadata', () => {
    test('parses gap setting', () => {
      const input = 'gap: 8\nA1: { type: box }';
      const doc = parse(input);
      expect(doc.metadata.gap).toBe(8);
    });

    test('parses padding setting', () => {
      const input = 'padding: 24\nA1: { type: box }';
      const doc = parse(input);
      expect(doc.metadata.padding).toBe(24);
    });

    test('parses both gap and padding', () => {
      const input = 'gap: 10\npadding: 20\nA1: { type: box }';
      const doc = parse(input);
      expect(doc.metadata.gap).toBe(10);
      expect(doc.metadata.padding).toBe(20);
    });

    test('parses per-cell padding override', () => {
      const input = 'A1: { type: box, padding: 32 }';
      const doc = parse(input);
      expect(doc.components[0].props.padding).toBe(32);
    });

    test('gap and padding are optional (undefined by default)', () => {
      const input = 'A1: { type: box }';
      const doc = parse(input);
      expect(doc.metadata.gap).toBeUndefined();
      expect(doc.metadata.padding).toBeUndefined();
    });
  });
});
