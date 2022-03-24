/** @format */

import webpack from '@fe6/biu-deps/compiled/webpack';
import WebpackDevServer from '@fe6/biu-deps/compiled/webpack-dev-server/lib/Server';
import { logger, utils } from '@fe6/biu-utils';
import { getConfig } from '../shared/wp-chain';
import store from '../shared/cache';

class devServer {
  server?: WebpackDevServer;
  constructor() {}
  async setup() {
    await this.setServer();
    this.setProcess();
  }
  async setServer() {
    const config = getConfig();
    if (store.config.debug.clearLog) utils.clearConsole();
    logger.success(`dev server running at:`);
    //
    const compiler = webpack(config);
    this.server = new WebpackDevServer(config.devServer || {}, compiler);
    this.server.start();
    // this.server.startCallback(() => {})
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
