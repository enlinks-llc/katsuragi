import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  resolveImagePath,
  loadImageAsDataUri,
} from '../../src/utils/image.js';

describe('image utilities', () => {
  let tmpDir: string;
  let testPngPath: string;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'katsuragi-img-test-'));

    // Create a minimal valid PNG file (1x1 transparent pixel)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
      0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, // CRC
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, // IEND chunk
      0x42, 0x60, 0x82,
    ]);
    testPngPath = path.join(tmpDir, 'test.png');
    fs.writeFileSync(testPngPath, pngBuffer);
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('resolveImagePath', () => {
    test('returns absolute path as-is', () => {
      const absPath = '/absolute/path/to/image.png';
      expect(resolveImagePath(absPath, '/some/base')).toBe(absPath);
    });

    test('allows absolute path without basePath', () => {
      const absPath = '/absolute/path/to/image.png';
      expect(resolveImagePath(absPath)).toBe(absPath);
    });

    test('resolves relative path with basePath', () => {
      const resolved = resolveImagePath('./image.png', '/base/path');
      expect(resolved).toBe('/base/path/image.png');
    });

    test('throws when relative path has no basePath', () => {
      expect(() => resolveImagePath('./image.png')).toThrow(/base path/i);
    });

    test('throws on path traversal attack', () => {
      expect(() => resolveImagePath('../../../etc/passwd', '/base/path')).toThrow(/escapes base directory/i);
    });

    // Edge cases
    test('resolves relative path without ./ prefix', () => {
      const resolved = resolveImagePath('subdir/image.png', '/base/path');
      expect(resolved).toBe('/base/path/subdir/image.png');
    });

    test('allows intermediate .. that stays within basePath', () => {
      const resolved = resolveImagePath('foo/../bar/image.png', '/base/path');
      expect(resolved).toBe('/base/path/bar/image.png');
    });

    test('throws on sneaky traversal with intermediate ..', () => {
      expect(() => resolveImagePath('./foo/../../etc/passwd', '/base/path')).toThrow(/escapes base directory/i);
    });

    test('handles basePath with trailing slash', () => {
      const resolved = resolveImagePath('./image.png', '/base/path/');
      expect(resolved).toBe('/base/path/image.png');
    });

    test('resolves to basePath itself with . path', () => {
      const resolved = resolveImagePath('.', '/base/path');
      expect(resolved).toBe('/base/path');
    });

    test('throws on single .. traversal', () => {
      expect(() => resolveImagePath('..', '/base/path')).toThrow(/escapes base directory/i);
    });
  });

  describe('loadImageAsDataUri', () => {
    test('loads PNG as data URI', () => {
      const result = loadImageAsDataUri(testPngPath);
      expect(result.dataUri).toMatch(/^data:image\/png;base64,/);
    });

    test('throws on unsupported format', () => {
      const txtPath = path.join(tmpDir, 'test.txt');
      fs.writeFileSync(txtPath, 'not an image');
      expect(() => loadImageAsDataUri(txtPath)).toThrow(/unsupported/i);
    });

    test('throws on missing file', () => {
      expect(() => loadImageAsDataUri('/nonexistent/image.png')).toThrow(/not found/i);
    });
  });
});
