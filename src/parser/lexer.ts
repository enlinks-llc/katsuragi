import type { SourceLocation } from '../types.js';

export const TokenType = {
  IDENTIFIER: 'IDENTIFIER',
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  COLON: 'COLON',
  COMMA: 'COMMA',
  LBRACE: 'LBRACE',
  RBRACE: 'RBRACE',
  CELL_REF: 'CELL_REF',
  CELL_RANGE: 'CELL_RANGE',
  RATIO: 'RATIO',
  GRID: 'GRID',
  NEWLINE: 'NEWLINE',
  EOF: 'EOF',
  HEX_COLOR: 'HEX_COLOR',
  THEME_REF: 'THEME_REF',
} as const;

export type TokenType = (typeof TokenType)[keyof typeof TokenType];

export interface Token {
  type: TokenType;
  value: string;
  loc: SourceLocation;
}

const CELL_REF_PATTERN = /^[A-Z]\d+$/i;
const CELL_RANGE_PATTERN = /^[A-Z]\d+\.\.[A-Z]\d+$/i;
const RATIO_PATTERN = /^\d+:\d+$/;
const GRID_PATTERN = /^\d+x\d+$/i;

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  let line = 1;
  let column = 1;
  let lastWasNewline = false;

  function peek(offset = 0): string {
    return input[pos + offset] ?? '';
  }

  function advance(): string {
    const ch = input[pos++] ?? '';
    if (ch === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
    return ch;
  }

  function currentLocation(): SourceLocation {
    return { line, column, offset: pos };
  }

  function skipWhitespace(): void {
    while (pos < input.length && (peek() === ' ' || peek() === '\t')) {
      advance();
    }
  }

  function skipComment(): void {
    if (peek() === '/' && peek(1) === '/') {
      while (pos < input.length && peek() !== '\n') {
        advance();
      }
    }
  }

  function readString(quote: string, startLoc: SourceLocation): string {
    advance(); // consume opening quote
    let value = '';
    while (pos < input.length && peek() !== quote) {
      if (peek() === '\\') {
        advance(); // consume backslash
        const escaped = advance();
        switch (escaped) {
          case 'n':
            value += '\n';
            break;
          case 't':
            value += '\t';
            break;
          case 'r':
            value += '\r';
            break;
          case '\\':
            value += '\\';
            break;
          case '"':
            value += '"';
            break;
          case "'":
            value += "'";
            break;
          default:
            value += escaped;
        }
      } else {
        value += advance();
      }
    }
    if (pos >= input.length) {
      throw new Error(
        `Unterminated string at ${startLoc.line}:${startLoc.column}`,
      );
    }
    advance(); // consume closing quote
    return value;
  }

  function readBacktickString(startLoc: SourceLocation): string {
    advance(); // consume opening backtick
    let value = '';
    while (pos < input.length && peek() !== '`') {
      value += advance();
    }
    if (pos >= input.length) {
      throw new Error(
        `Unterminated string at ${startLoc.line}:${startLoc.column}`,
      );
    }
    advance(); // consume closing backtick
    return value;
  }

  function readWord(): string {
    let word = '';
    while (pos < input.length && /[a-zA-Z0-9_]/.test(peek())) {
      word += advance();
    }
    return word;
  }

  function readCellRefOrRange(): string {
    let value = '';
    // Read first cell ref (e.g., A1)
    while (pos < input.length && /[A-Za-z0-9]/.test(peek())) {
      value += advance();
    }
    // Check for range (..)
    if (peek() === '.' && peek(1) === '.') {
      value += advance(); // first dot
      value += advance(); // second dot
      // Read second cell ref
      while (pos < input.length && /[A-Za-z0-9]/.test(peek())) {
        value += advance();
      }
    }
    return value;
  }

  function readNumberOrRatioOrGrid(): string {
    let value = '';
    while (pos < input.length && /[0-9:x]/i.test(peek())) {
      value += advance();
    }
    return value;
  }

  while (pos < input.length) {
    skipWhitespace();
    skipComment();

    if (pos >= input.length) break;

    const ch = peek();
    const loc = currentLocation();

    // Newline
    if (ch === '\n') {
      const newlineLoc = currentLocation();
      advance();
      if (!lastWasNewline) {
        tokens.push({ type: TokenType.NEWLINE, value: '\n', loc: newlineLoc });
        lastWasNewline = true;
      }
      continue;
    }
    lastWasNewline = false;

    // Skip carriage return
    if (ch === '\r') {
      advance();
      continue;
    }

    // Punctuation
    if (ch === '{') {
      advance();
      tokens.push({ type: TokenType.LBRACE, value: '{', loc });
      continue;
    }
    if (ch === '}') {
      advance();
      tokens.push({ type: TokenType.RBRACE, value: '}', loc });
      continue;
    }
    if (ch === ',') {
      advance();
      tokens.push({ type: TokenType.COMMA, value: ',', loc });
      continue;
    }

    // Strings
    if (ch === '"' || ch === "'") {
      const value = readString(ch, loc);
      tokens.push({ type: TokenType.STRING, value, loc });
      continue;
    }
    if (ch === '`') {
      const value = readBacktickString(loc);
      tokens.push({ type: TokenType.STRING, value, loc });
      continue;
    }

    // Hex color (#RGB or #RRGGBB)
    if (ch === '#') {
      let value = '#';
      advance(); // consume #
      while (pos < input.length && /[0-9A-Fa-f]/.test(peek())) {
        value += advance();
      }
      const hex = value.slice(1);
      if (!/^[0-9A-Fa-f]{3}$/.test(hex) && !/^[0-9A-Fa-f]{6}$/.test(hex)) {
        throw new Error(
          `Invalid hex color: ${value} at ${loc.line}:${loc.column}`,
        );
      }
      tokens.push({ type: TokenType.HEX_COLOR, value, loc });
      continue;
    }

    // Theme reference ($name)
    if (ch === '$') {
      let value = '$';
      advance(); // consume $
      while (pos < input.length && /[a-zA-Z0-9_]/.test(peek())) {
        value += advance();
      }
      if (value.length === 1) {
        throw new Error(`Invalid theme reference at ${loc.line}:${loc.column}`);
      }
      tokens.push({ type: TokenType.THEME_REF, value, loc });
      continue;
    }

    // Cell reference/range (starts with letter, might have ..)
    if (/[A-Z]/i.test(ch)) {
      const startPos = pos;
      const startLine = line;
      const startColumn = column;
      const value = readCellRefOrRange();
      const startLoc = {
        line: startLine,
        column: startColumn,
        offset: startPos,
      };

      // Check if it's a cell range
      if (CELL_RANGE_PATTERN.test(value)) {
        tokens.push({
          type: TokenType.CELL_RANGE,
          value: value.toUpperCase(),
          loc: startLoc,
        });
        continue;
      }
      // Check if it's a cell ref
      if (CELL_REF_PATTERN.test(value)) {
        tokens.push({
          type: TokenType.CELL_REF,
          value: value.toUpperCase(),
          loc: startLoc,
        });
        continue;
      }
      // Otherwise it's an identifier - but we need to handle the word properly
      // Reset and read as identifier
      pos = startPos;
      line = startLine;
      column = startColumn;
      const word = readWord();
      tokens.push({ type: TokenType.IDENTIFIER, value: word, loc: startLoc });
      continue;
    }

    // Numbers, ratios, grids (after colon)
    if (/[0-9]/.test(ch)) {
      const value = readNumberOrRatioOrGrid();
      if (RATIO_PATTERN.test(value)) {
        tokens.push({ type: TokenType.RATIO, value, loc });
      } else if (GRID_PATTERN.test(value)) {
        tokens.push({ type: TokenType.GRID, value, loc });
      } else {
        tokens.push({ type: TokenType.NUMBER, value, loc });
      }
      continue;
    }

    // Colon
    if (ch === ':') {
      advance();
      tokens.push({ type: TokenType.COLON, value: ':', loc });
      continue;
    }

    // Unknown character
    throw new Error(
      `Unexpected character: '${ch}' at ${loc.line}:${loc.column}`,
    );
  }

  tokens.push({ type: TokenType.EOF, value: '', loc: currentLocation() });
  return tokens;
}
