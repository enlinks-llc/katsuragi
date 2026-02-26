import http from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';

const CLIENT_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ktr watch</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; font-family: system-ui, sans-serif; }
    #preview { max-width: 100vw; max-height: 100vh; }
    #preview svg { max-width: 100vw; max-height: 100vh; }
    #error { display: none; position: fixed; top: 0; left: 0; right: 0; padding: 16px 20px; background: #fee; color: #c00; font-family: monospace; font-size: 14px; white-space: pre-wrap; border-bottom: 2px solid #fcc; z-index: 10; }
    #status { position: fixed; bottom: 8px; right: 12px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div id="preview"></div>
  <div id="error"></div>
  <div id="status">watching...</div>
  <script>
    const preview = document.getElementById('preview');
    const error = document.getElementById('error');
    const status = document.getElementById('status');

    function connect() {
      const ws = new WebSocket('ws://' + location.host);
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'svg') {
          preview.innerHTML = msg.data;
          error.style.display = 'none';
          status.textContent = 'updated ' + new Date().toLocaleTimeString();
        } else if (msg.type === 'error') {
          error.textContent = msg.data;
          error.style.display = 'block';
          status.textContent = 'error ' + new Date().toLocaleTimeString();
        }
      };
      ws.onclose = () => {
        status.textContent = 'disconnected, reconnecting...';
        setTimeout(connect, 1000);
      };
    }
    connect();
  </script>
</body>
</html>`;

export interface PreviewMessage {
  type: 'svg' | 'error';
  data: string;
}

export interface PreviewServerOptions {
  port: number;
  initialSvg?: string;
  initialError?: string;
}

export interface PreviewServer {
  port: number;
  send: (msg: PreviewMessage) => void;
  close: () => void;
}

export async function createPreviewServer(
  options: PreviewServerOptions,
): Promise<PreviewServer> {
  let lastMessage: PreviewMessage | null = null;

  if (options.initialSvg) {
    lastMessage = { type: 'svg', data: options.initialSvg };
  } else if (options.initialError) {
    lastMessage = { type: 'error', data: options.initialError };
  }

  // Try to find an available port
  let port = options.port;
  const maxAttempts = 10;

  let httpServer!: http.Server;
  let wss!: WebSocketServer;
  const clients = new Set<WebSocket>();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    httpServer = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(CLIENT_HTML);
    });

    try {
      await new Promise<void>((resolve, reject) => {
        httpServer.once('error', reject);
        httpServer.once('listening', resolve);
        httpServer.listen(port);
      });
      break;
    } catch (e: unknown) {
      httpServer.close();
      if (
        e &&
        typeof e === 'object' &&
        'code' in e &&
        e.code === 'EADDRINUSE'
      ) {
        port++;
        if (attempt === maxAttempts - 1) {
          throw new Error(
            `Could not find available port (tried ${options.port}-${port})`,
          );
        }
      } else {
        throw e;
      }
    }
  }

  wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws) => {
    clients.add(ws);
    if (lastMessage) {
      ws.send(JSON.stringify(lastMessage));
    }
    ws.on('close', () => clients.delete(ws));
  });

  return {
    port,
    send(msg: PreviewMessage) {
      lastMessage = msg;
      const data = JSON.stringify(msg);
      for (const client of clients) {
        if (client.readyState === client.OPEN) {
          client.send(data);
        }
      }
    },
    close() {
      for (const client of clients) {
        client.close();
      }
      wss.close();
      httpServer.close();
    },
  };
}
