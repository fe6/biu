/** @format */

import path from 'path';
import url from 'url';
import express, { Express } from '@fe6/biu-deps/compiled/express';
import chalk from '@fe6/biu-deps/compiled/chalk';
import fs from '@fe6/biu-deps/compiled/fs-extra';
import { logger } from '@fe6/biu-utils';
import store from '../shared/cache';

class Serve {
  public app: Express;
  constructor() {
    const app = express();
    this.app = app;
  }
  startLogger() {
    const protocol = 'http';
    const hostname = 'localhost';

    const prettyPrintURL = (): string =>
      url.format({
        protocol,
        hostname,
        port: store.config.server.port,
        pathname: '/',
      });

    const urls = prettyPrintURL();
    logger.success(`Local: ${chalk.blue(urls)}`);
  }
  async setup() {
    const staticRoot = store.resolve(store.config.build.outDir);
    this.app.use(express.static(staticRoot));
    const html = await fs.readFile(path.join(staticRoot, 'index.html'), 'utf8');
    this.app.get('*', (req, res) => res.send(html));
    const { port } = store.config.server;
    this.app.listen(port, () => {
      this.startLogger();
    });
  }
}

export default new Serve();
