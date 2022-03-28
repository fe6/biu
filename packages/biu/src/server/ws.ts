/** @format */

import { Server } from 'http';
import WebSocket, { WebSocketServer } from '@fe6/biu-deps/compiled/ws';
import chalk from '@fe6/biu-deps/compiled/chalk';

export function createWebSocketServer(server: Server) {
  // const wss = new WebSocket.Server({
  //   noServer: true,
  // });
  const wss = new WebSocketServer({
    port: 8081,
    perMessageDeflate: {
      zlibDeflateOptions: {
        // See zlib defaults.
        chunkSize: 1024,
        memLevel: 7,
        level: 3,
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024,
      },
      // Other options settable:
      clientNoContextTakeover: true, // Defaults to negotiated value.
      serverNoContextTakeover: true, // Defaults to negotiated value.
      serverMaxWindowBits: 10, // Defaults to negotiated value.
      // Below options specified as default values.
      concurrencyLimit: 10, // Limits zlib concurrency for perf.
      threshold: 1024, // Size (in bytes) below which messages
      // should not be compressed if context takeover is disabled.
    },
  });

  server.on('upgrade', (req, socket, head) => {
    if (req.headers['sec-websocket-protocol'] === 'webpack-hmr') {
      wss.handleUpgrade(req, socket as any, head, (ws) => {
        console.log(333333, '333333');
        wss.emit('connection', ws, req);
      });
    }
  });

  wss.on('connection', (socket) => {
    console.log(111111, '111111');
    socket.send(JSON.stringify({ type: 'connected' }));
  });

  wss.on('error', (e: Error & { code: string }) => {
    console.log(e.code, 'e.code');
    if (e.code !== 'EADDRINUSE') {
      console.error(
        chalk.red(`WebSocket server error:\n${e.stack || e.message}`),
      );
    }
  });

  return {
    send(message: string) {
      wss.clients.forEach((client) => {
        console.log(client, 'client');
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    },

    wss,

    close() {
      console.log(9999, '9');
      wss.close();
    },
  };
}
