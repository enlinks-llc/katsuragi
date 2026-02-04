import { describe, expect, test } from 'vitest';
import { generateSvg } from '../../src/svg/generator.js';
import type { KuiDocument } from '../../src/types.js';

describe('generateSvg', () => {
  test('generates basic SVG structure', () => {
    const doc: KuiDocument = {
      metadata: { ratio: [16, 9], grid: [4, 3] },
      components: [],
    };
    const svg = generateSvg(doc);

    expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(svg).toContain('<svg');
    expect(svg).toContain('width="1280"');
    expect(svg).toContain('height="720"');
    expect(svg).toContain('</svg>');
  });

  test('generates white background', () => {
    const doc: KuiDocument = {
      metadata: { ratio: [16, 9], grid: [4, 3] },
      components: [],
    };
    const svg = generateSvg(doc);

    expect(svg).toContain('fill="white"');
    expect(svg).toMatch(/<rect[^>]*width="1280"[^>]*height="720"/);
  });

  describe('txt component', () => {
    test('renders txt with default style', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'txt',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: { value: 'Hello', align: 'left', style: 'default' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('<text');
      expect(svg).toContain('>Hello</text>');
    });

    test('renders txt with center align', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'txt',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: { value: 'Center', align: 'center', style: 'default' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('text-anchor="middle"');
    });

    test('renders txt with right align', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'txt',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: { value: 'Right', align: 'right', style: 'default' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('text-anchor="end"');
    });

    test('renders txt with newline as multiple tspans', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'txt',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: { value: 'Line 1\nLine 2', align: 'left', style: 'default' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('<tspan');
      expect(svg).toContain('>Line 1</tspan>');
      expect(svg).toContain('>Line 2</tspan>');
    });

    test('renders single-line txt without tspan', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'txt',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: { value: 'Single line', align: 'left', style: 'default' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).not.toContain('<tspan');
      expect(svg).toContain('>Single line</text>');
    });
  });

  describe('box component', () => {
    test('renders box with default style (light gray)', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'box',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: { style: 'default' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('<rect');
      expect(svg).toContain('fill="#e0e0e0"');
    });

    test('renders box with primary style (black fill)', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'box',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: { style: 'primary' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('fill="black"');
    });

    test('renders box with secondary style (stroke only)', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'box',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: { style: 'secondary' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('fill="white"');
      expect(svg).toContain('stroke="black"');
    });
  });

  describe('btn component', () => {
    test('renders btn with value', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'btn',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: { value: 'Submit', style: 'primary' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('<rect');
      expect(svg).toContain('>Submit</text>');
    });

    test('renders btn with primary style (black bg, white text)', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'btn',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: { value: 'Submit', style: 'primary' },
          },
        ],
      };
      const svg = generateSvg(doc);

      // Button should have black fill and white text
      expect(svg).toContain('fill="black"');
      expect(svg).toContain('fill="white"');
    });
  });

  describe('input component', () => {
    test('renders input with label', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'input',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: { label: 'Email', style: 'default' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('>Email</text>');
      expect(svg).toContain('<rect');
    });
  });

  describe('img component', () => {
    test('renders img placeholder with alt text', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'img',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: { src: '/logo.png', alt: 'Logo', style: 'default' },
          },
        ],
      };
      const svg = generateSvg(doc);

      // Image placeholder with alt text
      expect(svg).toContain('>[IMG: Logo]</text>');
    });

    test('renders img placeholder with src when no alt', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'img',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: { src: '/logo.png', style: 'default' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('>[IMG: /logo.png]</text>');
    });
  });

  describe('border radius', () => {
    test('applies rounded corners to components', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'btn',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: { value: 'Test', style: 'default' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toMatch(/rx="[^0"]/);
    });
  });

  describe('complete document', () => {
    test('renders multiple components', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'txt',
            range: { start: { col: 0, row: 0 }, end: { col: 3, row: 0 } },
            props: { value: 'Login', align: 'center', style: 'default' },
          },
          {
            type: 'input',
            range: { start: { col: 0, row: 1 }, end: { col: 3, row: 1 } },
            props: { label: 'Email', style: 'default' },
          },
          {
            type: 'btn',
            range: { start: { col: 3, row: 2 }, end: { col: 3, row: 2 } },
            props: { value: 'Submit', style: 'primary' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('>Login</text>');
      expect(svg).toContain('>Email</text>');
      expect(svg).toContain('>Submit</text>');
    });
  });
});
