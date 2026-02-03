#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse } from './parser/index.js';
import { generateSvg } from './svg/index.js';
import { convertToPng } from './converter/index.js';
import { VERSION } from './index.js';

const program = new Command();

program
  .name('katsuragi')
  .description('Text-based UI wireframe generator')
  .version(VERSION)
  .argument('<input>', '.kui file to process')
  .option('-o, --output <file>', 'Output file (default: stdout)')
  .action(async (input: string, options: { output?: string }) => {
    // Read input file
    if (!fs.existsSync(input)) {
      console.error(`Error: File not found: ${input}`);
      process.exit(1);
    }

    const kuiContent = fs.readFileSync(input, 'utf-8');

    // Parse and generate
    const doc = parse(kuiContent);
    const svg = generateSvg(doc);

    // Output
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
  });

program.parse();
