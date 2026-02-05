#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Command } from 'commander';
import { convertToPng } from './converter/index.js';
import {
  calculateGrid,
  fetchHtml,
  mapAllToComponents,
  parseGridString,
  parseHtmlToDom,
  type ViewportType,
} from './fetcher/index.js';
import { VERSION } from './index.js';
import { parse } from './parser/index.js';
import { serialize } from './serializer/index.js';
import { generateSvg } from './svg/index.js';
import type { KuiDocument } from './types.js';

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
  format: 'svg' | 'png',
): Promise<void> {
  const kuiContent = fs.readFileSync(inputPath, 'utf-8');
  const doc = parse(kuiContent);
  const basePath = path.dirname(path.resolve(inputPath));
  const svg = generateSvg(doc, basePath);

  const baseName = path.basename(inputPath, '.kui');
  const outputPath = path.join(
    outputDir || path.dirname(inputPath),
    `${baseName}.${format}`,
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
  .version(VERSION);

// Default command for processing .kui files
program
  .argument(
    '[inputs...]',
    '.kui files to process (reads from stdin if omitted)',
  )
  .option(
    '-o, --output <file>',
    'Output file (single file mode, default: stdout)',
  )
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
    if (
      inputs.length === 1 &&
      !options.output &&
      !options.outputDir &&
      format === 'svg'
    ) {
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

// Fetch subcommand
interface FetchOptions {
  output: string;
  grid?: string;
  ratio?: string;
  viewport?: string;
}

const fetchCommand = new Command('fetch')
  .description('Fetch a webpage and convert to .kui wireframe')
  .argument('<url>', 'URL to fetch')
  .requiredOption('-o, --output <file>', 'Output .kui file path')
  .option('--grid <grid>', 'Override grid size (e.g., 4x3)')
  .option('--ratio <ratio>', 'Override aspect ratio (e.g., 16:9)')
  .option(
    '--viewport <viewport>',
    'Target viewport: desktop, mobile, tablet',
    'desktop',
  )
  .action(async (url: string, options: FetchOptions) => {
    try {
      // Validate viewport
      const viewportType = options.viewport as ViewportType;
      if (!['desktop', 'mobile', 'tablet'].includes(viewportType)) {
        console.error(
          `Error: Invalid viewport "${options.viewport}". Use: desktop, mobile, tablet`,
        );
        process.exit(1);
      }

      // Validate output file extension
      if (!options.output.endsWith('.kui')) {
        console.error('Error: Output file must have .kui extension');
        process.exit(1);
      }

      // Parse ratio if provided
      let ratio: [number, number] | undefined;
      if (options.ratio) {
        const match = options.ratio.match(/^(\d+):(\d+)$/);
        if (!match) {
          console.error(
            `Error: Invalid ratio format "${options.ratio}". Use format like 16:9`,
          );
          process.exit(1);
        }
        ratio = [parseInt(match[1], 10), parseInt(match[2], 10)];
      }

      // Parse grid if provided
      let gridOverride: { cols: number; rows: number } | undefined;
      if (options.grid) {
        gridOverride = parseGridString(options.grid) ?? undefined;
        if (!gridOverride) {
          console.error(
            `Error: Invalid grid format "${options.grid}". Use format like 4x3 (max 26x26)`,
          );
          process.exit(1);
        }
      }

      console.error(`Fetching: ${url}`);
      console.error(`Viewport: ${viewportType}`);

      // Fetch HTML
      const result = await fetchHtml(url, { viewport: viewportType });

      // Parse HTML to DOM elements
      const elements = parseHtmlToDom(result.html, result.viewport);

      if (elements.length === 0) {
        console.error('Error: No visual elements found in HTML');
        process.exit(1);
      }

      console.error(`Found ${elements.length} visual elements`);

      // Calculate grid layout
      const gridResult = calculateGrid(elements, result.viewport, gridOverride);

      // Warn if grid was clamped
      if (gridResult.cols === 26 || gridResult.rows === 26) {
        console.error(
          `Warning: Grid size clamped to ${gridResult.cols}x${gridResult.rows} (max 26x26)`,
        );
      }

      // Map to components
      const components = mapAllToComponents(gridResult.placements);

      // Build KuiDocument
      const doc: KuiDocument = {
        metadata: {
          ratio: ratio ?? result.viewport.defaultRatio,
          grid: [gridResult.cols, gridResult.rows],
          gap: 8,
          padding: 16,
        },
        components,
      };

      // Serialize to .kui format
      const kuiContent = serialize(doc, {
        headerComment: `Viewport: ${viewportType}`,
      });

      // Write output file
      fs.writeFileSync(options.output, kuiContent, 'utf-8');
      console.error(`Generated: ${options.output}`);
    } catch (e) {
      if (e instanceof Error) {
        console.error(`Error: ${e.message}`);
      } else {
        console.error('Error: Unknown error occurred');
      }
      process.exit(1);
    }
  });

// Check if we should run fetch subcommand
const shouldRunFetch = process.argv[2] === 'fetch';

if (shouldRunFetch) {
  // Run fetch command with its own argument parsing
  // Shift 'fetch' out and keep the rest
  fetchCommand.parse(['node', 'fetch', ...process.argv.slice(3)]);
} else {
  // Run main program
  program.parse();
}
