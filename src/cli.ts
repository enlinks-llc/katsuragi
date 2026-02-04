#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse } from './parser/index.js';
import { generateSvg } from './svg/index.js';
import { convertToPng } from './converter/index.js';
import { VERSION } from './index.js';

const program = new Command();

async function readFromStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

async function processFile(
  inputPath: string,
  outputDir: string | undefined,
  format: 'svg' | 'png'
): Promise<void> {
  const kuiContent = fs.readFileSync(inputPath, 'utf-8');
  const doc = parse(kuiContent);
  const basePath = path.dirname(path.resolve(inputPath));
  const svg = generateSvg(doc, basePath);

  const baseName = path.basename(inputPath, '.kui');
  const outputPath = path.join(
    outputDir || path.dirname(inputPath),
    `${baseName}.${format}`
  );

  if (format === 'png') {
    const pngBuffer = await convertToPng(svg);
    fs.writeFileSync(outputPath, pngBuffer);
  } else {
    fs.writeFileSync(outputPath, svg, 'utf-8');
  }

  console.log(`Generated: ${outputPath}`);
}

interface CliOptions {
  output?: string;
  outputDir?: string;
  format?: string;
}

program
  .name('katsuragi')
  .description('Text-based UI wireframe generator')
  .version(VERSION)
  .argument('[inputs...]', '.kui files to process (reads from stdin if omitted)')
  .option('-o, --output <file>', 'Output file (single file mode, default: stdout)')
  .option('-d, --output-dir <dir>', 'Output directory for batch conversion')
  .option('-f, --format <format>', 'Output format: svg or png', 'svg')
  .action(async (inputs: string[], options: CliOptions) => {
    const format = (options.format === 'png' ? 'png' : 'svg') as 'svg' | 'png';

    // Stdin mode: no input files
    if (inputs.length === 0) {
      if (process.stdin.isTTY) {
        console.error('Error: No input file specified and stdin is a terminal');
        console.error('Usage: katsuragi <file.kui> or echo "..." | katsuragi');
        process.exit(1);
      }

      const kuiContent = await readFromStdin();
      const doc = parse(kuiContent);
      // No basePath for stdin - image embedding will use placeholders
      const svg = generateSvg(doc);

      if (options.output) {
        const ext = path.extname(options.output).toLowerCase();
        if (ext === '.png') {
          const pngBuffer = await convertToPng(svg);
          fs.writeFileSync(options.output, pngBuffer);
        } else {
          fs.writeFileSync(options.output, svg, 'utf-8');
        }
      } else {
        process.stdout.write(svg);
      }
      return;
    }

    // Single file with -o: original behavior
    if (inputs.length === 1 && options.output) {
      const input = inputs[0];
      if (!fs.existsSync(input)) {
        console.error(`Error: File not found: ${input}`);
        process.exit(1);
      }

      const kuiContent = fs.readFileSync(input, 'utf-8');
      const doc = parse(kuiContent);
      const basePath = path.dirname(path.resolve(input));
      const svg = generateSvg(doc, basePath);

      const ext = path.extname(options.output).toLowerCase();
      if (ext === '.png') {
        const pngBuffer = await convertToPng(svg);
        fs.writeFileSync(options.output, pngBuffer);
      } else {
        fs.writeFileSync(options.output, svg, 'utf-8');
      }
      return;
    }

    // Single file without -o, -d, or -f png: output to stdout
    if (inputs.length === 1 && !options.output && !options.outputDir && format === 'svg') {
      const input = inputs[0];
      if (!fs.existsSync(input)) {
        console.error(`Error: File not found: ${input}`);
        process.exit(1);
      }

      const kuiContent = fs.readFileSync(input, 'utf-8');
      const doc = parse(kuiContent);
      const basePath = path.dirname(path.resolve(input));
      const svg = generateSvg(doc, basePath);
      process.stdout.write(svg);
      return;
    }

    // Batch mode: multiple files, or single file with -d or -f png
    for (const input of inputs) {
      if (!fs.existsSync(input)) {
        console.error(`Warning: File not found: ${input}`);
        continue;
      }
      await processFile(input, options.outputDir, format);
    }
  });

program.parse();
