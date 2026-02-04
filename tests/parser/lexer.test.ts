import { describe, expect, test } from 'vitest';
import { TokenType, tokenize, type Token } from '../../src/parser/lexer.js';

// Helper to extract only type and value from tokens for comparison
function tokensWithoutLoc(tokens: Token[]): { type: string; value: string }[] {
  return tokens.map(({ type, value }) => ({ type, value }));
}

describe('tokenize', () => {
  describe('metadata tokens', () => {
    test('tokenizes ratio declaration', () => {
      const tokens = tokenize('ratio: 16:9');
      expect(tokensWithoutLoc(tokens)).toEqual([
        { type: TokenType.IDENTIFIER, value: 'ratio' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.RATIO, value: '16:9' },
        { type: TokenType.EOF, value: '' },
      ]);
    });

    test('tokenizes grid declaration', () => {
      const tokens = tokenize('grid: 4x3');
      expect(tokensWithoutLoc(tokens)).toEqual([
        { type: TokenType.IDENTIFIER, value: 'grid' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.GRID, value: '4x3' },
        { type: TokenType.EOF, value: '' },
      ]);
    });
  });

  describe('cell references', () => {
    test('tokenizes single cell reference', () => {
      const tokens = tokenize('A1:');
      expect(tokensWithoutLoc(tokens)).toEqual([
        { type: TokenType.CELL_REF, value: 'A1' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.EOF, value: '' },
      ]);
    });

    test('tokenizes cell range with double dot', () => {
      const tokens = tokenize('A1..B2:');
      expect(tokensWithoutLoc(tokens)).toEqual([
        { type: TokenType.CELL_RANGE, value: 'A1..B2' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.EOF, value: '' },
      ]);
    });
  });

  describe('object literals', () => {
    test('tokenizes simple object with type', () => {
      const tokens = tokenize('{ type: txt }');
      expect(tokensWithoutLoc(tokens)).toEqual([
        { type: TokenType.LBRACE, value: '{' },
        { type: TokenType.IDENTIFIER, value: 'type' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.IDENTIFIER, value: 'txt' },
        { type: TokenType.RBRACE, value: '}' },
        { type: TokenType.EOF, value: '' },
      ]);
    });

    test('tokenizes object with multiple properties', () => {
      const tokens = tokenize('{ type: txt, align: center }');
      expect(tokensWithoutLoc(tokens)).toEqual([
        { type: TokenType.LBRACE, value: '{' },
        { type: TokenType.IDENTIFIER, value: 'type' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.IDENTIFIER, value: 'txt' },
        { type: TokenType.COMMA, value: ',' },
        { type: TokenType.IDENTIFIER, value: 'align' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.IDENTIFIER, value: 'center' },
        { type: TokenType.RBRACE, value: '}' },
        { type: TokenType.EOF, value: '' },
      ]);
    });

    test('tokenizes trailing comma', () => {
      const tokens = tokenize('{ type: txt, }');
      expect(tokensWithoutLoc(tokens)).toEqual([
        { type: TokenType.LBRACE, value: '{' },
        { type: TokenType.IDENTIFIER, value: 'type' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.IDENTIFIER, value: 'txt' },
        { type: TokenType.COMMA, value: ',' },
        { type: TokenType.RBRACE, value: '}' },
        { type: TokenType.EOF, value: '' },
      ]);
    });
  });

  describe('strings', () => {
    test('tokenizes double-quoted string', () => {
      const tokens = tokenize('{ value: "Hello" }');
      expect(tokensWithoutLoc(tokens)).toEqual([
        { type: TokenType.LBRACE, value: '{' },
        { type: TokenType.IDENTIFIER, value: 'value' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.STRING, value: 'Hello' },
        { type: TokenType.RBRACE, value: '}' },
        { type: TokenType.EOF, value: '' },
      ]);
    });

    test('tokenizes single-quoted string', () => {
      const tokens = tokenize("{ value: 'Hello' }");
      expect(tokensWithoutLoc(tokens)).toEqual([
        { type: TokenType.LBRACE, value: '{' },
        { type: TokenType.IDENTIFIER, value: 'value' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.STRING, value: 'Hello' },
        { type: TokenType.RBRACE, value: '}' },
        { type: TokenType.EOF, value: '' },
      ]);
    });

    test('tokenizes string with escape sequences', () => {
      const tokens = tokenize('{ value: "Line1\\nLine2" }');
      expect(tokensWithoutLoc(tokens)).toEqual([
        { type: TokenType.LBRACE, value: '{' },
        { type: TokenType.IDENTIFIER, value: 'value' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.STRING, value: 'Line1\nLine2' },
        { type: TokenType.RBRACE, value: '}' },
        { type: TokenType.EOF, value: '' },
      ]);
    });

    test('tokenizes backtick multi-line string', () => {
      const tokens = tokenize('{ value: `line1\nline2` }');
      expect(tokensWithoutLoc(tokens)).toEqual([
        { type: TokenType.LBRACE, value: '{' },
        { type: TokenType.IDENTIFIER, value: 'value' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.STRING, value: 'line1\nline2' },
        { type: TokenType.RBRACE, value: '}' },
        { type: TokenType.EOF, value: '' },
      ]);
    });
  });

  describe('comments', () => {
    test('ignores line comments', () => {
      const tokens = tokenize('// this is a comment\nratio: 16:9');
      expect(tokensWithoutLoc(tokens)).toEqual([
        { type: TokenType.NEWLINE, value: '\n' },
        { type: TokenType.IDENTIFIER, value: 'ratio' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.RATIO, value: '16:9' },
        { type: TokenType.EOF, value: '' },
      ]);
    });

    test('ignores end-of-line comments', () => {
      const tokens = tokenize('ratio: 16:9 // aspect ratio');
      expect(tokensWithoutLoc(tokens)).toEqual([
        { type: TokenType.IDENTIFIER, value: 'ratio' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.RATIO, value: '16:9' },
        { type: TokenType.EOF, value: '' },
      ]);
    });
  });

  describe('newlines', () => {
    test('tokenizes newlines between statements', () => {
      const tokens = tokenize('ratio: 16:9\ngrid: 4x3');
      expect(tokensWithoutLoc(tokens)).toEqual([
        { type: TokenType.IDENTIFIER, value: 'ratio' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.RATIO, value: '16:9' },
        { type: TokenType.NEWLINE, value: '\n' },
        { type: TokenType.IDENTIFIER, value: 'grid' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.GRID, value: '4x3' },
        { type: TokenType.EOF, value: '' },
      ]);
    });

    test('ignores blank lines', () => {
      const tokens = tokenize('ratio: 16:9\n\ngrid: 4x3');
      expect(tokensWithoutLoc(tokens)).toEqual([
        { type: TokenType.IDENTIFIER, value: 'ratio' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.RATIO, value: '16:9' },
        { type: TokenType.NEWLINE, value: '\n' },
        { type: TokenType.IDENTIFIER, value: 'grid' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.GRID, value: '4x3' },
        { type: TokenType.EOF, value: '' },
      ]);
    });
  });

  describe('complete component definition', () => {
    test('tokenizes full component line', () => {
      const tokens = tokenize('A1..B2: { type: txt, value: "Login", align: center }');
      expect(tokensWithoutLoc(tokens)).toEqual([
        { type: TokenType.CELL_RANGE, value: 'A1..B2' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.LBRACE, value: '{' },
        { type: TokenType.IDENTIFIER, value: 'type' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.IDENTIFIER, value: 'txt' },
        { type: TokenType.COMMA, value: ',' },
        { type: TokenType.IDENTIFIER, value: 'value' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.STRING, value: 'Login' },
        { type: TokenType.COMMA, value: ',' },
        { type: TokenType.IDENTIFIER, value: 'align' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.IDENTIFIER, value: 'center' },
        { type: TokenType.RBRACE, value: '}' },
        { type: TokenType.EOF, value: '' },
      ]);
    });
  });

  describe('color tokens', () => {
    test('tokenizes hex color (#RGB)', () => {
      const tokens = tokenize('{ bg: #f00 }');
      expect(tokensWithoutLoc(tokens)).toEqual([
        { type: TokenType.LBRACE, value: '{' },
        { type: TokenType.IDENTIFIER, value: 'bg' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.HEX_COLOR, value: '#f00' },
        { type: TokenType.RBRACE, value: '}' },
        { type: TokenType.EOF, value: '' },
      ]);
    });

    test('tokenizes hex color (#RRGGBB)', () => {
      const tokens = tokenize('{ bg: #3B82F6 }');
      expect(tokensWithoutLoc(tokens)).toEqual([
        { type: TokenType.LBRACE, value: '{' },
        { type: TokenType.IDENTIFIER, value: 'bg' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.HEX_COLOR, value: '#3B82F6' },
        { type: TokenType.RBRACE, value: '}' },
        { type: TokenType.EOF, value: '' },
      ]);
    });

    test('tokenizes theme reference', () => {
      const tokens = tokenize('{ bg: $primary }');
      expect(tokensWithoutLoc(tokens)).toEqual([
        { type: TokenType.LBRACE, value: '{' },
        { type: TokenType.IDENTIFIER, value: 'bg' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.THEME_REF, value: '$primary' },
        { type: TokenType.RBRACE, value: '}' },
        { type: TokenType.EOF, value: '' },
      ]);
    });

    test('throws on invalid hex color', () => {
      expect(() => tokenize('{ bg: #f0 }')).toThrow(/Invalid hex color/);
    });

    test('throws on invalid hex color (5 digits)', () => {
      expect(() => tokenize('{ bg: #12345 }')).toThrow(/Invalid hex color/);
    });

    test('throws on empty theme reference', () => {
      expect(() => tokenize('{ bg: $ }')).toThrow(/Invalid theme reference/);
    });
  });

  describe('error handling', () => {
    test('throws on unterminated string', () => {
      expect(() => tokenize('{ value: "unterminated }')).toThrow(
        /Unterminated string at 1:\d+/
      );
    });

    test('throws on invalid character', () => {
      expect(() => tokenize('ratio: @invalid')).toThrow(/Unexpected character.*at 1:\d+/);
    });
  });

  describe('location tracking', () => {
    test('tracks line and column for tokens', () => {
      const tokens = tokenize('ratio: 16:9');
      expect(tokens[0].loc).toEqual({ line: 1, column: 1, offset: 0 });
      expect(tokens[1].loc).toEqual({ line: 1, column: 6, offset: 5 });
      expect(tokens[2].loc).toEqual({ line: 1, column: 8, offset: 7 });
    });

    test('tracks line numbers across newlines', () => {
      const tokens = tokenize('ratio: 16:9\ngrid: 4x3');
      // First line
      expect(tokens[0].loc.line).toBe(1);
      // Newline token
      expect(tokens[3].loc.line).toBe(1);
      // Second line
      expect(tokens[4].loc.line).toBe(2);
      expect(tokens[4].loc.column).toBe(1);
    });

    test('error includes line number for multi-line input', () => {
      const input = 'ratio: 16:9\nA1: { type: txt, value: "unterminated';
      expect(() => tokenize(input)).toThrow(/at 2:\d+/);
    });
  });
});
