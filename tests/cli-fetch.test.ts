import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// Note: execSync is used here with hardcoded test strings only, no user input

describe('ktr fetch command', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ktr-fetch-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('shows help for fetch command', () => {
    const result = execSync('npm run dev -- fetch --help 2>&1', {
      encoding: 'utf-8',
    });

    expect(result).toContain('Fetch a webpage and convert to .kui wireframe');
    expect(result).toContain('--output');
    expect(result).toContain('--viewport');
    expect(result).toContain('--grid');
    expect(result).toContain('--ratio');
  });

  it('requires output option', () => {
    try {
      execSync('npm run dev -- fetch https://example.com 2>&1', {
        encoding: 'utf-8',
      });
      expect.fail('Should have thrown');
    } catch (e: unknown) {
      const error = e as { stderr?: string; stdout?: string };
      const output = (error.stderr || error.stdout || '').toString();
      expect(output).toContain("required option '-o, --output <file>'");
    }
  });

  it('validates output file extension', () => {
    const output = path.join(tempDir, 'output.txt');
    try {
      execSync(`npm run dev -- fetch https://example.com -o "${output}" 2>&1`, {
        encoding: 'utf-8',
      });
      expect.fail('Should have thrown');
    } catch (e: unknown) {
      const error = e as { stderr?: string; stdout?: string };
      const out = (error.stderr || error.stdout || '').toString();
      expect(out).toContain('Output file must have .kui extension');
    }
  });

  it('validates viewport option', () => {
    const output = path.join(tempDir, 'output.kui');
    try {
      execSync(
        `npm run dev -- fetch https://example.com -o "${output}" --viewport invalid 2>&1`,
        { encoding: 'utf-8' },
      );
      expect.fail('Should have thrown');
    } catch (e: unknown) {
      const error = e as { stderr?: string; stdout?: string };
      const out = (error.stderr || error.stdout || '').toString();
      expect(out).toContain('Invalid viewport');
    }
  });

  it('validates ratio format', () => {
    const output = path.join(tempDir, 'output.kui');
    try {
      execSync(
        `npm run dev -- fetch https://example.com -o "${output}" --ratio invalid 2>&1`,
        { encoding: 'utf-8' },
      );
      expect.fail('Should have thrown');
    } catch (e: unknown) {
      const error = e as { stderr?: string; stdout?: string };
      const out = (error.stderr || error.stdout || '').toString();
      expect(out).toContain('Invalid ratio format');
    }
  });

  it('validates grid format', () => {
    const output = path.join(tempDir, 'output.kui');
    try {
      execSync(
        `npm run dev -- fetch https://example.com -o "${output}" --grid invalid 2>&1`,
        { encoding: 'utf-8' },
      );
      expect.fail('Should have thrown');
    } catch (e: unknown) {
      const error = e as { stderr?: string; stdout?: string };
      const out = (error.stderr || error.stdout || '').toString();
      expect(out).toContain('Invalid grid format');
    }
  });

  it('rejects invalid URL', () => {
    const output = path.join(tempDir, 'output.kui');
    try {
      execSync(`npm run dev -- fetch not-a-url -o "${output}" 2>&1`, {
        encoding: 'utf-8',
      });
      expect.fail('Should have thrown');
    } catch (e: unknown) {
      const error = e as { stderr?: string; stdout?: string };
      const out = (error.stderr || error.stdout || '').toString();
      expect(out).toContain('Invalid URL format');
    }
  });
});
