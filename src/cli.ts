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
import { generateHtml } from './html/index.js';
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
  format: 'svg' | 'png' | 'html',
): Promise<void> {
  const kuiContent = fs.readFileSync(inputPath, 'utf-8');
  const doc = parse(kuiContent);
  const basePath = path.dirname(path.resolve(inputPath));

  const baseName = path.basename(inputPath, '.kui');
  const outputPath = path.join(
    outputDir || path.dirname(inputPath),
    `${baseName}.${format}`,
  );

  if (format === 'html') {
    const html = generateHtml(doc);
    fs.writeFileSync(outputPath, html, 'utf-8');
  } else if (format === 'png') {
    const svg = generateSvg(doc, basePath);
    const pngBuffer = await convertToPng(svg);
    fs.writeFileSync(outputPath, pngBuffer);
  } else {
    const svg = generateSvg(doc, basePath);
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
  .option('-f, --format <format>', 'Output format: svg, png, or html', 'svg')
  .action(async (inputs: string[], options: CliOptions) => {
    const validFormats = ['svg', 'png', 'html'] as const;
    type Format = (typeof validFormats)[number];
    const format: Format = validFormats.includes(options.format as Format)
      ? (options.format as Format)
      : 'svg';

    // Stdin mode: no input files
    if (inputs.length === 0) {
      if (process.stdin.isTTY) {
        console.error('Error: No input file specified and stdin is a terminal');
        console.error('Usage: katsuragi <file.kui> or echo "..." | katsuragi');
        process.exit(1);
      }

      const kuiContent = await readFromStdin();
      const doc = parse(kuiContent);

      if (options.output) {
        const ext = path.extname(options.output).toLowerCase();
        if (ext === '.html') {
          fs.writeFileSync(options.output, generateHtml(doc), 'utf-8');
        } else if (ext === '.png') {
          const pngBuffer = await convertToPng(generateSvg(doc));
          fs.writeFileSync(options.output, pngBuffer);
        } else {
          fs.writeFileSync(options.output, generateSvg(doc), 'utf-8');
        }
      } else {
        if (format === 'html') {
          process.stdout.write(generateHtml(doc));
        } else {
          process.stdout.write(generateSvg(doc));
        }
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

      const ext = path.extname(options.output).toLowerCase();
      if (ext === '.html') {
        fs.writeFileSync(options.output, generateHtml(doc), 'utf-8');
      } else if (ext === '.png') {
        const pngBuffer = await convertToPng(generateSvg(doc, basePath));
        fs.writeFileSync(options.output, pngBuffer);
      } else {
        fs.writeFileSync(options.output, generateSvg(doc, basePath), 'utf-8');
      }
      return;
    }

    // Single file without -o or -d, and text format: output to stdout
    if (
      inputs.length === 1 &&
      !options.output &&
      !options.outputDir &&
      (format === 'svg' || format === 'html')
    ) {
      const input = inputs[0];
      if (!fs.existsSync(input)) {
        console.error(`Error: File not found: ${input}`);
        process.exit(1);
      }

      const kuiContent = fs.readFileSync(input, 'utf-8');
      const doc = parse(kuiContent);
      const basePath = path.dirname(path.resolve(input));
      if (format === 'html') {
        process.stdout.write(generateHtml(doc));
      } else {
        process.stdout.write(generateSvg(doc, basePath));
      }
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
  maxElements?: string;
  maxDepth?: string;
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
  .option('--max-elements <n>', 'Maximum number of elements to extract', '50')
  .option('--max-depth <n>', 'Maximum DOM nesting depth', '4')
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

      // Parse and validate max-elements and max-depth
      let maxElements: number | undefined;
      if (options.maxElements) {
        maxElements = parseInt(options.maxElements, 10);
        if (Number.isNaN(maxElements) || maxElements < 1) {
          console.error(
            `Error: Invalid --max-elements value "${options.maxElements}". Must be a positive integer.`,
          );
          process.exit(1);
        }
      }

      let maxDepth: number | undefined;
      if (options.maxDepth) {
        maxDepth = parseInt(options.maxDepth, 10);
        if (Number.isNaN(maxDepth) || maxDepth < 1) {
          console.error(
            `Error: Invalid --max-depth value "${options.maxDepth}". Must be a positive integer.`,
          );
          process.exit(1);
        }
      }

      // Parse HTML to DOM elements
      const parseOptions = { maxElements, maxDepth };
      const parseResult = parseHtmlToDom(result.html, result.viewport, parseOptions);

      if (parseResult.elements.length === 0) {
        console.error('Error: No visual elements found in HTML');
        process.exit(1);
      }

      console.error(`Found ${parseResult.elements.length} visual elements`);

      // Calculate grid layout
      const gridResult = calculateGrid(parseResult.elements, result.viewport, gridOverride);

      // Warn if grid was clamped
      if (gridResult.cols === 26 || gridResult.rows === 26) {
        console.error(
          `Warning: Grid size clamped to ${gridResult.cols}x${gridResult.rows} (max 26x26)`,
        );
      }

      // Map to components
      const components = mapAllToComponents(gridResult.placements);

      // Build KuiDocument
      const colors = parseResult.themeColor
        ? { primary: parseResult.themeColor }
        : undefined;

      const doc: KuiDocument = {
        metadata: {
          ratio: ratio ?? result.viewport.defaultRatio,
          grid: [gridResult.cols, gridResult.rows],
          gap: 8,
          padding: 16,
          colors,
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

// Watch subcommand
interface WatchOptions {
  port: string;
  open: boolean;
  format: string;
}

const watchCommand = new Command('watch')
  .description('Watch a .kui file and live preview in browser')
  .argument('<input>', 'Input .kui file to watch')
  .option('-p, --port <number>', 'Server port', '3456')
  .option('--no-open', 'Do not open browser automatically')
  .option('-f, --format <format>', 'Preview format', 'svg')
  .action(async (input: string, options: WatchOptions) => {
    const { watch: startWatch } = await import('./watcher/index.js');
    await startWatch(input, {
      port: parseInt(options.port, 10),
      open: options.open,
      format: options.format,
    });
  });

// Check if we should run a subcommand
const subcommand = process.argv[2];

if (subcommand === 'fetch') {
  fetchCommand.parse(['node', 'fetch', ...process.argv.slice(3)]);
} else if (subcommand === 'watch') {
  watchCommand.parse(['node', 'watch', ...process.argv.slice(3)]);
} else {
  // Run main program
  program.parse();
}
