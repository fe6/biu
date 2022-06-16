/** @format */

import webpack from '@fe6/biu-deps-webpack/compiled/webpack';
import { getConfig } from '../shared/wp-chain';
import Server from '../server';
import store from '../shared/cache';
import { clearConsole } from '../shared/utils';

class devServer {
  server?: Server;
  constructor() {}
  async setup() {
    await this.setServer();
    this.setProcess();
  }
  async setServer() {
    if (store.config.debug.clearLog) clearConsole();
    const config = getConfig();
    const compiler = webpack(config);
    this.server = new Server(compiler);
    this.server.start();
  }
  setProcess() {
    const { server } = this;
    const sigs = ['SIGINT', 'SIGTERM'];
    sigs.forEach(function (sig) {
      process.on(sig, function () {
        server?.stop();
        process.exit();
      });
    });
    process.on('unhandledRejection', (err) => {
      throw err;
    });
  }
}
export default new devServer();
