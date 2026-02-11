import type { CellRange, Component, ComponentType } from '../types.js';
import type { GridPlacement } from './types.js';

/**
 * HTML tag to kui component type mapping
 */
const TYPE_MAP: Record<string, ComponentType> = {
  // Structural elements -> box
  header: 'box',
  nav: 'box',
  main: 'box',
  footer: 'box',
  section: 'box',
  article: 'box',
  aside: 'box',
  div: 'box',
  form: 'box',

  // Interactive -> btn
  button: 'btn',

  // Input elements -> input
  input: 'input',
  textarea: 'input',
  select: 'input',

  // Media -> img
  img: 'img',

  // Text elements -> txt
  h1: 'txt',
  h2: 'txt',
  h3: 'txt',
  h4: 'txt',
  h5: 'txt',
  h6: 'txt',
  p: 'txt',
  span: 'txt',
  label: 'txt',
  a: 'txt',
};

/** Semantic labels for structural tags */
const SEMANTIC_LABELS: Record<string, string> = {
  header: 'Header',
  nav: 'Navigation',
  main: 'Main',
  footer: 'Footer',
  section: 'Section',
  article: 'Article',
  aside: 'Sidebar',
  form: 'Form',
};

/** Input type to label mapping */
const INPUT_TYPE_LABELS: Record<string, string> = {
  email: 'Email',
  password: 'Password',
  search: 'Search',
  tel: 'Phone',
  url: 'URL',
  text: 'Text',
  number: 'Number',
  date: 'Date',
};

/**
 * Truncate text to a max length with ellipsis
 */
function truncate(text: string, maxLen: number): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen - 1) + '…';
}

/**
 * Convert a grid placement to a Component
 */
export function mapToComponent(placement: GridPlacement): Component {
  const { element, col, row, colSpan, rowSpan } = placement;
  const componentType = TYPE_MAP[element.tagName] ?? 'box';

  // Calculate cell range
  const range: CellRange = {
    start: { col, row },
    end: { col: col + colSpan - 1, row: row + rowSpan - 1 },
  };

  // Build component properties based on type
  const component: Component = {
    type: componentType,
    range,
    props: {},
  };

  // Add type-specific properties with real content
  switch (componentType) {
    case 'input': {
      const label =
        element.attributes.placeholder ??
        INPUT_TYPE_LABELS[element.attributes.type ?? ''] ??
        'Input';
      component.props.label = truncate(label, 25);
      break;
    }

    case 'img':
      component.props.alt = truncate(element.attributes.alt ?? 'Image', 25);
      break;

    case 'btn':
      component.props.value = truncate(element.textContent ?? 'Button', 20);
      break;

    case 'txt':
      component.props.value = truncate(
        element.textContent ?? element.tagName.toUpperCase(),
        30,
      );
      break;

    case 'box': {
      const label = SEMANTIC_LABELS[element.tagName];
      if (label) {
        // Promote to txt so the label is visible
        component.type = 'txt';
        component.props.value = label;
        component.props.align = 'center';
      }
      break;
    }
  }

  // Apply extracted colors
  if (element.colors?.bg) {
    component.props.bg = element.colors.bg;
  }
  if (element.colors?.border) {
    component.props.border = element.colors.border;
  }

  return component;
}

/**
 * Convert multiple grid placements to Components
 */
export function mapAllToComponents(placements: GridPlacement[]): Component[] {
  return placements.map(mapToComponent);
}
