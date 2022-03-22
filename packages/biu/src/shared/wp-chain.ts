/** @format */

import { logger, webpackChain, fsExtra } from '@fe6/biu-utils';
import { Configuration as WebpackConfiguration } from '@fe6/biu-utils/compiled/webpack';
import store from '../shared/cache';

export { webpackChain as WPChain };

const wpChain = new webpackChain();

export const getConfig = (): WebpackConfiguration => {
  const conf = wpChain.toConfig();

  const { wplogger } = store.config.debug;
  // TODO  && !store.config.build.lib
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
  return conf;
};
export default wpChain;
