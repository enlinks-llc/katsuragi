import type { ViewportConfig, ViewportType } from './types.js';

/** Default timeout in milliseconds */
const DEFAULT_TIMEOUT = 10000;

/** Viewport configurations */
const VIEWPORTS: Record<ViewportType, ViewportConfig> = {
  desktop: {
    width: 1280,
    height: 720,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    defaultRatio: [16, 9],
  },
  mobile: {
    width: 390,
    height: 844,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    defaultRatio: [9, 16],
  },
  tablet: {
    width: 820,
    height: 1180,
    userAgent:
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    defaultRatio: [4, 3],
  },
};

/**
 * Get viewport configuration by type
 */
export function getViewport(type: ViewportType): ViewportConfig {
  return VIEWPORTS[type];
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): URL {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(`Invalid URL protocol: ${parsed.protocol}`);
    }
    return parsed;
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error('Invalid URL format');
    }
    throw e;
  }
}

export interface FetchOptions {
  timeout?: number;
  viewport?: ViewportType;
}

export interface FetchResult {
  html: string;
  contentType: string;
  viewport: ViewportConfig;
}

/**
 * Fetch HTML from a URL
 */
export async function fetchHtml(
  url: string,
  options: FetchOptions = {},
): Promise<FetchResult> {
  const { timeout = DEFAULT_TIMEOUT, viewport = 'desktop' } = options;

  // Validate URL
  validateUrl(url);

  const viewportConfig = getViewport(viewport);

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': viewportConfig.userAgent,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (
      !contentType.includes('text/html') &&
      !contentType.includes('application/xhtml')
    ) {
      throw new Error(
        `URL returned ${contentType.split(';')[0] || 'unknown'}, expected text/html`,
      );
    }

    const html = await response.text();

    return {
      html,
      contentType,
      viewport: viewportConfig,
    };
  } catch (e) {
    if (e instanceof Error) {
      if (e.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms`);
      }
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

export { calculateGrid, parseGridString } from './grid.js';
export { mapAllToComponents, mapToComponent } from './mapper.js';
export { parseHtmlToDom } from './parser.js';
// Re-export types and modules
export type {
  DomElement,
  GridPlacement,
  GridResult,
  ParseResult,
  ViewportConfig,
  ViewportType,
} from './types.js';
