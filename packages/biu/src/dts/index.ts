/** @format */

import { Compiler } from '@fe6/biu-deps/compiled/webpack';
import { Worker } from 'worker_threads';
import store from '../shared/cache';
import { DTSTLoadertype } from './dts';

const plugin = {
  name: 'DTSPlugin',
};

class DTSPlugin {
  options?: DTSTLoadertype;
  constructor(options: DTSTLoadertype) {
    this.options = options;
  }
  dtsThread: Worker | undefined = undefined;
  apply(compiler: Compiler) {
    compiler.hooks.watchRun.tap('WatchRun', (comp) => {
      if (!this.dtsThread) {
        this.dtsThread = createDtsEmitThread();
      }
      emitDts(this.dtsThread);
    });
    const isTypeForOutDir =
      store.config.build.outDir === store.config.build.typesOutDir;
    isTypeForOutDir &&
      compiler.hooks.afterEmit.tap(plugin, (compilation) => {
        createDtsEmitThreadForBuild();
      });
  }
}

export function createDtsEmitThread() {
  return new Worker(__dirname + '/dtsThread.js');
}

/**
 * build 期间用的dts
 */
export function createDtsEmitThreadForBuild() {
  const dtsThread = createDtsEmitThread();
  emitDts(dtsThread);
  dtsThread.on('message', (res) => {
    dtsThread.terminate();
    if (res === 'finish') dtsThread.terminate();
  });
}

export function emitDts(dtsThread: Worker) {
  dtsThread.postMessage(
    JSON.stringify({
      build: store.config.build,
      mf: store.config.moduleFederation,
      alias: store.config.resolve.alias,
      typesOutDir: store.config.build.typesOutDir,
      needClear: !(
        store.config.build.outDir === store.config.build.typesOutDir
      ),
    }),
  );
}

export default DTSPlugin;
