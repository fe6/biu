/** @format */

import store from '../../shared/cache';
import wpChain, { WPChain } from '../../shared/wp-chain';

import { TConfig } from '../types';

export type TWebpackChain = (
  chain: WPChain,
  config: TConfig,
) => void | Promise<void>;
class chainConfig {
  constructor() {}
  async setup(): Promise<void> {
    if (store.config.webpackChain) {
      if (typeof store.config.webpackChain === 'function') {
        await store.config.webpackChain(wpChain, store.config);
      }
    }
  }
}
export default new chainConfig();
