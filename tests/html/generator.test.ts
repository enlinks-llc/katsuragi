import { describe, expect, test } from 'vitest';
import { parse } from '../../src/parser/index.js';
import { generateHtml } from '../../src/html/index.js';

describe('generateHtml', () => {
  test('generates valid HTML structure', () => {
    const doc = parse(`
      ratio: 16:9
      grid: 2x2
      A1: { type: box }
    `);
    const html = generateHtml(doc);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('Katsuragi Wireframe');
    expect(html).toContain('</html>');
  });

  test('uses CSS grid layout', () => {
    const doc = parse(`
      ratio: 16:9
      grid: 3x2
      gap: 8
      padding: 16
      A1: { type: box }
    `);
    const html = generateHtml(doc);
    expect(html).toContain('display: grid');
    expect(html).toContain('grid-template-columns: repeat(3, 1fr)');
    expect(html).toContain('grid-template-rows: repeat(2, 1fr)');
    expect(html).toContain('gap: 8px');
    expect(html).toContain('padding: 16px');
  });

  test('renders txt component', () => {
    const doc = parse(`
      ratio: 16:9
      grid: 2x2
      A1: { type: txt, value: "Hello" }
    `);
    const html = generateHtml(doc);
    expect(html).toContain('class="kui-txt"');
    expect(html).toContain('Hello');
  });

  test('renders box component', () => {
    const doc = parse(`
      ratio: 16:9
      grid: 2x2
      A1: { type: box, bg: "#ff0000" }
    `);
    const html = generateHtml(doc);
    expect(html).toContain('class="kui-box"');
    expect(html).toContain('background: #ff0000');
  });

  test('renders btn component', () => {
    const doc = parse(`
      ratio: 16:9
      grid: 2x2
      A1: { type: btn, value: "Click" }
    `);
    const html = generateHtml(doc);
    expect(html).toContain('<button class="kui-btn"');
    expect(html).toContain('Click');
  });

  test('renders input component', () => {
    const doc = parse(`
      ratio: 16:9
      grid: 2x2
      A1: { type: input, label: "Email" }
    `);
    const html = generateHtml(doc);
    expect(html).toContain('class="kui-input"');
    expect(html).toContain('<label');
    expect(html).toContain('Email');
    expect(html).toContain('class="field"');
  });

  test('renders img placeholder', () => {
    const doc = parse(`
      ratio: 16:9
      grid: 2x2
      A1: { type: img, alt: "Logo" }
    `);
    const html = generateHtml(doc);
    expect(html).toContain('class="kui-img"');
    expect(html).toContain('[IMG: Logo]');
  });

  test('handles merged cells with grid-area', () => {
    const doc = parse(`
      ratio: 16:9
      grid: 3x2
      A1..C1: { type: txt, value: "Header" }
    `);
    const html = generateHtml(doc);
    // A1..C1 = row 1, cols 1-3 → grid-area: 1 / 1 / 2 / 4
    expect(html).toContain('grid-area: 1 / 1 / 2 / 4');
  });

  test('supports unequal grid with fr units', () => {
    const doc = parse(`
      ratio: 16:9
      grid: 3x3
      col-widths: [1, 3, 1]
      row-heights: [1, 4, 1]
      A1: { type: box }
    `);
    const html = generateHtml(doc);
    expect(html).toContain('grid-template-columns: 1fr 3fr 1fr');
    expect(html).toContain('grid-template-rows: 1fr 4fr 1fr');
  });

  test('applies theme to components', () => {
    const doc = parse(`
      ratio: 16:9
      grid: 2x2
      theme: bold
      A1: { type: box }
    `);
    const html = generateHtml(doc);
    expect(html).toContain('border-radius: 12px');
  });

  test('escapes HTML in text', () => {
    const doc = parse(`
      ratio: 16:9
      grid: 2x2
      A1: { type: txt, value: "<script>alert('xss')</script>" }
    `);
    const html = generateHtml(doc);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  test('converts newlines to br tags', () => {
    const doc = parse(`
      ratio: 16:9
      grid: 2x2
      A1: { type: txt, value: "Line 1\\nLine 2" }
    `);
    const html = generateHtml(doc);
    expect(html).toContain('Line 1<br>Line 2');
  });
});
