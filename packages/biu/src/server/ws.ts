/** @format */

import { Server, IncomingMessage } from 'http';
import { Duplex } from 'stream';
import WebSocket, { WebSocketServer } from '@fe6/biu-deps/compiled/ws';
import chalk from '@fe6/biu-deps/compiled/chalk';
import { logger } from '@fe6/biu-utils';

import { BaseServer } from './base-ws';

export class WebsocketServer extends BaseServer {
  implementation: any;

  constructor(server: any) {
    super(server);
    const options = {
      server,
    };

    this.implementation = new WebSocket.Server(options);

    this.server.on(
      'upgrade',
      (req: IncomingMessage, sock: Duplex, head: Buffer) => {
        if (!this.implementation.shouldHandle(req)) {
          return;
        }

        this.implementation.handleUpgrade(
          req,
          sock,
          head,
          (connection: any) => {
            this.implementation.emit('connection', connection, req);
          },
        );
      },
    );

    this.implementation.on(
      'error',
      /**
       * @param {Error} err
       */
      (err: any) => {
        logger.error(err.message);
      },
    );

    const interval = setInterval(() => {
      this.clients.forEach(
        /**
         * @param {ClientConnection} client
         */
        (client) => {
          if (client.isAlive === false) {
            client.terminate();

            return;
          }

          client.isAlive = false;
          client.ping(() => {});
        },
      );
    }, WebsocketServer.heartbeatInterval);

    this.implementation.on(
      'connection',
      /**
       * @param {ClientConnection} client
       */
      (client: any) => {
        this.clients.push(client);

        client.isAlive = true;

        client.on('pong', () => {
          client.isAlive = true;
        });

        client.on('close', () => {
          this.clients.splice(this.clients.indexOf(client), 1);
        });
      },
    );

    this.implementation.on('close', () => {
      clearInterval(interval);
    });
  }
}
