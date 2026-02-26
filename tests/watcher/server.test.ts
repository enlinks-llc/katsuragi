import { afterEach, describe, expect, test } from 'vitest';
import { createPreviewServer, type PreviewServer } from '../../src/watcher/server.js';

describe('createPreviewServer', () => {
  let server: PreviewServer | null = null;

  afterEach(() => {
    server?.close();
    server = null;
  });

  test('starts on specified port', async () => {
    server = await createPreviewServer({ port: 13456 });
    expect(server.port).toBe(13456);
  });

  test('finds next available port if busy', async () => {
    const server1 = await createPreviewServer({ port: 13457 });
    server = await createPreviewServer({ port: 13457 });
    expect(server.port).toBe(13458);
    server1.close();
  });

  test('serves HTML on HTTP request', async () => {
    server = await createPreviewServer({ port: 13459 });
    const response = await fetch(`http://localhost:${server.port}`);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('ktr watch');
    expect(html).toContain('WebSocket');
  });
});
