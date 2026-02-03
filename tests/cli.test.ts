import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('CLI', () => {
  let tmpDir: string;
  let kuiFile: string;

  beforeAll(() => {
    // Create temp directory and test file
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'katsuragi-test-'));
    kuiFile = path.join(tmpDir, 'test.kui');
    fs.writeFileSync(
      kuiFile,
      `ratio: 16:9
grid: 4x3

A1..D1: { type: txt, value: "Test", align: center }
`
    );
  });

  afterAll(() => {
    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('outputs SVG to stdout by default', () => {
    const result = execSync(`npx tsx src/cli.ts ${kuiFile}`, {
      encoding: 'utf-8',
    });

    expect(result).toContain('<?xml version="1.0"');
    expect(result).toContain('<svg');
    expect(result).toContain('Test');
    expect(result).toContain('</svg>');
  });

  test('outputs SVG to file with -o flag', () => {
    const outFile = path.join(tmpDir, 'output.svg');
    execSync(`npx tsx src/cli.ts ${kuiFile} -o ${outFile}`, {
      encoding: 'utf-8',
    });

    const content = fs.readFileSync(outFile, 'utf-8');
    expect(content).toContain('<?xml version="1.0"');
    expect(content).toContain('<svg');
  });

  test('auto-detects PNG from .png extension', () => {
    const outFile = path.join(tmpDir, 'output.png');
    execSync(`npx tsx src/cli.ts ${kuiFile} -o ${outFile}`, {
      encoding: 'utf-8',
    });

    const buffer = fs.readFileSync(outFile);
    // PNG magic bytes
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50);
    expect(buffer[2]).toBe(0x4e);
    expect(buffer[3]).toBe(0x47);
  });

  test('shows version with --version', () => {
    const result = execSync('npx tsx src/cli.ts --version', {
      encoding: 'utf-8',
    });
    expect(result.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('shows help with --help', () => {
    const result = execSync('npx tsx src/cli.ts --help', {
      encoding: 'utf-8',
    });
    expect(result).toContain('Usage:');
    expect(result).toContain('katsuragi');
  });

  test('errors on missing input file', () => {
    expect(() => {
      execSync('npx tsx src/cli.ts nonexistent.kui 2>&1', {
        encoding: 'utf-8',
      });
    }).toThrow();
  });
});
