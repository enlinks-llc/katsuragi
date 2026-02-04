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

  describe('batch conversion', () => {
    test('converts multiple files to SVG', () => {
      const file1 = path.join(tmpDir, 'batch1.kui');
      const file2 = path.join(tmpDir, 'batch2.kui');
      fs.writeFileSync(file1, 'A1: { type: txt, value: "One" }');
      fs.writeFileSync(file2, 'A1: { type: txt, value: "Two" }');

      execSync(`npx tsx src/cli.ts ${file1} ${file2}`, {
        encoding: 'utf-8',
      });

      expect(fs.existsSync(path.join(tmpDir, 'batch1.svg'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'batch2.svg'))).toBe(true);

      const content1 = fs.readFileSync(path.join(tmpDir, 'batch1.svg'), 'utf-8');
      const content2 = fs.readFileSync(path.join(tmpDir, 'batch2.svg'), 'utf-8');
      expect(content1).toContain('One');
      expect(content2).toContain('Two');
    });

    test('converts to PNG with --format png', () => {
      const file1 = path.join(tmpDir, 'formattest.kui');
      fs.writeFileSync(file1, 'A1: { type: box }');

      execSync(`npx tsx src/cli.ts ${file1} -f png`, {
        encoding: 'utf-8',
      });

      const outputPath = path.join(tmpDir, 'formattest.png');
      expect(fs.existsSync(outputPath)).toBe(true);

      const buffer = fs.readFileSync(outputPath);
      expect(buffer[0]).toBe(0x89); // PNG magic
      expect(buffer[1]).toBe(0x50);
    });

    test('outputs to specified directory with -d', () => {
      const outDir = path.join(tmpDir, 'output');
      fs.mkdirSync(outDir, { recursive: true });

      const file1 = path.join(tmpDir, 'dirtest.kui');
      fs.writeFileSync(file1, 'A1: { type: txt, value: "DirTest" }');

      execSync(`npx tsx src/cli.ts ${file1} -d ${outDir}`, {
        encoding: 'utf-8',
      });

      const outputPath = path.join(outDir, 'dirtest.svg');
      expect(fs.existsSync(outputPath)).toBe(true);

      const content = fs.readFileSync(outputPath, 'utf-8');
      expect(content).toContain('DirTest');
    });

    test('outputs PNG to specified directory with -d -f png', () => {
      const outDir = path.join(tmpDir, 'output-png');
      fs.mkdirSync(outDir, { recursive: true });

      const file1 = path.join(tmpDir, 'dirpngtest.kui');
      fs.writeFileSync(file1, 'A1: { type: box }');

      execSync(`npx tsx src/cli.ts ${file1} -d ${outDir} -f png`, {
        encoding: 'utf-8',
      });

      const outputPath = path.join(outDir, 'dirpngtest.png');
      expect(fs.existsSync(outputPath)).toBe(true);

      const buffer = fs.readFileSync(outputPath);
      expect(buffer[0]).toBe(0x89);
    });
  });

  describe('stdin support', () => {
    test('reads from stdin when no file provided', () => {
      const result = execSync(`printf 'ratio: 16:9\ngrid: 2x2\nA1: { type: txt, value: "FromStdin" }' | npx tsx src/cli.ts`, {
        encoding: 'utf-8',
        shell: '/bin/bash',
      });

      expect(result).toContain('<svg');
      expect(result).toContain('FromStdin');
    });

    test('outputs to file when using stdin with -o', () => {
      const outFile = path.join(tmpDir, 'stdin-output.svg');
      execSync(`printf 'ratio: 16:9\ngrid: 2x2\nA1: { type: txt, value: "StdinFile" }' | npx tsx src/cli.ts -o ${outFile}`, {
        encoding: 'utf-8',
        shell: '/bin/bash',
      });

      const content = fs.readFileSync(outFile, 'utf-8');
      expect(content).toContain('<svg');
      expect(content).toContain('StdinFile');
    });

    test('outputs PNG when using stdin with -o .png', () => {
      const outFile = path.join(tmpDir, 'stdin-output.png');
      execSync(`printf 'ratio: 16:9\ngrid: 2x2\nA1: { type: box }' | npx tsx src/cli.ts -o ${outFile}`, {
        encoding: 'utf-8',
        shell: '/bin/bash',
      });

      const buffer = fs.readFileSync(outFile);
      // PNG magic bytes
      expect(buffer[0]).toBe(0x89);
      expect(buffer[1]).toBe(0x50);
    });
  });
});
