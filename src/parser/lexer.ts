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
} as const;

export type TokenType = (typeof TokenType)[keyof typeof TokenType];

export interface Token {
  type: TokenType;
  value: string;
}

const CELL_REF_PATTERN = /^[A-Z]\d+$/i;
const CELL_RANGE_PATTERN = /^[A-Z]\d+\.\.[A-Z]\d+$/i;
const RATIO_PATTERN = /^\d+:\d+$/;
const GRID_PATTERN = /^\d+x\d+$/i;

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  let lastWasNewline = false;

  function peek(offset = 0): string {
    return input[pos + offset] ?? '';
  }

  function advance(): string {
    return input[pos++] ?? '';
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

  function readString(quote: string): string {
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
      throw new Error('Unterminated string');
    }
    advance(); // consume closing quote
    return value;
  }

  function readBacktickString(): string {
    advance(); // consume opening backtick
    let value = '';
    while (pos < input.length && peek() !== '`') {
      value += advance();
    }
    if (pos >= input.length) {
      throw new Error('Unterminated string');
    }
    advance(); // consume closing backtick
    return value;
  }

  function readWord(): string {
    let word = '';
    while (
      pos < input.length &&
      /[a-zA-Z0-9_]/.test(peek())
    ) {
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

    // Newline
    if (ch === '\n') {
      advance();
      if (!lastWasNewline) {
        tokens.push({ type: TokenType.NEWLINE, value: '\n' });
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
      tokens.push({ type: TokenType.LBRACE, value: '{' });
      continue;
    }
    if (ch === '}') {
      advance();
      tokens.push({ type: TokenType.RBRACE, value: '}' });
      continue;
    }
    if (ch === ',') {
      advance();
      tokens.push({ type: TokenType.COMMA, value: ',' });
      continue;
    }

    // Strings
    if (ch === '"' || ch === "'") {
      const value = readString(ch);
      tokens.push({ type: TokenType.STRING, value });
      continue;
    }
    if (ch === '`') {
      const value = readBacktickString();
      tokens.push({ type: TokenType.STRING, value });
      continue;
    }

    // Cell reference/range (starts with letter, might have ..)
    if (/[A-Z]/i.test(ch)) {
      const startPos = pos;
      const value = readCellRefOrRange();

      // Check if it's a cell range
      if (CELL_RANGE_PATTERN.test(value)) {
        tokens.push({ type: TokenType.CELL_RANGE, value: value.toUpperCase() });
        continue;
      }
      // Check if it's a cell ref
      if (CELL_REF_PATTERN.test(value)) {
        tokens.push({ type: TokenType.CELL_REF, value: value.toUpperCase() });
        continue;
      }
      // Otherwise it's an identifier - but we need to handle the word properly
      // Reset and read as identifier
      pos = startPos;
      const word = readWord();
      tokens.push({ type: TokenType.IDENTIFIER, value: word });
      continue;
    }

    // Numbers, ratios, grids (after colon)
    if (/[0-9]/.test(ch)) {
      const value = readNumberOrRatioOrGrid();
      if (RATIO_PATTERN.test(value)) {
        tokens.push({ type: TokenType.RATIO, value });
      } else if (GRID_PATTERN.test(value)) {
        tokens.push({ type: TokenType.GRID, value });
      } else {
        tokens.push({ type: TokenType.NUMBER, value });
      }
      continue;
    }

    // Colon
    if (ch === ':') {
      advance();
      tokens.push({ type: TokenType.COLON, value: ':' });
      continue;
    }

    // Unknown character
    throw new Error(`Unexpected character: '${ch}' at position ${pos}`);
  }

  tokens.push({ type: TokenType.EOF, value: '' });
  return tokens;
}
