/** @format */

import glob from '@fe6/biu-deps/compiled/fast-glob';
import { logger } from '@fe6/biu-utils';
import DTSEmitFile from './dts';

const { parentPort } = require('worker_threads');

parentPort.on('message', async (payload: any) => {
  const options = JSON.parse(payload);
  if (options) {
    const dts = new DTSEmitFile();
    dts.setup(options);
    const dtslist = await glob([`${options.appSrc}/**/*.(ts|tsx)`]);
    dtslist.map((d: any) => {
      dts.emit(d, options.alias, options.typesOutDir);
    });
    if (options.isVue) {
      const dtsVuelist = await glob([`${options.appSrc}/**/*.vue`]);
      dtsVuelist.map((d: any) => {
        dts.vueEmit(d);
      });
    }
    dts.createFile(options.appSrc);
    logger.warn('DTS build successfully');
    parentPort.postMessage('finish');
  }
});
