import fs from 'node:fs';
import path from 'node:path';
import { parse } from '../parser/parser.js';
import { generateSvg } from '../svg/generator.js';
import { createPreviewServer } from './server.js';

export interface WatchOptions {
  port: number;
  open: boolean;
  format: string;
}

export async function watch(
  inputPath: string,
  options: WatchOptions,
): Promise<void> {
  const absolutePath = path.resolve(inputPath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }

  const basePath = path.dirname(absolutePath);

  function generate(): { svg?: string; error?: string } {
    try {
      const content = fs.readFileSync(absolutePath, 'utf-8');
      const doc = parse(content);
      const svg = generateSvg(doc, basePath);
      return { svg };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return { error: message };
    }
  }

  // Initial generation
  const initial = generate();

  const server = await createPreviewServer({
    port: options.port,
    initialSvg: initial.svg,
    initialError: initial.error,
  });

  console.log(`Watching ${inputPath}`);
  console.log(`Preview: http://localhost:${server.port}`);

  // Open browser
  if (options.open) {
    try {
      const openModule = await import('open');
      await openModule.default(`http://localhost:${server.port}`);
    } catch {
      // Ignore if open fails (e.g., no browser available)
    }
  }

  // Watch for file changes
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  fs.watch(absolutePath, () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const result = generate();
      if (result.svg) {
        server.send({ type: 'svg', data: result.svg });
      } else if (result.error) {
        server.send({ type: 'error', data: result.error });
      }
    }, 300);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    server.close();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    server.close();
    process.exit(0);
  });
}
