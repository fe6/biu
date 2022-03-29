/** @format */

import webpack from '@fe6/biu-deps-webpack/compiled/webpack';
import { getConfig } from '../shared/wp-chain';
// import store from '../shared/cache';
import Server from '../server';
import { TConfig } from '../config';

class devServer {
  server?: Server;
  constructor() {}
  async setup() {
    await this.setServer();
    this.setProcess();
  }
  async setServer() {
    const config = getConfig();
    // TODO 打开清空
    // if (store.config.debug.clearLog) utils.clearConsole();
    // logger.success(`dev server running at:`);

    const compiler = webpack(config);
    this.server = new Server((config as TConfig).server || {}, compiler);
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
