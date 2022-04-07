/** @format */

import fsExtra from '@fe6/biu-deps/compiled/fs-extra';
import { logger } from '@fe6/biu-utils';
import WPChain from '@fe6/biu-deps-webpack/compiled/webpack-5-chain';
import { Configuration as WebpackConfiguration } from '@fe6/biu-deps-webpack/compiled/webpack';
import store from '../shared/cache';

export { WPChain };

const wpChain = new WPChain();

export const getConfig = (): WebpackConfiguration => {
  const conf = wpChain.toConfig();

  const { wplogger } = store.config.debug;
  // TODO Lib && !store.config.build.lib
  if (wplogger) {
    if (typeof wplogger === 'string') {
      fsExtra
        .writeFile(
          store.getProjectResolve(wplogger),
          `module.exports=${JSON.stringify(conf, null, 2)}`,
        )
        .catch((e) => logger.error(e));
    } else {
      logger.info(JSON.stringify(conf, null, 2));
    }
  }

  // TODO 分模式开发还是打包
  conf.mode = 'development';

  return conf;
};
export default wpChain;
