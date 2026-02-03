import { describe, expect, test } from 'vitest';
import { TokenType, tokenize } from '../../src/parser/lexer.js';

describe('tokenize', () => {
  describe('metadata tokens', () => {
    test('tokenizes ratio declaration', () => {
      const tokens = tokenize('ratio: 16:9');
      expect(tokens).toEqual([
        { type: TokenType.IDENTIFIER, value: 'ratio' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.RATIO, value: '16:9' },
        { type: TokenType.EOF, value: '' },
      ]);
    });

    test('tokenizes grid declaration', () => {
      const tokens = tokenize('grid: 4x3');
      expect(tokens).toEqual([
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
      expect(tokens).toEqual([
        { type: TokenType.CELL_REF, value: 'A1' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.EOF, value: '' },
      ]);
    });

    test('tokenizes cell range with double dot', () => {
      const tokens = tokenize('A1..B2:');
      expect(tokens).toEqual([
        { type: TokenType.CELL_RANGE, value: 'A1..B2' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.EOF, value: '' },
      ]);
    });
  });

  describe('object literals', () => {
    test('tokenizes simple object with type', () => {
      const tokens = tokenize('{ type: txt }');
      expect(tokens).toEqual([
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
      expect(tokens).toEqual([
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
      expect(tokens).toEqual([
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
      expect(tokens).toEqual([
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
      expect(tokens).toEqual([
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
      expect(tokens).toEqual([
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
      expect(tokens).toEqual([
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
      expect(tokens).toEqual([
        { type: TokenType.NEWLINE, value: '\n' },
        { type: TokenType.IDENTIFIER, value: 'ratio' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.RATIO, value: '16:9' },
        { type: TokenType.EOF, value: '' },
      ]);
    });

    test('ignores end-of-line comments', () => {
      const tokens = tokenize('ratio: 16:9 // aspect ratio');
      expect(tokens).toEqual([
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
      expect(tokens).toEqual([
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
      expect(tokens).toEqual([
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
      expect(tokens).toEqual([
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

  describe('error handling', () => {
    test('throws on unterminated string', () => {
      expect(() => tokenize('{ value: "unterminated }')).toThrow(
        'Unterminated string'
      );
    });

    test('throws on invalid character', () => {
      expect(() => tokenize('ratio: @invalid')).toThrow('Unexpected character');
    });
  });
});
