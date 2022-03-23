/** @format */

import { ENUM_ENV, TCmdOptions } from '../types';
import biuCache from '../shared/cache';
import webpackConfig from '../webpack';
import configPlugins from '../config/options/plugins';
import configChain from '../config/options/chain';

const biuExec = async (
  name: string,
  mode: ENUM_ENV,
  cmdOptions: TCmdOptions,
): Promise<void> => {
  // 全局变量配置等初始化 cache & config
  biuCache.setup(mode, cmdOptions);
  //webpack 初始化
  await webpackConfig.setup();
  // 初始化所有 BIU Plugins
  await configPlugins.setup();
  // webpack Chain
  await configChain.setup();
  // 执行cli脚本
  const cilScript = await import(`./${name}`);
  await cilScript.default.setup(cmdOptions);
};

export default biuExec;
