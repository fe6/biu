/** @format */

'use strict';
import { TClientConnection } from '../types';
// base class that users should extend if they are making their own
// server implementation
export default class BaseServer {
  server: any;
  clients: TClientConnection[] = [];
  constructor(server: any) {
    this.server = server;
    this.clients = [];
  }
}
