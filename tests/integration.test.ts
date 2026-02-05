import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, test } from 'vitest';
import { convertToPng } from '../src/converter/index.js';
import { parse } from '../src/parser/index.js';
import { generateSvg } from '../src/svg/index.js';

const examplesDir = path.join(__dirname, '..', 'examples');

describe('Integration: Example files', () => {
  const exampleFiles = ['login.kui', 'dashboard.kui', 'mobile.kui'];

  for (const file of exampleFiles) {
    describe(file, () => {
      const filePath = path.join(examplesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      test('parses without error', () => {
        const doc = parse(content);
        expect(doc.metadata.ratio).toBeDefined();
        expect(doc.metadata.grid).toBeDefined();
        expect(doc.components.length).toBeGreaterThan(0);
      });

      test('generates valid SVG', () => {
        const doc = parse(content);
        const svg = generateSvg(doc);

        expect(svg).toContain('<?xml version="1.0"');
        expect(svg).toContain('<svg');
        expect(svg).toContain('</svg>');
      });

      test('converts to PNG', async () => {
        const doc = parse(content);
        const svg = generateSvg(doc);
        const png = await convertToPng(svg);

        // Verify PNG magic bytes
        expect(png[0]).toBe(0x89);
        expect(png[1]).toBe(0x50);
        expect(png[2]).toBe(0x4e);
        expect(png[3]).toBe(0x47);
      });
    });
  }
});

describe('Integration: End-to-end', () => {
  test('full pipeline: parse → layout → SVG → PNG', async () => {
    const kuiContent = `
ratio: 16:9
grid: 4x3
colors: { primary: "#3B82F6", outline: "#333" }

// Header
A1..D1: { type: txt, value: "Integration Test", align: center }

// Content
A2..B3: { type: box }
C2..D2: { type: input, label: "Name" }
C3: { type: btn, value: "Cancel", border: $outline }
D3: { type: btn, value: "OK", bg: $primary }
`;

    // Parse
    const doc = parse(kuiContent);
    expect(doc.components).toHaveLength(5);

    // Generate SVG
    const svg = generateSvg(doc);
    expect(svg).toContain('Integration Test');
    expect(svg).toContain('Name');
    expect(svg).toContain('Cancel');
    expect(svg).toContain('OK');

    // Convert to PNG
    const png = await convertToPng(svg);
    expect(png.length).toBeGreaterThan(1000); // Should be a reasonable size
  });

  test('handles all component types', async () => {
    const kuiContent = `
ratio: 4:3
grid: 5x5

A1: { type: txt, value: "Text" }
B1: { type: box }
C1: { type: btn, value: "Button" }
D1: { type: input, label: "Input" }
E1: { type: img, alt: "Image" }
`;

    const doc = parse(kuiContent);
    expect(doc.components).toHaveLength(5);
    expect(doc.components.map((c) => c.type)).toEqual([
      'txt',
      'box',
      'btn',
      'input',
      'img',
    ]);

    const svg = generateSvg(doc);
    expect(svg).toContain('Text');
    expect(svg).toContain('Button');
    expect(svg).toContain('Input');
    expect(svg).toContain('[IMG: Image]');
  });

  test('handles color variants', () => {
    const kuiContent = `
ratio: 4:3
grid: 3x1
colors: { primary: "#3B82F6", danger: "#EF4444" }

A1: { type: btn, value: "Default" }
B1: { type: btn, value: "Primary", bg: $primary }
C1: { type: btn, value: "Danger", bg: $danger, border: black }
`;

    const doc = parse(kuiContent);
    const svg = generateSvg(doc);

    expect(svg).toContain('fill="#e0e0e0"'); // default bg
    expect(svg).toContain('fill="#3B82F6"'); // primary bg
    expect(svg).toContain('fill="#EF4444"'); // danger bg
    expect(svg).toContain('stroke="black"'); // border
  });

  test('handles all align variants', () => {
    const kuiContent = `
ratio: 4:3
grid: 3x1

A1: { type: txt, value: "Left", align: left }
B1: { type: txt, value: "Center", align: center }
C1: { type: txt, value: "Right", align: right }
`;

    const doc = parse(kuiContent);
    const svg = generateSvg(doc);

    expect(svg).toContain('text-anchor="start"'); // left
    expect(svg).toContain('text-anchor="middle"'); // center
    expect(svg).toContain('text-anchor="end"'); // right
  });
});
