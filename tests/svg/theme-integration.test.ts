import { describe, expect, test } from 'vitest';
import { parse } from '../../src/parser/index.js';
import { generateSvg } from '../../src/svg/index.js';
import { serialize } from '../../src/serializer/index.js';

describe('theme integration', () => {
  test('parses theme metadata', () => {
    const doc = parse(`
      ratio: 16:9
      grid: 2x2
      theme: clean
      A1: { type: box }
    `);
    expect(doc.metadata.theme).toBe('clean');
  });

  test('theme affects SVG output - clean has smaller border radius', () => {
    const cleanDoc = parse(`
      ratio: 16:9
      grid: 2x2
      theme: clean
      A1: { type: box }
    `);
    const defaultDoc = parse(`
      ratio: 16:9
      grid: 2x2
      A1: { type: box }
    `);

    const cleanSvg = generateSvg(cleanDoc);
    const defaultSvg = generateSvg(defaultDoc);

    expect(cleanSvg).toContain('rx="4"');
    expect(defaultSvg).toContain('rx="8"');
  });

  test('theme affects SVG output - bold has larger font', () => {
    const doc = parse(`
      ratio: 16:9
      grid: 2x2
      theme: bold
      A1: { type: txt, value: "Hello" }
    `);
    const svg = generateSvg(doc);
    expect(svg).toContain('font-size="28"');
  });

  test('component bg overrides theme defaultBg', () => {
    const doc = parse(`
      ratio: 16:9
      grid: 2x2
      theme: clean
      A1: { type: box, bg: "#ff0000" }
    `);
    const svg = generateSvg(doc);
    expect(svg).toContain('fill="#ff0000"');
    expect(svg).not.toContain('fill="#f0f0f0"');
  });

  test('serializer outputs theme', () => {
    const doc = parse(`
      ratio: 16:9
      grid: 2x2
      theme: bold
      A1: { type: box }
    `);
    const output = serialize(doc);
    expect(output).toContain('theme: bold');
  });

  test('serializer omits theme when not set', () => {
    const doc = parse(`
      ratio: 16:9
      grid: 2x2
      A1: { type: box }
    `);
    const output = serialize(doc);
    expect(output).not.toContain('theme');
  });

  test('unknown theme throws error', () => {
    expect(() => {
      const doc = parse(`
        ratio: 16:9
        grid: 2x2
        theme: nonexistent
        A1: { type: box }
      `);
      generateSvg(doc);
    }).toThrow('Unknown theme "nonexistent"');
  });
});
