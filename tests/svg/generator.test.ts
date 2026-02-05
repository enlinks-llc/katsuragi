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
            props: { value: 'Hello', align: 'left' },
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
            props: { value: 'Center', align: 'center' },
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
            props: { value: 'Right', align: 'right' },
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
            props: { value: 'Line 1\nLine 2', align: 'left' },
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
            props: { value: 'Single line', align: 'left' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).not.toContain('<tspan');
      expect(svg).toContain('>Single line</text>');
    });

    test('renders txt with bg color', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'txt',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: { value: 'With bg', align: 'left', bg: '#f0f0f0' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('<rect');
      expect(svg).toContain('fill="#f0f0f0"');
      expect(svg).toContain('>With bg</text>');
    });

    test('renders txt with border color', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'txt',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: { value: 'With border', align: 'left', border: '#ccc' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('stroke="#ccc"');
    });
  });

  describe('box component', () => {
    test('renders box with default bg (light gray)', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'box',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: {},
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('<rect');
      expect(svg).toContain('fill="#e0e0e0"');
    });

    test('renders box with custom bg color', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'box',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: { bg: '#3B82F6' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('fill="#3B82F6"');
    });

    test('renders box with border color', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'box',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: { border: '#333' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('stroke="#333"');
    });

    test('renders box with both bg and border', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'box',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: { bg: '#f0f0f0', border: '#ccc' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('fill="#f0f0f0"');
      expect(svg).toContain('stroke="#ccc"');
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
            props: { value: 'Submit' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('<rect');
      expect(svg).toContain('>Submit</text>');
    });

    test('renders btn with default bg and black text', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'btn',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: { value: 'Submit' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('fill="#e0e0e0"');
      expect(svg).toContain('fill="black"'); // text color is always black
    });

    test('renders btn with custom bg and border', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'btn',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: { value: 'Submit', bg: '#3B82F6', border: '#333' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('fill="#3B82F6"');
      expect(svg).toContain('stroke="#333"');
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
            props: { label: 'Email' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('>Email</text>');
      expect(svg).toContain('<rect');
    });

    test('renders input with custom bg and border', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'input',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: { label: 'Email', bg: '#f0f0f0', border: '#3B82F6' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('fill="#f0f0f0"');
      expect(svg).toContain('stroke="#3B82F6"');
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
            props: { src: '/logo.png', alt: 'Logo' },
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
            props: { src: '/logo.png' },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('>[IMG: /logo.png]</text>');
    });

    test('renders img placeholder with custom bg and border', () => {
      const doc: KuiDocument = {
        metadata: { ratio: [16, 9], grid: [4, 3] },
        components: [
          {
            type: 'img',
            range: { start: { col: 0, row: 0 }, end: { col: 0, row: 0 } },
            props: {
              src: '/logo.png',
              alt: 'Logo',
              bg: '#eee',
              border: '#999',
            },
          },
        ],
      };
      const svg = generateSvg(doc);

      expect(svg).toContain('fill="#eee"');
      expect(svg).toContain('stroke="#999"');
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
            props: { value: 'Test' },
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
            props: { value: 'Login', align: 'center' },
          },
          {
            type: 'input',
            range: { start: { col: 0, row: 1 }, end: { col: 3, row: 1 } },
            props: { label: 'Email' },
          },
          {
            type: 'btn',
            range: { start: { col: 3, row: 2 }, end: { col: 3, row: 2 } },
            props: { value: 'Submit', bg: '#3B82F6' },
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
