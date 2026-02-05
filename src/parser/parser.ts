import type {
  Align,
  CellRange,
  ColorTheme,
  Component,
  ComponentProps,
  ComponentType,
  KuiDocument,
  Metadata,
  SourceLocation,
} from '../types.js';
import { parseCellRange } from './cellRef.js';
import { KuiSyntaxError } from './errors.js';
import { type Token, TokenType, tokenize } from './lexer.js';

const VALID_COMPONENT_TYPES = new Set<ComponentType>([
  'txt',
  'box',
  'btn',
  'input',
  'img',
]);

const VALID_ALIGNS = new Set<Align>(['left', 'center', 'right']);

function rangesOverlap(a: CellRange, b: CellRange): boolean {
  // Check if ranges don't overlap (any edge outside)
  const noOverlap =
    a.end.col < b.start.col ||
    b.end.col < a.start.col ||
    a.end.row < b.start.row ||
    b.end.row < a.start.row;
  return !noOverlap;
}

function validateRangeWithinGrid(
  range: CellRange,
  grid: [number, number],
  rangeStr: string,
  loc: SourceLocation,
  source: string,
): void {
  const [cols, rows] = grid;

  // Check column bounds (0-indexed, so max valid is cols-1)
  if (range.start.col >= cols || range.end.col >= cols) {
    const maxCol = String.fromCharCode('A'.charCodeAt(0) + cols - 1);
    throw new KuiSyntaxError(
      `Cell "${rangeStr}" exceeds column bounds. Grid is ${cols}x${rows}, valid columns: A-${maxCol}`,
      loc,
      source,
    );
  }

  // Check row bounds (0-indexed, so max valid is rows-1)
  if (range.start.row >= rows || range.end.row >= rows) {
    throw new KuiSyntaxError(
      `Cell "${rangeStr}" exceeds row bounds. Grid is ${cols}x${rows}, valid rows: 1-${rows}`,
      loc,
      source,
    );
  }
}

export function parse(input: string): KuiDocument {
  const tokens = tokenize(input);
  let pos = 0;

  const metadata: Metadata = {
    ratio: [16, 9],
    grid: [4, 3],
  };
  const components: Component[] = [];

  const defaultLoc: SourceLocation = { line: 1, column: 1, offset: 0 };

  function peek(offset = 0): Token {
    return (
      tokens[pos + offset] ?? {
        type: TokenType.EOF,
        value: '',
        loc: defaultLoc,
      }
    );
  }

  function advance(): Token {
    return tokens[pos++] ?? { type: TokenType.EOF, value: '', loc: defaultLoc };
  }

  function skipNewlines(): void {
    while (peek().type === TokenType.NEWLINE) {
      advance();
    }
  }

  function syntaxError(message: string, loc: SourceLocation): KuiSyntaxError {
    return new KuiSyntaxError(message, loc, input);
  }

  function expect(type: TokenType): Token {
    const token = advance();
    if (token.type !== type) {
      throw syntaxError(`Expected ${type}, got ${token.type}`, token.loc);
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
      } else if (nextToken.type === TokenType.NUMBER) {
        value = advance().value;
      } else if (nextToken.type === TokenType.HEX_COLOR) {
        value = advance().value;
      } else if (nextToken.type === TokenType.THEME_REF) {
        value = advance().value;
      } else {
        throw syntaxError(
          `Unexpected token ${nextToken.type} for property value`,
          nextToken.loc,
        );
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

  function parseColors(): ColorTheme {
    expect(TokenType.LBRACE);
    skipNewlines();

    const colors: ColorTheme = {};

    while (peek().type !== TokenType.RBRACE) {
      skipNewlines();

      if (peek().type === TokenType.RBRACE) break;

      const key = expect(TokenType.IDENTIFIER).value;
      expect(TokenType.COLON);

      const valueToken = peek();
      let value: string;
      if (valueToken.type === TokenType.HEX_COLOR) {
        value = advance().value;
      } else if (valueToken.type === TokenType.STRING) {
        value = advance().value;
      } else if (valueToken.type === TokenType.IDENTIFIER) {
        // CSS color names like "orange", "lightblue"
        value = advance().value;
      } else {
        throw syntaxError(
          `Expected color value, got ${valueToken.type}`,
          valueToken.loc,
        );
      }

      colors[key] = value;

      skipNewlines();

      if (peek().type === TokenType.COMMA) {
        advance();
        skipNewlines();
      }
    }

    expect(TokenType.RBRACE);
    return colors;
  }

  function resolveColor(
    value: string | undefined,
    colors: ColorTheme | undefined,
    loc: SourceLocation,
  ): string | undefined {
    if (!value) return undefined;
    if (value.startsWith('$')) {
      const name = value.slice(1);
      if (!colors?.[name]) {
        throw syntaxError(`Undefined theme color: ${value}`, loc);
      }
      return colors[name];
    }
    return value;
  }

  function parseComponent(cellToken: Token): Component {
    const rangeStr = cellToken.value;
    const range = parseCellRange(rangeStr);

    expect(TokenType.COLON);
    skipNewlines();

    const rawProps = parseProps();

    if (!rawProps.type) {
      throw syntaxError('Component missing type property', cellToken.loc);
    }

    const componentType = rawProps.type as ComponentType;
    if (!VALID_COMPONENT_TYPES.has(componentType)) {
      throw syntaxError(
        `Invalid component type: ${componentType}`,
        cellToken.loc,
      );
    }

    // Apply defaults
    const align = (rawProps.align as Align) || 'left';

    // Validate align
    if (!VALID_ALIGNS.has(align)) {
      throw syntaxError(`Invalid align value: ${align}`, cellToken.loc);
    }

    // Check for overlap with existing components
    for (const existing of components) {
      if (rangesOverlap(existing.range, range)) {
        throw syntaxError(
          `Cell overlap detected: ${rangeStr} overlaps with existing component`,
          cellToken.loc,
        );
      }
    }

    // Resolve color references
    const bg = resolveColor(rawProps.bg, metadata.colors, cellToken.loc);
    const border = resolveColor(
      rawProps.border,
      metadata.colors,
      cellToken.loc,
    );

    // Build props without 'type'
    const props: ComponentProps = {
      value: rawProps.value,
      label: rawProps.label,
      align,
      bg,
      border,
      src: rawProps.src,
      alt: rawProps.alt,
      padding: rawProps.padding ? parseInt(rawProps.padding, 10) : undefined,
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
      const identToken = advance();
      const name = identToken.value.toLowerCase();
      expect(TokenType.COLON);

      if (name === 'ratio') {
        const ratioToken = expect(TokenType.RATIO);
        metadata.ratio = parseRatio(ratioToken.value);
      } else if (name === 'grid') {
        const gridToken = expect(TokenType.GRID);
        metadata.grid = parseGrid(gridToken.value);
      } else if (name === 'gap') {
        const numToken = expect(TokenType.NUMBER);
        metadata.gap = parseInt(numToken.value, 10);
      } else if (name === 'padding') {
        const numToken = expect(TokenType.NUMBER);
        metadata.padding = parseInt(numToken.value, 10);
      } else if (name === 'colors') {
        metadata.colors = parseColors();
      } else {
        throw syntaxError(`Unknown metadata: ${name}`, identToken.loc);
      }
      continue;
    }

    // Component: cell reference or range
    if (
      token.type === TokenType.CELL_REF ||
      token.type === TokenType.CELL_RANGE
    ) {
      advance();
      const component = parseComponent(token);
      validateRangeWithinGrid(
        component.range,
        metadata.grid,
        token.value,
        token.loc,
        input,
      );
      components.push(component);
      continue;
    }

    // Skip unknown tokens
    advance();
  }

  return { metadata, components };
}
