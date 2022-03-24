/** @format */

import glob from '@fe6/biu-deps/compiled/fast-glob';
import { logger } from '@fe6/biu-utils';
import store from '../shared/cache';
import DTSEmitFile from './dts';

const { parentPort } = require('worker_threads');

parentPort.on('message', async (payload: any) => {
  const options = JSON.parse(payload);
  if (options) {
    const dts = new DTSEmitFile();
    dts.setup(options);
    logger.warn('DTS build');
    const dtslist = await glob([`${store.config.appSrc}/**/*.(ts|tsx)`]);
    dtslist.map((d: any) => {
      dts.emit(d, options.alias, options.typesOutDir);
    });
    dts.createFile();
    parentPort.postMessage('finish');
  }
});
