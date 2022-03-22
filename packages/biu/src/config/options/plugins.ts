/** @format */

import store from '../../shared/cache';
import wpChain from '../../shared/wp-chain';

import { TConfigPlugin } from '../types';

class ConfigPlugins {
  constructor() {}
  async setup() {
    if (store.config.plugins.length > 0) {
      // 并行执行所有插件方法
      await Promise.all(
        store.config.plugins.map(async (fn: TConfigPlugin) => {
          if (fn) await fn({ wpChain: wpChain, config: store.config });
        }),
      );
    }
  }
}
export default new ConfigPlugins();
