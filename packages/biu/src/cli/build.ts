/** @format */

import { Configuration, webpack } from '@fe6/biu-deps-webpack/compiled/webpack';
import { logger } from '@fe6/biu-utils';

import { getConfig } from '../shared/wp-chain';
import store from '../shared/cache';
import { clearConsole } from '../shared/utils';
import { createDtsEmitThreadForBuild } from '../dts';

class Build {
  config: Configuration = {};
  constructor() {}
  async setup() {
    /**
     * 兼容输出到 outDir ，为了避开 clear，
     * 所以在 plugin (src\dts\index.ts) 的 afterEmit 期间执行 emit 声明类型文件
     **/
    const isTypeForOutDir =
      store.config.build.outDir === store.config.ts.typesOutDir;
    if (store.config.ts.dts && !isTypeForOutDir) {
      createDtsEmitThreadForBuild();
    }

    this.config = getConfig();

    if (store.config.debug.clearLog) clearConsole();
    logger.ready(`build mode ${store.config.mode}:`);

    webpack(this.config, (err: any, stats: any) => {
      if (err) {
        if (err.details) {
          logger.error(err.details);
        } else {
          logger.error(err.stack || err);
        }
        return;
      }

      if (stats.hasErrors()) {
        logger.error(
          stats.toString({
            // all: false,
            colors: true,
            // errors: true,
          }),
        );
        logger.error('打包失败');
      }

      if (stats.hasWarnings()) {
        logger.warn('打包伴随提示');
        logger.warn(
          stats.toString({
            // all: false,
            colors: true,
            // warnings: true,
          }),
        );
      }

      logger.info(
        stats.toString({
          colors: true,
          all: false,
          assets: true,
          // children: true,
          // chunks: true,
          // timings: true,
          // version: true,
        }) + '\n',
      );
      logger.success(`Compiled successfully.`);
    });
  }
}
export default new Build();
