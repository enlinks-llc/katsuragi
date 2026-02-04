import { describe, expect, test } from 'vitest';
import { parse, KuiSyntaxError } from '../../src/parser/index.js';

describe('KuiSyntaxError', () => {
  describe('error messages include location', () => {
    test('includes line number for unterminated string', () => {
      const input = 'ratio: 16:9\nA1: { type: txt, value: "unterminated';
      expect(() => parse(input)).toThrow(/at 2:\d+/);
    });

    test('includes column for invalid character', () => {
      const input = 'ratio: @invalid';
      expect(() => parse(input)).toThrow(/at 1:8/);
    });

    test('includes location for missing type property', () => {
      const input = 'A1: { value: "test" }';
      expect(() => parse(input)).toThrow(/at 1:1/);
    });

    test('includes location for invalid component type', () => {
      const input = 'A1: { type: invalid }';
      expect(() => parse(input)).toThrow(/at 1:1/);
    });

    test('includes location for cell overlap', () => {
      const input = 'A1: { type: box }\nA1: { type: txt }';
      expect(() => parse(input)).toThrow(/at 2:1/);
    });

    test('includes location for out of bounds cell', () => {
      const input = 'grid: 2x2\nC1: { type: box }';
      expect(() => parse(input)).toThrow(/at 2:1/);
    });
  });

  describe('format method', () => {
    test('formats error with source context', () => {
      const input = 'ratio: 16:9\nA1: { type: invalid }';
      try {
        parse(input);
        expect.fail('Should have thrown');
      } catch (e) {
        if (e instanceof KuiSyntaxError) {
          const formatted = e.format();
          expect(formatted).toContain('Invalid component type');
          expect(formatted).toContain('A1: { type: invalid }');
          expect(formatted).toContain('^');
        } else {
          throw e;
        }
      }
    });
  });
});
