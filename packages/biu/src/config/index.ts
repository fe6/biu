/** @format */

import type { TBiuConfigExport } from './types';
export type { TBiuConfig, TBiuConfigExport, TConfig } from './types';
export { mergeConfig } from './def-conf';
export { Config } from './core';

export function defineConfig(config: TBiuConfigExport): TBiuConfigExport {
  return config;
}
