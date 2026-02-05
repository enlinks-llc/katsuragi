import { HTMLElement, parse as parseHtml } from 'node-html-parser';
import type { DomElement, ViewportConfig } from './types.js';

/** Tags to extract as visual elements */
const VISUAL_TAGS = new Set([
  // Structural
  'header',
  'nav',
  'main',
  'footer',
  'section',
  'article',
  'aside',
  'form',
  // Interactive
  'button',
  // Input
  'input',
  'textarea',
  'select',
  // Media
  'img',
  // Text (only when containing text)
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'span',
  'label',
  'a',
]);

/** Tags that are considered containers (can have children) */
const CONTAINER_TAGS = new Set([
  'header',
  'nav',
  'main',
  'footer',
  'section',
  'article',
  'aside',
  'form',
  'div',
]);

/** Tags to skip entirely */
const SKIP_TAGS = new Set([
  'script',
  'style',
  'noscript',
  'meta',
  'link',
  'head',
]);

/** Approximate element heights by tag */
const ELEMENT_HEIGHTS: Record<string, number> = {
  h1: 60,
  h2: 50,
  h3: 40,
  h4: 35,
  h5: 30,
  h6: 28,
  p: 50,
  button: 40,
  input: 40,
  textarea: 80,
  select: 40,
  img: 150,
  header: 80,
  nav: 50,
  footer: 60,
  section: 200,
  article: 300,
  aside: 200,
  form: 150,
  main: 400,
  span: 30,
  label: 30,
  a: 30,
};

/** Default element height */
const DEFAULT_HEIGHT = 50;

/** Current Y position tracker for layout estimation */
interface LayoutState {
  currentY: number;
  viewportWidth: number;
}

/**
 * Extract text content from an element (first 50 chars)
 */
function extractText(element: HTMLElement): string | undefined {
  const text = element.text.trim();
  if (!text) return undefined;
  return text.length > 50 ? `${text.slice(0, 50)}...` : text;
}

/**
 * Check if an element should be treated as having text
 */
function hasTextContent(element: HTMLElement, tagName: string): boolean {
  // Text elements need actual text
  if (
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'label', 'a'].includes(
      tagName,
    )
  ) {
    return element.text.trim().length > 0;
  }
  // Buttons need text or value
  if (tagName === 'button') {
    return element.text.trim().length > 0 || !!element.getAttribute('value');
  }
  return false;
}

/**
 * Estimate element bounds based on document flow
 */
function estimateBounds(
  _element: HTMLElement,
  tagName: string,
  state: LayoutState,
): DomElement['bounds'] {
  const height = ELEMENT_HEIGHTS[tagName] ?? DEFAULT_HEIGHT;

  // Simple flow layout: full width, stacked vertically
  const bounds = {
    x: 0,
    y: state.currentY,
    width: state.viewportWidth,
    height,
  };

  // Advance Y position for block elements
  if (!['span', 'label', 'a'].includes(tagName)) {
    state.currentY += height + 10; // 10px gap between elements
  }

  return bounds;
}

/**
 * Process a single HTML element
 */
function processElement(
  element: HTMLElement,
  state: LayoutState,
  results: DomElement[],
): void {
  const tagName = element.tagName?.toLowerCase();

  // Skip non-elements or ignored tags
  if (!tagName || SKIP_TAGS.has(tagName)) {
    return;
  }

  // Check if this is a visual element
  const isVisual = VISUAL_TAGS.has(tagName);
  const isContainer = CONTAINER_TAGS.has(tagName);

  // For text elements, only include if they have text
  if (
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'label', 'a'].includes(
      tagName,
    )
  ) {
    if (!hasTextContent(element, tagName)) {
      // Still process children
      for (const child of element.childNodes) {
        if (child instanceof HTMLElement) {
          processElement(child, state, results);
        }
      }
      return;
    }
  }

  if (isVisual) {
    const domElement: DomElement = {
      tagName,
      bounds: estimateBounds(element, tagName, state),
      hasText: hasTextContent(element, tagName),
      textContent: extractText(element),
      attributes: {
        placeholder: element.getAttribute('placeholder') ?? undefined,
        alt: element.getAttribute('alt') ?? undefined,
        src: element.getAttribute('src') ?? undefined,
        type: element.getAttribute('type') ?? undefined,
      },
    };

    results.push(domElement);
  }

  // Process children for containers
  if (isContainer || !isVisual) {
    for (const child of element.childNodes) {
      if (child instanceof HTMLElement) {
        processElement(child, state, results);
      }
    }
  }
}

/**
 * Parse HTML string and extract visual elements
 */
export function parseHtmlToDom(
  html: string,
  viewport: ViewportConfig,
): DomElement[] {
  const root = parseHtml(html, {
    lowerCaseTagName: true,
    comment: false,
  });

  const state: LayoutState = {
    currentY: 0,
    viewportWidth: viewport.width,
  };

  const results: DomElement[] = [];

  // Find body or use root
  const body = root.querySelector('body') ?? root;

  for (const child of body.childNodes) {
    if (child instanceof HTMLElement) {
      processElement(child, state, results);
    }
  }

  return results;
}
