import { describe, expect, it } from 'vitest';
import { parseHtmlToDom } from '../../src/fetcher/parser.js';
import type { ViewportConfig } from '../../src/fetcher/types.js';

const desktopViewport: ViewportConfig = {
  width: 1280,
  height: 720,
  userAgent: 'Test',
  defaultRatio: [16, 9],
};

describe('parseHtmlToDom', () => {
  it('extracts header element', () => {
    const html = '<html><body><header>Site Header</header></body></html>';
    const elements = parseHtmlToDom(html, desktopViewport);

    expect(elements).toHaveLength(1);
    expect(elements[0].tagName).toBe('header');
    expect(elements[0].bounds.width).toBe(1280);
  });

  it('extracts multiple structural elements', () => {
    const html = `
      <html><body>
        <header>Header</header>
        <nav>Nav</nav>
        <main>Main</main>
        <footer>Footer</footer>
      </body></html>
    `;
    const elements = parseHtmlToDom(html, desktopViewport);

    expect(elements).toHaveLength(4);
    expect(elements.map((e) => e.tagName)).toEqual([
      'header',
      'nav',
      'main',
      'footer',
    ]);
  });

  it('extracts button elements', () => {
    const html = '<html><body><button>Click me</button></body></html>';
    const elements = parseHtmlToDom(html, desktopViewport);

    expect(elements).toHaveLength(1);
    expect(elements[0].tagName).toBe('button');
    expect(elements[0].hasText).toBe(true);
  });

  it('extracts input elements with placeholder', () => {
    const html =
      '<html><body><input placeholder="Enter email" type="email"></body></html>';
    const elements = parseHtmlToDom(html, desktopViewport);

    expect(elements).toHaveLength(1);
    expect(elements[0].tagName).toBe('input');
    expect(elements[0].attributes.placeholder).toBe('Enter email');
    expect(elements[0].attributes.type).toBe('email');
  });

  it('extracts textarea and select', () => {
    const html = `
      <html><body>
        <textarea>Some text</textarea>
        <select><option>Option 1</option></select>
      </body></html>
    `;
    const elements = parseHtmlToDom(html, desktopViewport);

    expect(elements).toHaveLength(2);
    expect(elements.map((e) => e.tagName)).toEqual(['textarea', 'select']);
  });

  it('extracts img elements with src and alt', () => {
    const html = '<html><body><img src="logo.png" alt="Logo"></body></html>';
    const elements = parseHtmlToDom(html, desktopViewport);

    expect(elements).toHaveLength(1);
    expect(elements[0].tagName).toBe('img');
    expect(elements[0].attributes.src).toBe('logo.png');
    expect(elements[0].attributes.alt).toBe('Logo');
  });

  it('extracts heading elements with text', () => {
    const html = '<html><body><h1>Title</h1><h2>Subtitle</h2></body></html>';
    const elements = parseHtmlToDom(html, desktopViewport);

    expect(elements).toHaveLength(2);
    expect(elements[0].tagName).toBe('h1');
    expect(elements[0].hasText).toBe(true);
    expect(elements[0].textContent).toBe('Title');
  });

  it('skips heading elements without text', () => {
    const html =
      '<html><body><h1></h1><h2>   </h2><h3>Visible</h3></body></html>';
    const elements = parseHtmlToDom(html, desktopViewport);

    expect(elements).toHaveLength(1);
    expect(elements[0].tagName).toBe('h3');
  });

  it('extracts paragraph elements with text', () => {
    const html = '<html><body><p>Some paragraph text here.</p></body></html>';
    const elements = parseHtmlToDom(html, desktopViewport);

    expect(elements).toHaveLength(1);
    expect(elements[0].tagName).toBe('p');
    expect(elements[0].textContent).toBe('Some paragraph text here.');
  });

  it('skips script and style tags', () => {
    const html = `
      <html>
        <head>
          <script>console.log("skip me")</script>
          <style>body { color: red; }</style>
        </head>
        <body>
          <script>alert("skip")</script>
          <p>Visible</p>
        </body>
      </html>
    `;
    const elements = parseHtmlToDom(html, desktopViewport);

    expect(elements).toHaveLength(1);
    expect(elements[0].tagName).toBe('p');
  });

  it('extracts form elements', () => {
    const html = `
      <html><body>
        <form>
          <input placeholder="Name">
          <button>Submit</button>
        </form>
      </body></html>
    `;
    const elements = parseHtmlToDom(html, desktopViewport);

    expect(elements).toHaveLength(3);
    expect(elements.map((e) => e.tagName)).toEqual(['form', 'input', 'button']);
  });

  it('handles nested structure', () => {
    const html = `
      <html><body>
        <header>
          <nav>
            <a href="/">Home</a>
          </nav>
        </header>
        <main>
          <section>
            <h1>Welcome</h1>
          </section>
        </main>
      </body></html>
    `;
    const elements = parseHtmlToDom(html, desktopViewport);

    // Should extract: header, nav, a, main, section, h1
    const tags = elements.map((e) => e.tagName);
    expect(tags).toContain('header');
    expect(tags).toContain('nav');
    expect(tags).toContain('a');
    expect(tags).toContain('main');
    expect(tags).toContain('section');
    expect(tags).toContain('h1');
  });

  it('truncates long text content', () => {
    const longText = 'A'.repeat(100);
    const html = `<html><body><p>${longText}</p></body></html>`;
    const elements = parseHtmlToDom(html, desktopViewport);

    expect(elements[0].textContent).toBe(`${'A'.repeat(50)}...`);
  });

  it('calculates sequential Y positions', () => {
    const html = `
      <html><body>
        <h1>Title</h1>
        <p>Paragraph</p>
        <button>Click</button>
      </body></html>
    `;
    const elements = parseHtmlToDom(html, desktopViewport);

    // Each element should have increasing Y position
    expect(elements[0].bounds.y).toBe(0);
    expect(elements[1].bounds.y).toBeGreaterThan(elements[0].bounds.y);
    expect(elements[2].bounds.y).toBeGreaterThan(elements[1].bounds.y);
  });

  it('returns empty array for empty body', () => {
    const html = '<html><body></body></html>';
    const elements = parseHtmlToDom(html, desktopViewport);

    expect(elements).toHaveLength(0);
  });

  it('handles missing body tag', () => {
    const html = '<div><p>Text</p></div>';
    const elements = parseHtmlToDom(html, desktopViewport);

    expect(elements).toHaveLength(1);
    expect(elements[0].tagName).toBe('p');
  });
});
