import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchHtml,
  getViewport,
  validateUrl,
} from '../../src/fetcher/index.js';

describe('validateUrl', () => {
  it('accepts valid HTTP URL', () => {
    const url = validateUrl('http://example.com');
    expect(url.hostname).toBe('example.com');
  });

  it('accepts valid HTTPS URL', () => {
    const url = validateUrl('https://example.com/path?query=1');
    expect(url.hostname).toBe('example.com');
    expect(url.pathname).toBe('/path');
  });

  it('rejects invalid URL format', () => {
    expect(() => validateUrl('not-a-url')).toThrow('Invalid URL format');
    expect(() => validateUrl('')).toThrow('Invalid URL format');
  });

  it('rejects non-HTTP protocols', () => {
    expect(() => validateUrl('ftp://example.com')).toThrow(
      'Invalid URL protocol',
    );
    expect(() => validateUrl('file:///etc/passwd')).toThrow(
      'Invalid URL protocol',
    );
  });
});

describe('getViewport', () => {
  it('returns desktop viewport config', () => {
    const config = getViewport('desktop');

    expect(config.width).toBe(1280);
    expect(config.height).toBe(720);
    expect(config.defaultRatio).toEqual([16, 9]);
    expect(config.userAgent).toContain('Windows');
  });

  it('returns mobile viewport config', () => {
    const config = getViewport('mobile');

    expect(config.width).toBe(390);
    expect(config.height).toBe(844);
    expect(config.defaultRatio).toEqual([9, 16]);
    expect(config.userAgent).toContain('iPhone');
  });

  it('returns tablet viewport config', () => {
    const config = getViewport('tablet');

    expect(config.width).toBe(820);
    expect(config.height).toBe(1180);
    expect(config.defaultRatio).toEqual([4, 3]);
    expect(config.userAgent).toContain('iPad');
  });
});

describe('fetchHtml', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.fetch = originalFetch;
  });

  it('fetches HTML successfully', async () => {
    const mockHtml = '<html><body>Test</body></html>';
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
      text: () => Promise.resolve(mockHtml),
    });

    const result = await fetchHtml('https://example.com');

    expect(result.html).toBe(mockHtml);
    expect(result.contentType).toContain('text/html');
    expect(result.viewport.width).toBe(1280); // desktop default
  });

  it('uses correct User-Agent for mobile viewport', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'text/html' }),
      text: () => Promise.resolve('<html></html>'),
    });

    await fetchHtml('https://example.com', { viewport: 'mobile' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.stringContaining('iPhone'),
        }),
      }),
    );
  });

  it('throws on HTTP error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(fetchHtml('https://example.com/notfound')).rejects.toThrow(
      'HTTP 404: Not Found',
    );
  });

  it('throws on non-HTML content type', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    await expect(fetchHtml('https://example.com/api')).rejects.toThrow(
      'URL returned application/json, expected text/html',
    );
  });

  it('throws on invalid URL', async () => {
    await expect(fetchHtml('not-a-url')).rejects.toThrow('Invalid URL format');
  });

  it('handles timeout', async () => {
    vi.useRealTimers(); // Use real timers for this test

    // Mock fetch to wait for abort signal
    globalThis.fetch = vi.fn().mockImplementation((_url, options) => {
      return new Promise((_, reject) => {
        options?.signal?.addEventListener('abort', () => {
          const error = new Error('Aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    });

    await expect(
      fetchHtml('https://example.com', { timeout: 50 }),
    ).rejects.toThrow('Request timed out after 50ms');
  });
});
