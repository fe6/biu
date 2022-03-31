/** @format */

'use strict';

import { WebSocketServer } from '@fe6/biu-deps/compiled/ws';
import { logger } from '@fe6/biu-utils';
import BaseServer from './base-server';
import { TClientConnection } from '../types';

export default class WebsocketServer extends BaseServer {
  static heartbeatInterval = 1000;
  implementation: any;
  constructor(server: any) {
    super(server);

    // ! FIX ERROR listen EADDRINUSE: address already in use :::2022
    this.implementation = new WebSocketServer({
      noServer: true,
    });

    this.server.server.on('upgrade', (req: any, sock: any, head: any) => {
      if (!this.implementation.shouldHandle(req)) {
        return;
      }

      this.implementation.handleUpgrade(req, sock, head, (connection: any) => {
        this.implementation.emit('connection', connection, req);
      });
    });

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
      this.clients.forEach((client) => {
        if (client.isAlive === false) {
          client.terminate();

          return;
        }

        client.isAlive = false;
        client.ping(() => {});
      });
    }, WebsocketServer.heartbeatInterval);

    this.implementation.on('connection', (client: TClientConnection) => {
      this.clients.push(client);

      client.isAlive = true;

      client.on('pong', () => {
        client.isAlive = true;
      });

      client.on('close', () => {
        this.clients.splice(this.clients.indexOf(client), 1);
      });
    });

    this.implementation.on('close', () => {
      clearInterval(interval);
    });
  }
}
