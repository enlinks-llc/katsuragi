#!/usr/bin/env npx ts-node
/**
 * Token count comparison script for multiple UI patterns
 *
 * Usage:
 *   ANTHROPIC_API_KEY=your-key npx ts-node scripts/count-tokens.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TokenCountResponse {
  input_tokens: number;
}

interface FileResult {
  name: string;
  bytes: number;
  tokens: number;
}

interface PatternResult {
  pattern: string;
  complexity: string;
  description: string;
  files: FileResult[];
}

const PATTERNS = [
  { name: 'login', complexity: 'Simple', description: '4x3 grid, 4 components' },
  { name: 'dashboard', complexity: 'Medium', description: '4x3 grid, 6 components' },
  { name: 'ecommerce', complexity: 'Complex', description: '6x5 grid, 12 components, mixed cell sizes' },
];

const FORMATS = [
  { name: 'Natural Language', suffix: '-natural.txt' },
  { name: 'ASCII Art', suffix: '-ascii.txt' },
  { name: '.kui', suffix: '.kui' },
  { name: 'HTML', suffix: '.html' },
];

async function countTokens(text: string): Promise<number> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages/count_tokens', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      messages: [{ role: 'user', content: text }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as TokenCountResponse;
  return data.input_tokens;
}

async function measurePattern(patternName: string): Promise<FileResult[]> {
  const dir = path.join(__dirname, '../docs/analysis');
  const results: FileResult[] = [];

  for (const format of FORMATS) {
    const fileName = `${patternName}${format.suffix}`;
    const filePath = path.join(dir, fileName);

    if (!fs.existsSync(filePath)) {
      console.error(`  Warning: ${fileName} not found`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const bytes = Buffer.byteLength(content, 'utf-8');
    const tokens = await countTokens(content);
    results.push({ name: format.name, bytes, tokens });
  }

  return results;
}

function printPatternTable(pattern: (typeof PATTERNS)[0], results: FileResult[]) {
  const htmlResult = results.find((r) => r.name === 'HTML');
  const htmlTokens = htmlResult?.tokens ?? 0;

  console.log(`\n### ${pattern.complexity}: ${pattern.name}`);
  console.log(`_${pattern.description}_\n`);
  console.log('| Format | Tokens | vs HTML |');
  console.log('|--------|--------|---------|');

  for (const result of results) {
    const vsHtml =
      result.name === 'HTML'
        ? '—'
        : `-${(((htmlTokens - result.tokens) / htmlTokens) * 100).toFixed(0)}%`;
    console.log(`| ${result.name} | ${result.tokens} | ${vsHtml} |`);
  }
}

function printSummaryTable(allResults: PatternResult[]) {
  console.log('\n## Summary\n');
  console.log('| Pattern | .kui | HTML | Savings |');
  console.log('|---------|------|------|---------|');

  let totalKui = 0,
    totalHtml = 0;

  for (const p of allResults) {
    const kui = p.files.find((f) => f.name === '.kui');
    const html = p.files.find((f) => f.name === 'HTML');
    if (kui && html) {
      const savings = (((html.tokens - kui.tokens) / html.tokens) * 100).toFixed(0);
      console.log(`| ${p.pattern} | ${kui.tokens} | ${html.tokens} | -${savings}% |`);
      totalKui += kui.tokens;
      totalHtml += html.tokens;
    }
  }

  const avg = (((totalHtml - totalKui) / totalHtml) * 100).toFixed(0);
  console.log(`| **Average** | | | **-${avg}%** |`);
}

async function main() {
  console.log('# Token Count Comparison: 3 Patterns\n');
  const allResults: PatternResult[] = [];

  for (const pattern of PATTERNS) {
    console.log(`Measuring ${pattern.name}...`);
    const files = await measurePattern(pattern.name);
    allResults.push({ pattern: pattern.name, complexity: pattern.complexity, description: pattern.description, files });
    printPatternTable(pattern, files);
  }

  printSummaryTable(allResults);
}

main().catch(console.error);
