import type {
  CellCoord,
  CellRange,
  Component,
  ComponentProps,
  KuiDocument,
} from '../types.js';

/**
 * Convert a 0-indexed column to letter (0 -> A, 1 -> B, ..., 25 -> Z)
 */
function colToLetter(col: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + col);
}

/**
 * Convert a CellCoord to cell reference string (e.g., { col: 0, row: 0 } -> "A1")
 */
export function coordToRef(coord: CellCoord): string {
  return `${colToLetter(coord.col)}${coord.row + 1}`;
}

/**
 * Convert a CellRange to range string (e.g., "A1..B2" or "A1" for single cell)
 */
export function rangeToString(range: CellRange): string {
  const startRef = coordToRef(range.start);
  const endRef = coordToRef(range.end);

  // Single cell: A1 instead of A1..A1
  if (range.start.col === range.end.col && range.start.row === range.end.row) {
    return startRef;
  }

  return `${startRef}..${endRef}`;
}

/**
 * Escape special characters in a string value
 */
function escapeString(value: string): string {
  // Check if value contains newlines - use backtick syntax
  if (value.includes('\n')) {
    return `\`${value}\``;
  }
  // Escape double quotes and backslashes
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

/**
 * Serialize component properties to string format
 */
function serializeProps(type: string, props: ComponentProps): string {
  const parts: string[] = [`type: ${type}`];

  if (props.value !== undefined) {
    parts.push(`value: ${escapeString(props.value)}`);
  }
  if (props.label !== undefined) {
    parts.push(`label: ${escapeString(props.label)}`);
  }
  if (props.align !== undefined && props.align !== 'left') {
    parts.push(`align: ${props.align}`);
  }
  if (props.bg !== undefined) {
    parts.push(`bg: "${props.bg}"`);
  }
  if (props.border !== undefined) {
    parts.push(`border: "${props.border}"`);
  }
  if (props.src !== undefined) {
    parts.push(`src: ${escapeString(props.src)}`);
  }
  if (props.alt !== undefined) {
    parts.push(`alt: ${escapeString(props.alt)}`);
  }
  if (props.padding !== undefined) {
    parts.push(`padding: ${props.padding}`);
  }

  return `{ ${parts.join(', ')} }`;
}

/**
 * Serialize a component to a .kui line
 */
function serializeComponent(component: Component): string {
  const rangeStr = rangeToString(component.range);
  const propsStr = serializeProps(component.type, component.props);
  return `${rangeStr}: ${propsStr}`;
}

export interface SerializeOptions {
  /** Comment to add at the top of the file */
  headerComment?: string;
}

/**
 * Serialize a KuiDocument to a .kui file string
 */
export function serialize(
  doc: KuiDocument,
  options: SerializeOptions = {},
): string {
  const lines: string[] = [];

  // Header comment
  if (options.headerComment) {
    lines.push(`// ${options.headerComment}`);
  }

  // Metadata
  const { ratio, grid, gap, padding, colors, colWidths, rowHeights, theme } = doc.metadata;
  lines.push(`ratio: ${ratio[0]}:${ratio[1]}`);
  lines.push(`grid: ${grid[0]}x${grid[1]}`);

  if (theme) {
    lines.push(`theme: ${theme}`);
  }

  if (colWidths) {
    lines.push(`col-widths: [${colWidths.join(', ')}]`);
  }

  if (rowHeights) {
    lines.push(`row-heights: [${rowHeights.join(', ')}]`);
  }

  if (gap !== undefined && gap > 0) {
    lines.push(`gap: ${gap}`);
  }

  if (padding !== undefined && padding > 0) {
    lines.push(`padding: ${padding}`);
  }

  if (colors && Object.keys(colors).length > 0) {
    const colorParts = Object.entries(colors)
      .map(([name, value]) => `${name}: "${value}"`)
      .join(', ');
    lines.push(`colors: { ${colorParts} }`);
  }

  // Blank line before components
  if (doc.components.length > 0) {
    lines.push('');
  }

  // Components
  for (const component of doc.components) {
    lines.push(serializeComponent(component));
  }

  // Final newline
  lines.push('');

  return lines.join('\n');
}
