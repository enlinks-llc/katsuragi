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
        props: { value: 'Hello', align: 'left', style: 'default' },
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

    test('parses btn component with style', () => {
      const input = `A1: { type: btn, value: "Submit", style: primary }`;
      const doc = parse(input);
      expect(doc.components[0]).toEqual({
        type: 'btn',
        range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
        props: { value: 'Submit', align: 'left', style: 'primary' },
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

    test('applies default style: default', () => {
      const input = `A1: { type: txt, value: "test" }`;
      const doc = parse(input);
      expect(doc.components[0].props.style).toBe('default');
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
        props: { value: 'Long text here', align: 'center', style: 'default' },
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
  });
});
