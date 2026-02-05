import { HTMLElement, parse as parseHtml } from 'node-html-parser';
import type { DomElement, ViewportConfig, ParseOptions } from './types.js';

/** Element priority levels (higher = more important) */
const ELEMENT_PRIORITY: Record<string, number> = {
  // Highest priority: structural landmarks
  header: 100,
  nav: 95,
  main: 90,
  footer: 85,
  // High priority: headings and forms
  h1: 80,
  h2: 75,
  h3: 70,
  form: 65,
  // Medium priority: content sections
  section: 60,
  article: 55,
  aside: 50,
  // Medium priority: interactive elements
  button: 45,
  input: 40,
  textarea: 38,
  select: 35,
  // Medium priority: media
  img: 30,
  // Lower priority: text elements
  h4: 25,
  h5: 24,
  h6: 23,
  p: 20,
  // Lowest priority: inline elements
  a: 10,
  span: 5,
  label: 5,
};

/** Tags to extract as visual elements */
const VISUAL_TAGS = new Set(Object.keys(ELEMENT_PRIORITY));

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
  'svg',
  'path',
  'template',
  'iframe',
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

/** Default parse options */
const DEFAULT_OPTIONS: Required<ParseOptions> = {
  maxDepth: 4,
  maxElements: 50,
};

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
 * Process a single HTML element with depth tracking
 */
function processElement(
  element: HTMLElement,
  state: LayoutState,
  results: DomElement[],
  depth: number,
  maxDepth: number,
): void {
  // Stop if we've reached max depth
  if (depth > maxDepth) {
    return;
  }

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
      // Still process children (but respect depth limit)
      for (const child of element.childNodes) {
        if (child instanceof HTMLElement) {
          processElement(child, state, results, depth + 1, maxDepth);
        }
      }
      return;
    }
  }

  if (isVisual) {
    const priority = ELEMENT_PRIORITY[tagName] ?? 0;

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
      priority,
      depth,
    };

    results.push(domElement);
  }

  // Process children for containers
  if (isContainer || !isVisual) {
    for (const child of element.childNodes) {
      if (child instanceof HTMLElement) {
        processElement(child, state, results, depth + 1, maxDepth);
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
  options?: ParseOptions,
): DomElement[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

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
      processElement(child, state, results, 0, opts.maxDepth);
    }
  }

  // Sort by priority (highest first) and limit to maxElements
  const sorted = results
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    .slice(0, opts.maxElements);

  // Re-sort by Y position for layout
  sorted.sort((a, b) => a.bounds.y - b.bounds.y);

  return sorted;
}
