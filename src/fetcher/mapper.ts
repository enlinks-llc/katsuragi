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

  // Add type-specific properties
  switch (componentType) {
    case 'input':
      // Use placeholder as label
      if (element.attributes.placeholder) {
        component.props.label = element.attributes.placeholder;
      }
      break;

    case 'img':
      // Include src and alt if available
      if (element.attributes.src) {
        component.props.src = element.attributes.src;
      }
      if (element.attributes.alt) {
        component.props.alt = element.attributes.alt;
      }
      break;

    case 'btn':
      // Buttons don't include value (as per plan: "テキスト内容は取得しない")
      break;

    case 'txt':
      // Text elements don't include value (as per plan: "txt タイプとして位置のみ記録")
      break;

    case 'box':
      // Plain box, no additional properties
      break;
  }

  return component;
}

/**
 * Convert multiple grid placements to Components
 */
export function mapAllToComponents(placements: GridPlacement[]): Component[] {
  return placements.map(mapToComponent);
}
