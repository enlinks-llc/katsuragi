import * as fs from 'node:fs';
import * as path from 'node:path';

const SUPPORTED_FORMATS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];

export interface ImageData {
  dataUri: string;
}

export function resolveImagePath(src: string, basePath?: string): string {
  // Absolute paths are allowed as-is
  if (path.isAbsolute(src)) {
    return src;
  }

  // Relative paths require basePath
  if (!basePath) {
    throw new Error(
      `Cannot resolve relative image path without base path: ${src}`,
    );
  }

  const normalizedBase = path.resolve(basePath);
  const resolved = path.resolve(normalizedBase, src);

  // Prevent path traversal attacks (../ escaping basePath)
  if (
    !resolved.startsWith(normalizedBase + path.sep) &&
    resolved !== normalizedBase
  ) {
    throw new Error(`Image path escapes base directory: ${src}`);
  }

  return resolved;
}

function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

export function loadImageAsDataUri(imagePath: string): ImageData {
  const ext = path.extname(imagePath).toLowerCase();

  if (!SUPPORTED_FORMATS.includes(ext)) {
    throw new Error(`Unsupported image format: ${ext}`);
  }

  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file not found: ${imagePath}`);
  }

  const buffer = fs.readFileSync(imagePath);
  const base64 = buffer.toString('base64');
  const mimeType = getMimeType(ext);

  return {
    dataUri: `data:${mimeType};base64,${base64}`,
  };
}
