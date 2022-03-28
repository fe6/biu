/** @format */

import webpack from '@fe6/biu-deps-webpack/compiled/webpack';
import WebpackDevServer from '@fe6/biu-deps-webpack/compiled/webpack-dev-server';
import { logger, utils } from '@fe6/biu-utils';
import { getConfig } from '../shared/wp-chain';
import store from '../shared/cache';
import { createServer } from '../server/server';

class devServer {
  server?: WebpackDevServer;
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
    // //
    // const compiler = webpack(config);
    // this.server = new WebpackDevServer(config.devServer || {}, compiler);
    // this.server.start();

    await createServer({
      cwd: store.root,
      port: 8080, // config.devServer?.port ||
      host: config.devServer?.host,
      webpackConfig: config,
    });
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
