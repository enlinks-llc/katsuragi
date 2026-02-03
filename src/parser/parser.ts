import type {
  KuiDocument,
  Metadata,
  Component,
  ComponentType,
  ComponentProps,
  CellRange,
  Align,
  Style,
} from '../types.js';
import { TokenType, tokenize, type Token } from './lexer.js';
import { parseCellRange } from './cellRef.js';

const VALID_COMPONENT_TYPES = new Set<ComponentType>([
  'txt',
  'box',
  'btn',
  'input',
  'img',
]);

const VALID_ALIGNS = new Set<Align>(['left', 'center', 'right']);
const VALID_STYLES = new Set<Style>(['default', 'primary', 'secondary']);

function rangesOverlap(a: CellRange, b: CellRange): boolean {
  // Check if ranges don't overlap (any edge outside)
  const noOverlap =
    a.end.col < b.start.col ||
    b.end.col < a.start.col ||
    a.end.row < b.start.row ||
    b.end.row < a.start.row;
  return !noOverlap;
}

export function parse(input: string): KuiDocument {
  const tokens = tokenize(input);
  let pos = 0;

  const metadata: Metadata = {
    ratio: [16, 9],
    grid: [4, 3],
  };
  const components: Component[] = [];

  function peek(offset = 0): Token {
    return tokens[pos + offset] ?? { type: TokenType.EOF, value: '' };
  }

  function advance(): Token {
    return tokens[pos++] ?? { type: TokenType.EOF, value: '' };
  }

  function skipNewlines(): void {
    while (peek().type === TokenType.NEWLINE) {
      advance();
    }
  }

  function expect(type: TokenType): Token {
    const token = advance();
    if (token.type !== type) {
      throw new Error(`Expected ${type}, got ${token.type}`);
    }
    return token;
  }

  function parseRatio(value: string): [number, number] {
    const parts = value.split(':');
    return [parseInt(parts[0], 10), parseInt(parts[1], 10)];
  }

  function parseGrid(value: string): [number, number] {
    const parts = value.toLowerCase().split('x');
    return [parseInt(parts[0], 10), parseInt(parts[1], 10)];
  }

  function parseProps(): Record<string, string> {
    expect(TokenType.LBRACE);
    skipNewlines();

    const props: Record<string, string> = {};

    while (peek().type !== TokenType.RBRACE) {
      skipNewlines();

      if (peek().type === TokenType.RBRACE) break;

      const key = expect(TokenType.IDENTIFIER).value;
      expect(TokenType.COLON);

      let value: string;
      const nextToken = peek();
      if (nextToken.type === TokenType.STRING) {
        value = advance().value;
      } else if (nextToken.type === TokenType.IDENTIFIER) {
        value = advance().value;
      } else {
        throw new Error(`Unexpected token ${nextToken.type} for property value`);
      }

      props[key] = value;

      skipNewlines();

      if (peek().type === TokenType.COMMA) {
        advance();
        skipNewlines();
      }
    }

    expect(TokenType.RBRACE);
    return props;
  }

  function parseComponent(cellToken: Token): Component {
    const rangeStr =
      cellToken.type === TokenType.CELL_REF
        ? cellToken.value
        : cellToken.value;
    const range = parseCellRange(rangeStr);

    expect(TokenType.COLON);
    skipNewlines();

    const rawProps = parseProps();

    if (!rawProps.type) {
      throw new Error('Component missing type property');
    }

    const componentType = rawProps.type as ComponentType;
    if (!VALID_COMPONENT_TYPES.has(componentType)) {
      throw new Error(`Invalid component type: ${componentType}`);
    }

    // Apply defaults
    const align = (rawProps.align as Align) || 'left';
    const style = (rawProps.style as Style) || 'default';

    // Validate align and style
    if (!VALID_ALIGNS.has(align)) {
      throw new Error(`Invalid align value: ${align}`);
    }
    if (!VALID_STYLES.has(style)) {
      throw new Error(`Invalid style value: ${style}`);
    }

    // Check for overlap with existing components
    for (const existing of components) {
      if (rangesOverlap(existing.range, range)) {
        throw new Error(
          `Cell overlap detected: ${rangeStr} overlaps with existing component`
        );
      }
    }

    // Build props without 'type'
    const props: ComponentProps = {
      value: rawProps.value,
      label: rawProps.label,
      align,
      style,
      src: rawProps.src,
      alt: rawProps.alt,
    };

    return {
      type: componentType,
      range,
      props,
    };
  }

  // Main parsing loop
  while (peek().type !== TokenType.EOF) {
    skipNewlines();
    const token = peek();

    if (token.type === TokenType.EOF) break;

    // Metadata: ratio or grid
    if (token.type === TokenType.IDENTIFIER) {
      const name = advance().value.toLowerCase();
      expect(TokenType.COLON);

      if (name === 'ratio') {
        const ratioToken = expect(TokenType.RATIO);
        metadata.ratio = parseRatio(ratioToken.value);
      } else if (name === 'grid') {
        const gridToken = expect(TokenType.GRID);
        metadata.grid = parseGrid(gridToken.value);
      } else {
        throw new Error(`Unknown metadata: ${name}`);
      }
      continue;
    }

    // Component: cell reference or range
    if (token.type === TokenType.CELL_REF || token.type === TokenType.CELL_RANGE) {
      advance();
      const component = parseComponent(token);
      components.push(component);
      continue;
    }

    // Skip unknown tokens
    advance();
  }

  return { metadata, components };
}
